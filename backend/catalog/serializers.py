from rest_framework import serializers

from .models import Category, Product, Review, WishlistItem


class CategorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    itemCount = serializers.IntegerField(source="item_count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "description", "itemCount"]


class ProductSerializer(serializers.ModelSerializer):
    """Product shape consumed by the Next.js frontend (camelCase keys)."""

    id = serializers.CharField(read_only=True)
    shortDescription = serializers.CharField(source="short_description")
    originalPrice = serializers.DecimalField(source="original_price", max_digits=10, decimal_places=2, allow_null=True)
    reviewCount = serializers.IntegerField(source="review_count")
    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    categoryName = serializers.CharField(source="category.name", read_only=True)
    skinType = serializers.SlugRelatedField(source="skin_types", slug_field="name", many=True, read_only=True)
    images = serializers.SerializerMethodField()
    isBestSeller = serializers.BooleanField(source="is_best_seller")
    isNew = serializers.BooleanField(source="is_new")
    isOnSale = serializers.BooleanField(source="is_on_sale", read_only=True)
    discount = serializers.IntegerField(read_only=True, allow_null=True)
    inStock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "shortDescription", "price", "originalPrice",
            "rating", "reviewCount", "category", "categoryName", "brand", "skinType", "ingredients",
            "benefits", "usage", "image", "images", "isBestSeller", "isNew", "isOnSale", "discount",
            "stock", "inStock",
        ]
        read_only_fields = fields

    def get_images(self, obj) -> list[str]:
        urls = [img.url for img in obj.images.all()]
        return urls or [obj.image]

    def get_inStock(self, obj) -> bool:
        return obj.stock > 0


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source="user.name", read_only=True)
    verifiedPurchase = serializers.BooleanField(source="verified_purchase", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "rating", "title", "body", "author", "verifiedPurchase", "createdAt"]

    def validate(self, attrs):
        request = self.context["request"]
        product = self.context["product"]
        if Review.objects.filter(product=product, user=request.user).exists():
            raise serializers.ValidationError("You have already reviewed this product.")
        return attrs


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    productId = serializers.PrimaryKeyRelatedField(
        source="product", queryset=Product.objects.active(), write_only=True
    )
    addedAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "productId", "addedAt"]
