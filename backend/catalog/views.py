from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Product, Review, WishlistItem
from .serializers import CategorySerializer, ProductSerializer, ReviewSerializer, WishlistItemSerializer

# `?sort=` values the storefront sends, mapped to ORM orderings.
SORT_ORDERINGS = {
    "featured": ["-is_best_seller", "id"],
    "price-low": ["price", "id"],
    "price-high": ["-price", "id"],
    "rating": ["-rating", "-review_count"],
    "newest": ["-is_new", "-created_at", "id"],
    "popular": ["-review_count"],
}


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    pagination_class = None
    lookup_field = "slug"

    def get_queryset(self):
        return Category.objects.annotate(item_count=Count("products", filter=Q(products__is_active=True)))


@extend_schema(
    parameters=[
        OpenApiParameter("sort", OpenApiTypes.STR, enum=list(SORT_ORDERINGS)),
        OpenApiParameter("search", OpenApiTypes.STR, description="Search name, description, brand, category, ingredients"),
    ]
)
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    search_fields = ["name", "short_description", "brand", "category__name", "ingredients"]
    ordering_fields = ["price", "rating", "created_at", "name"]
    lookup_field = "slug"

    def get_queryset(self):
        qs = Product.objects.active().select_related("category").prefetch_related("images", "skin_types")
        sort = self.request.query_params.get("sort")
        return qs.order_by(*SORT_ORDERINGS.get(sort, SORT_ORDERINGS["featured"]))

    @action(detail=True)
    def related(self, request, slug=None):
        product = self.get_object()
        related = (
            self.get_queryset()
            .filter(category=product.category)
            .exclude(pk=product.pk)
            .order_by("-rating")[:4]
        )
        return Response(self.get_serializer(related, many=True).data)

    @extend_schema(request=ReviewSerializer, responses=ReviewSerializer(many=True))
    @action(
        detail=True,
        methods=["get", "post"],
        serializer_class=ReviewSerializer,
        permission_classes=[permissions.IsAuthenticatedOrReadOnly],
    )
    def reviews(self, request, slug=None):
        product = get_object_or_404(Product.objects.active(), slug=slug)
        if request.method == "GET":
            page = self.paginate_queryset(product.reviews.select_related("user"))
            return self.get_paginated_response(ReviewSerializer(page, many=True).data)

        serializer = ReviewSerializer(data=request.data, context={"request": request, "product": product})
        serializer.is_valid(raise_exception=True)
        verified = request.user.orders.filter(items__product=product).exclude(status="cancelled").exists()
        serializer.save(product=product, user=request.user, verified_purchase=verified)
        product.refresh_rating()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(responses={200: {"type": "array", "items": {"type": "string"}}})
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def brand_list(_request):
    brands = Product.objects.active().order_by("brand").values_list("brand", flat=True).distinct()
    return Response(list(brands))


class WishlistViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    """The signed-in user's wishlist. DELETE uses the product id, not the row id."""

    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
    lookup_field = "product_id"
    lookup_url_kwarg = "product_id"

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return WishlistItem.objects.none()
        return (
            WishlistItem.objects.filter(user=self.request.user)
            .select_related("product__category")
            .prefetch_related("product__images", "product__skin_types")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item, created = WishlistItem.objects.get_or_create(
            user=request.user, product=serializer.validated_data["product"]
        )
        return Response(
            self.get_serializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ReviewDeleteView(generics.DestroyAPIView):
    """Lets a customer delete their own review."""

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Review.objects.none()
        return Review.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        product = instance.product
        instance.delete()
        product.refresh_rating()
