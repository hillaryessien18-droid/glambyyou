from django.contrib import admin

from .models import Category, Product, ProductImage, Review, SkinType, WishlistItem


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(SkinType)
class SkinTypeAdmin(admin.ModelAdmin):
    search_fields = ["name"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "brand", "price", "original_price", "stock", "rating", "is_active"]
    list_filter = ["category", "brand", "is_active", "is_best_seller", "is_new"]
    list_editable = ["price", "stock", "is_active"]
    search_fields = ["name", "brand", "short_description"]
    prepopulated_fields = {"slug": ("name",)}
    filter_horizontal = ["skin_types"]
    readonly_fields = ["rating", "review_count", "created_at", "updated_at"]
    inlines = [ProductImageInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "verified_purchase", "created_at"]
    list_filter = ["rating", "verified_purchase"]
    search_fields = ["product__name", "user__email", "body"]

    def delete_model(self, request, obj):
        product = obj.product
        super().delete_model(request, obj)
        product.refresh_rating()


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "created_at"]
