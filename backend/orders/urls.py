from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("orders/quote/", views.quote_view, name="order-quote"),
    path("orders/track/", views.TrackOrderView.as_view(), name="order-track"),
    path("orders/verify-payment/", views.VerifyPaymentView.as_view(), name="order-verify-payment"),
    path("payments/flutterwave/webhook/", views.FlutterwaveWebhookView.as_view(), name="flutterwave-webhook"),
    path("", include(router.urls)),
]
