import django_filters
from django.db.models import F

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="iexact")
    minPrice = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    maxPrice = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    skinType = django_filters.CharFilter(field_name="skin_types__name", lookup_expr="icontains", distinct=True)
    sale = django_filters.BooleanFilter(method="filter_sale")
    bestSeller = django_filters.BooleanFilter(field_name="is_best_seller")
    new = django_filters.BooleanFilter(field_name="is_new")
    inStock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = []

    def filter_sale(self, queryset, _name, value):
        on_sale = queryset.filter(original_price__gt=F("price"))
        return on_sale if value else queryset.exclude(pk__in=on_sale.values("pk"))

    def filter_in_stock(self, queryset, _name, value):
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock=0)
