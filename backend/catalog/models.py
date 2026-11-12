from decimal import Decimal

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg, Count


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    image = models.URLField(max_length=500, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["id"]

    def __str__(self):
        return self.name


class SkinType(models.Model):
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class ProductQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.CharField(max_length=100, db_index=True)
    skin_types = models.ManyToManyField(SkinType, blank=True, related_name="products")
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    ingredients = models.TextField(blank=True)
    benefits = models.JSONField(default=list, blank=True)
    usage = models.TextField(blank=True)
    image = models.URLField(max_length=500)
    is_best_seller = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    # Ratings imported from the previous storefront are kept so that the
    # displayed average blends them with reviews written on this platform.
    imported_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    imported_review_count = models.PositiveIntegerField(default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ProductQuerySet.as_manager()

    class Meta:
        ordering = ["id"]
        indexes = [models.Index(fields=["price"]), models.Index(fields=["-rating"])]

    def __str__(self):
        return self.name

    @property
    def is_on_sale(self):
        return self.original_price is not None and self.original_price > self.price

    @property
    def discount(self):
        if not self.is_on_sale:
            return None
        return round((1 - self.price / self.original_price) * 100)

    def refresh_rating(self):
        stats = self.reviews.aggregate(avg=Avg("rating"), count=Count("id"))
        count = stats["count"] or 0
        total = Decimal(self.imported_rating) * self.imported_review_count + Decimal(stats["avg"] or 0) * count
        self.review_count = self.imported_review_count + count
        self.rating = round(total / self.review_count, 2) if self.review_count else 0
        self.save(update_fields=["rating", "review_count"])


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    url = models.URLField(max_length=500)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"{self.product.name} #{self.position}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    title = models.CharField(max_length=150, blank=True)
    body = models.TextField()
    verified_purchase = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["product", "user"], name="one_review_per_user_per_product"),
        ]

    def __str__(self):
        return f"{self.product} – {self.rating}★ by {self.user}"


class WishlistItem(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "product"], name="unique_wishlist_item"),
        ]

    def __str__(self):
        return f"{self.user} ♥ {self.product}"
