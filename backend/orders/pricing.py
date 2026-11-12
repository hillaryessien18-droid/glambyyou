"""Server-side order pricing.

Prices always come from the database, never from the client, so a tampered
request can't change what the customer pays.
"""

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings
from rest_framework.exceptions import ValidationError

from catalog.models import Product

from .models import Coupon

CENT = Decimal("0.01")


@dataclass
class Quote:
    lines: list = field(default_factory=list)  # (product, quantity)
    subtotal: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    shipping: Decimal = Decimal("0")
    tax: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
    coupon: Coupon | None = None

    def as_dict(self):
        return {
            "subtotal": self.subtotal,
            "discount": self.discount,
            "shipping": self.shipping,
            "tax": self.tax,
            "total": self.total,
            "couponCode": self.coupon.code if self.coupon else None,
            "freeShippingThreshold": settings.FREE_SHIPPING_THRESHOLD,
        }


def build_quote(items, coupon_code="", lock=False):
    """Prices a list of {"productId", "quantity"} dicts.

    With lock=True the product rows are locked (SELECT ... FOR UPDATE) so the
    caller can safely decrement stock inside the same transaction.
    """
    quantities = {}
    for item in items:
        quantities[int(item["productId"])] = quantities.get(int(item["productId"]), 0) + int(item["quantity"])

    qs = Product.objects.active().filter(pk__in=quantities)
    if lock:
        qs = qs.select_for_update()
    products = {p.pk: p for p in qs}

    errors = []
    quote = Quote()
    for product_id, quantity in quantities.items():
        product = products.get(product_id)
        if product is None:
            errors.append(f"Product {product_id} is unavailable.")
        elif product.stock < quantity:
            errors.append(f"Only {product.stock} left of {product.name}.")
        else:
            quote.lines.append((product, quantity))
    if errors:
        raise ValidationError({"items": errors})

    quote.subtotal = sum((p.price * q for p, q in quote.lines), Decimal("0"))

    if coupon_code:
        coupon = Coupon.objects.filter(code__iexact=coupon_code.strip()).first()
        if coupon is None:
            raise ValidationError({"couponCode": ["Invalid coupon code."]})
        problem = coupon.check_usable(quote.subtotal)
        if problem:
            raise ValidationError({"couponCode": [problem]})
        quote.coupon = coupon
        quote.discount = coupon.discount_for(quote.subtotal)

    discounted = quote.subtotal - quote.discount
    if discounted >= Decimal(settings.FREE_SHIPPING_THRESHOLD):
        quote.shipping = Decimal("0")
    else:
        quote.shipping = Decimal(str(settings.FLAT_SHIPPING_RATE))
    quote.tax = (discounted * Decimal(str(settings.TAX_RATE))).quantize(CENT, rounding=ROUND_HALF_UP)
    quote.total = (discounted + quote.shipping + quote.tax).quantize(CENT)
    return quote
