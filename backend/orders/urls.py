from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("orders/quote/", views.quote_view, name="order-quote"),
    path("orders/track/", views.TrackOrderView.as_view(), name="order-track"),
    path("", include(router.urls)),
]
