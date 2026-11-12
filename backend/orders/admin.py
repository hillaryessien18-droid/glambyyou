from django.contrib import admin

from .models import Coupon, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "product_name", "unit_price", "quantity"]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "email", "status", "payment_status", "total", "created_at"]
    list_filter = ["status", "payment_status", "payment_method", "created_at"]
    list_editable = ["status"]
    search_fields = ["order_number", "email", "last_name"]
    readonly_fields = ["order_number", "subtotal", "discount", "shipping_cost", "tax", "total", "created_at", "updated_at"]
    inlines = [OrderItemInline]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "value", "min_order_amount", "times_used", "usage_limit", "is_active"]
    list_filter = ["is_active", "discount_type"]
    search_fields = ["code"]
