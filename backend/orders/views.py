from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from catalog.models import Product

from .models import Coupon, Order, OrderItem
from .pricing import build_quote
from .serializers import CreateOrderSerializer, OrderSerializer, QuoteRequestSerializer


@extend_schema(request=QuoteRequestSerializer, responses={200: dict})
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def quote_view(request):
    """Prices a cart (subtotal, coupon discount, shipping, tax) without placing an order."""
    serializer = QuoteRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    quote = build_quote(serializer.validated_data["items"], serializer.validated_data.get("couponCode", ""))
    return Response(quote.as_dict())


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Orders belonging to the signed-in user. Guests may create orders too."""

    serializer_class = OrderSerializer
    lookup_field = "order_number"

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Order.objects.none()
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    @extend_schema(request=CreateOrderSerializer, responses={201: OrderSerializer})
    def create(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        shipping = data["shipping"]

        with transaction.atomic():
            quote = build_quote(data["items"], data.get("couponCode", ""), lock=True)
            # Payments run in test mode: card orders are marked paid immediately,
            # cash on delivery stays unpaid until fulfilment.
            paid = data["paymentMethod"] == "card"
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                email=data["email"].lower(),
                status=Order.Status.CONFIRMED,
                payment_status=Order.PaymentStatus.PAID if paid else Order.PaymentStatus.UNPAID,
                payment_method=data["paymentMethod"],
                first_name=shipping["firstName"],
                last_name=shipping["lastName"],
                phone=shipping.get("phone", ""),
                line1=shipping["line1"],
                line2=shipping.get("line2", ""),
                city=shipping["city"],
                state=shipping["state"],
                postal_code=shipping["postalCode"],
                country=shipping["country"],
                coupon=quote.coupon,
                coupon_code=quote.coupon.code if quote.coupon else "",
                subtotal=quote.subtotal,
                discount=quote.discount,
                shipping_cost=quote.shipping,
                tax=quote.tax,
                total=quote.total,
                notes=data.get("notes", ""),
            )
            OrderItem.objects.bulk_create(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    product_slug=product.slug,
                    product_image=product.image,
                    unit_price=product.price,
                    quantity=quantity,
                )
                for product, quantity in quote.lines
            )
            for product, quantity in quote.lines:
                Product.objects.filter(pk=product.pk).update(stock=F("stock") - quantity)
            if quote.coupon:
                Coupon.objects.filter(pk=quote.coupon.pk).update(times_used=F("times_used") + 1)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=OrderSerializer)
    @action(detail=True, methods=["post"])
    def cancel(self, request, order_number=None):
        with transaction.atomic():
            order = get_object_or_404(self.get_queryset().select_for_update(), order_number=order_number)
            if not order.can_cancel:
                return Response(
                    {"detail": f"Orders that are {order.status} can no longer be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            for item in order.items.all():
                if item.product_id:
                    Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
            order.status = Order.Status.CANCELLED
            if order.payment_status == Order.PaymentStatus.PAID:
                order.payment_status = Order.PaymentStatus.REFUNDED
            order.save(update_fields=["status", "payment_status", "updated_at"])
        return Response(OrderSerializer(order).data)


class TrackOrderView(APIView):
    """Lets guests look up an order with its number and the email used at checkout."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(
        parameters=[OpenApiParameter("orderNumber", str, required=True), OpenApiParameter("email", str, required=True)],
        responses=OrderSerializer,
    )
    def get(self, request):
        order = get_object_or_404(
            Order.objects.prefetch_related("items"),
            order_number=request.query_params.get("orderNumber", "").strip().upper(),
            email=request.query_params.get("email", "").strip().lower(),
        )
        return Response(OrderSerializer(order).data)
