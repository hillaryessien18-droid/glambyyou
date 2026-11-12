import logging

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

from . import payments
from .models import Coupon, Order, OrderItem
from .pricing import build_quote
from .serializers import (
    CreateOrderSerializer,
    OrderSerializer,
    QuoteRequestSerializer,
    VerifyPaymentSerializer,
)

logger = logging.getLogger(__name__)


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
            # Online orders wait for Flutterwave to confirm payment; without
            # Flutterwave keys they run in test mode and are marked paid at once.
            # Cash on delivery stays unpaid until fulfilment.
            online = data["paymentMethod"] == "card"
            awaiting = online and payments.online_payments_enabled()
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                email=data["email"].lower(),
                status=Order.Status.PENDING if awaiting else Order.Status.CONFIRMED,
                payment_status=(
                    Order.PaymentStatus.PAID if online and not awaiting else Order.PaymentStatus.UNPAID
                ),
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

        body = OrderSerializer(order).data
        if awaiting:
            try:
                body["paymentUrl"] = payments.create_payment_link(order)
            except payments.PaymentError as exc:
                with transaction.atomic():
                    Order.objects.select_for_update().get(pk=order.pk).cancel_and_restock()
                return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(body, status=status.HTTP_201_CREATED)

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
            order.cancel_and_restock()
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


class VerifyPaymentView(APIView):
    """Called when Flutterwave redirects the shopper back to the storefront.

    Confirms the payment with Flutterwave before marking the order paid, or
    releases the reserved stock if the shopper backed out.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VerifyPaymentSerializer, responses=OrderSerializer)
    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update(),
                order_number=data["orderNumber"].strip().upper(),
                email=data["email"].strip().lower(),
            )
            if order.awaiting_payment:
                if data.get("status") == "cancelled":
                    order.cancel_and_restock()
                elif data.get("transactionId"):
                    try:
                        tx = payments.verify_transaction(data["transactionId"], order)
                    except payments.PaymentError as exc:
                        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
                    if not tx:
                        return Response(
                            {"detail": "We couldn't confirm your payment, so this order hasn't been charged."},
                            status=status.HTTP_402_PAYMENT_REQUIRED,
                        )
                    order.mark_paid(tx["id"])
        return Response(OrderSerializer(Order.objects.prefetch_related("items").get(pk=order.pk)).data)


class FlutterwaveWebhookView(APIView):
    """Backup confirmation in case the shopper closes the tab before the redirect."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    @extend_schema(exclude=True)
    def post(self, request):
        if not payments.valid_webhook_signature(request.headers.get("verif-hash")):
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        tx = request.data.get("data") or {}
        if request.data.get("event") != "charge.completed" or tx.get("status") != "successful":
            return Response({"received": True})

        with transaction.atomic():
            order = Order.objects.select_for_update().filter(order_number=tx.get("tx_ref")).first()
            if order and order.awaiting_payment:
                try:
                    verified = payments.verify_transaction(tx.get("id"), order)
                except (payments.PaymentError, TypeError, ValueError):
                    logger.exception("Could not verify webhook transaction %s", tx.get("id"))
                    return Response(status=status.HTTP_503_SERVICE_UNAVAILABLE)
                if verified:
                    order.mark_paid(verified["id"])
        return Response({"received": True})
