from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("products", views.ProductViewSet, basename="product")
router.register("wishlist", views.WishlistViewSet, basename="wishlist")
# Wishlist entries are addressed by product id: DELETE /api/wishlist/<product_id>/

urlpatterns = [
    path("brands/", views.brand_list, name="brand-list"),
    path("reviews/<int:pk>/", views.ReviewDeleteView.as_view(), name="review-delete"),
    path("", include(router.urls)),
]
