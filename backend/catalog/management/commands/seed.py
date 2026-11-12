import json
import random
import re
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Category, Product, ProductImage, SkinType
from marketing.models import Testimonial
from orders.models import Coupon

SEED_FILE = Path(__file__).resolve().parents[2] / "fixtures" / "seed_data.json"

COUPONS = [
    {"code": "WELCOME10", "description": "10% off your first order", "discount_type": "percent", "value": 10},
    {"code": "GLOW20", "description": "20% off orders over $100", "discount_type": "percent", "value": 20, "min_order_amount": 100},
    {"code": "SAVE15", "description": "$15 off orders over $75", "discount_type": "fixed", "value": 15, "min_order_amount": 75},
]


class Command(BaseCommand):
    help = "Loads the GlowByYou catalog, testimonials and demo coupons. Safe to run repeatedly."

    def add_arguments(self, parser):
        parser.add_argument("--stock", type=int, default=None, help="Set every product's stock to this value")
        parser.add_argument(
            "--cloudinary", action="store_true",
            help="Upload catalog photos to Cloudinary (CLOUDINARY_* env vars) and serve them from there",
        )

    @transaction.atomic
    def handle(self, *args, stock=None, cloudinary=False, **options):
        data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
        rng = random.Random(42)
        image = self.cloudinary_mirror() if cloudinary else (lambda url, folder: url)

        categories = {}
        for c in data["categories"]:
            categories[c["slug"]], _ = Category.objects.update_or_create(
                slug=c["slug"], defaults={"name": c["name"], "image": image(c["image"], "categories")}
            )

        for p in data["products"]:
            product, created = Product.objects.update_or_create(
                slug=p["slug"],
                defaults={
                    "name": p["name"],
                    "description": p["description"],
                    "short_description": p["shortDescription"],
                    "category": categories[p["category"]],
                    "brand": p["brand"],
                    "price": Decimal(str(p["price"])),
                    "original_price": Decimal(str(p["originalPrice"])) if p.get("originalPrice") else None,
                    "ingredients": p.get("ingredients", ""),
                    "benefits": p.get("benefits", []),
                    "usage": p.get("usage", ""),
                    "image": image(p["image"], p["category"]),
                    "is_best_seller": p.get("isBestSeller", False),
                    "is_new": p.get("isNew", False),
                    "imported_rating": Decimal(str(p["rating"])),
                    "imported_review_count": p["reviewCount"],
                },
            )
            if created or stock is not None:
                product.stock = stock if stock is not None else rng.randint(5, 120)
                product.save(update_fields=["stock"])
            product.skin_types.set([SkinType.objects.get_or_create(name=name)[0] for name in p.get("skinType", [])])
            product.images.all().delete()
            ProductImage.objects.bulk_create(
                ProductImage(product=product, url=image(url, p["category"]), position=i)
                for i, url in enumerate(p.get("images", []))
            )
            product.refresh_rating()

        for t in data["testimonials"]:
            Testimonial.objects.update_or_create(
                name=t["name"],
                text=t["text"],
                defaults={
                    "location": t.get("location", ""),
                    "avatar": t.get("avatar", ""),
                    "rating": t.get("rating", 5),
                    "product": t.get("product", ""),
                },
            )

        for coupon in COUPONS:
            Coupon.objects.update_or_create(code=coupon["code"], defaults=coupon)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(categories)} categories, {len(data['products'])} products, "
            f"{len(data['testimonials'])} testimonials and {len(COUPONS)} coupons."
        ))

    def cloudinary_mirror(self):
        """Returns a function that uploads a remote photo once and gives back its Cloudinary URL."""
        if not settings.CLOUDINARY_ENABLED:
            raise CommandError("Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET first.")
        import cloudinary
        import cloudinary.uploader

        cache = {}

        def mirror(url, folder):
            match = re.search(r"photo-[\w-]+", url)
            public_id = f"{settings.CLOUDINARY_FOLDER}/{folder}/{match.group(0) if match else abs(hash(url))}"
            width = 400 if folder == "categories" else 600
            if public_id not in cache:
                # overwrite=False makes re-seeding cheap: existing assets are reused, not re-uploaded.
                cloudinary.uploader.upload(url, public_id=public_id, overwrite=False, resource_type="image")
                self.stdout.write(f"  uploaded {public_id}")
                cache[public_id] = True
            return cloudinary.CloudinaryImage(public_id).build_url(
                width=width, crop="limit", fetch_format="auto", quality="auto"
            )

        return mirror
