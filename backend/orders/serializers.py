from rest_framework import serializers

from .models import Order, OrderItem


class CartLineSerializer(serializers.Serializer):
    productId = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1, max_value=20)


class QuoteRequestSerializer(serializers.Serializer):
    items = CartLineSerializer(many=True, allow_empty=False)
    couponCode = serializers.CharField(required=False, allow_blank=True, max_length=40)


class ShippingSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=100)
    lastName = serializers.CharField(max_length=100)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    line1 = serializers.CharField(max_length=255)
    line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    postalCode = serializers.CharField(max_length=20)
    country = serializers.ChoiceField(choices=["US", "CA", "GB", "AU", "NG", "GH", "KE", "ZA"])


class CreateOrderSerializer(QuoteRequestSerializer):
    email = serializers.EmailField()
    shipping = ShippingSerializer()
    paymentMethod = serializers.ChoiceField(choices=["card", "cash_on_delivery"], default="card")
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class VerifyPaymentSerializer(serializers.Serializer):
    orderNumber = serializers.CharField(max_length=20)
    email = serializers.EmailField()
    # Query parameters Flutterwave appends to the redirect URL.
    transactionId = serializers.IntegerField(required=False, min_value=1)
    status = serializers.CharField(required=False, allow_blank=True, max_length=30)


class OrderItemSerializer(serializers.ModelSerializer):
    productId = serializers.SerializerMethodField()
    name = serializers.CharField(source="product_name")
    slug = serializers.CharField(source="product_slug")
    image = serializers.CharField(source="product_image")
    unitPrice = serializers.DecimalField(source="unit_price", max_digits=10, decimal_places=2)
    lineTotal = serializers.DecimalField(source="line_total", max_digits=10, decimal_places=2)

    class Meta:
        model = OrderItem
        fields = ["productId", "name", "slug", "image", "unitPrice", "quantity", "lineTotal"]

    def get_productId(self, obj) -> str | None:
        return str(obj.product_id) if obj.product_id else None


class OrderSerializer(serializers.ModelSerializer):
    orderNumber = serializers.CharField(source="order_number")
    paymentStatus = serializers.CharField(source="payment_status")
    paymentMethod = serializers.CharField(source="payment_method")
    couponCode = serializers.CharField(source="coupon_code")
    shippingCost = serializers.DecimalField(source="shipping_cost", max_digits=10, decimal_places=2)
    trackingNumber = serializers.CharField(source="tracking_number")
    canCancel = serializers.BooleanField(source="can_cancel")
    createdAt = serializers.DateTimeField(source="created_at")
    shipping = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = [
            "orderNumber", "email", "status", "paymentStatus", "paymentMethod", "couponCode",
            "subtotal", "discount", "shippingCost", "tax", "total", "trackingNumber", "canCancel",
            "createdAt", "shipping", "items",
        ]
        read_only_fields = fields

    def get_shipping(self, obj) -> dict:
        return {
            "firstName": obj.first_name,
            "lastName": obj.last_name,
            "phone": obj.phone,
            "line1": obj.line1,
            "line2": obj.line2,
            "city": obj.city,
            "state": obj.state,
            "postalCode": obj.postal_code,
            "country": obj.country,
        }
