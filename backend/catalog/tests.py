from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Category, Product, SkinType


def make_product(category, name, price, **extra):
    defaults = {
        "slug": name.lower().replace(" ", "-"),
        "description": f"{name} description",
        "short_description": f"{name} short",
        "brand": "GlowByYou",
        "image": "https://images.unsplash.com/photo-1.jpg",
        "stock": 10,
    }
    defaults.update(extra)
    return Product.objects.create(category=category, name=name, price=Decimal(price), **defaults)


class CatalogTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.skincare = Category.objects.create(name="Skincare", slug="skincare")
        cls.perfumes = Category.objects.create(name="Perfumes", slug="perfumes")
        cls.serum = make_product(cls.skincare, "Glow Serum", "68", original_price=Decimal("85"), is_best_seller=True)
        cls.cream = make_product(cls.skincare, "Night Cream", "40", brand="LuxeBeauty")
        cls.scent = make_product(cls.perfumes, "Rose Mist", "120")
        cls.hidden = make_product(cls.perfumes, "Old Perfume", "10", is_active=False)
        cls.serum.skin_types.add(SkinType.objects.create(name="Oily"))
        cls.user = User.objects.create_user("eve@example.com", "Sup3r-Secret-pass", name="Eve")


class ProductListTests(CatalogTestCase):
    def slugs(self, res):
        return [p["slug"] for p in res.data["results"]]

    def test_lists_only_active_products_with_pagination_meta(self):
        res = self.client.get("/api/products/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 3)
        self.assertEqual(res.data["totalPages"], 1)
        self.assertNotIn("old-perfume", self.slugs(res))

    def test_product_shape(self):
        product = self.client.get("/api/products/glow-serum/").data
        self.assertEqual(product["id"], str(self.serum.pk))
        self.assertEqual(product["category"], "skincare")
        self.assertEqual(product["price"], 68)
        self.assertTrue(product["isOnSale"])
        self.assertEqual(product["discount"], 20)
        self.assertEqual(product["skinType"], ["Oily"])
        self.assertTrue(product["inStock"])

    def test_filters(self):
        self.assertEqual(self.slugs(self.client.get("/api/products/?category=perfumes")), ["rose-mist"])
        self.assertEqual(self.slugs(self.client.get("/api/products/?brand=luxebeauty")), ["night-cream"])
        self.assertEqual(self.slugs(self.client.get("/api/products/?sale=true")), ["glow-serum"])
        self.assertEqual(self.slugs(self.client.get("/api/products/?skinType=oil")), ["glow-serum"])
        self.assertEqual(
            sorted(self.slugs(self.client.get("/api/products/?minPrice=30&maxPrice=70"))),
            ["glow-serum", "night-cream"],
        )

    def test_sort_and_search(self):
        self.assertEqual(
            self.slugs(self.client.get("/api/products/?sort=price-low")), ["night-cream", "glow-serum", "rose-mist"]
        )
        self.assertEqual(self.slugs(self.client.get("/api/products/?search=rose")), ["rose-mist"])

    def test_related_products(self):
        res = self.client.get("/api/products/glow-serum/related/")
        self.assertEqual([p["slug"] for p in res.data], ["night-cream"])

    def test_inactive_product_detail_is_404(self):
        self.assertEqual(self.client.get("/api/products/old-perfume/").status_code, status.HTTP_404_NOT_FOUND)

    def test_categories_include_active_counts(self):
        counts = {c["slug"]: c["itemCount"] for c in self.client.get("/api/categories/").data}
        self.assertEqual(counts, {"skincare": 2, "perfumes": 1})

    def test_products_are_read_only(self):
        self.client.force_authenticate(self.user)
        res = self.client.post("/api/products/", {"name": "x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


class ReviewTests(CatalogTestCase):
    def test_review_updates_blended_rating(self):
        Product.objects.filter(pk=self.cream.pk).update(imported_rating=4, imported_review_count=3)
        self.client.force_authenticate(self.user)
        res = self.client.post(
            "/api/products/night-cream/reviews/", {"rating": 5, "title": "Love", "body": "Great"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["verifiedPurchase"])
        self.cream.refresh_from_db()
        self.assertEqual(self.cream.review_count, 4)
        self.assertEqual(self.cream.rating, Decimal("4.25"))

    def test_one_review_per_user(self):
        self.client.force_authenticate(self.user)
        self.client.post("/api/products/night-cream/reviews/", {"rating": 4, "body": "ok"}, format="json")
        res = self.client.post("/api/products/night-cream/reviews/", {"rating": 1, "body": "again"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_must_be_between_1_and_5(self):
        self.client.force_authenticate(self.user)
        res = self.client.post("/api/products/night-cream/reviews/", {"rating": 6, "body": "x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_anonymous_can_read_but_not_write_reviews(self):
        self.assertEqual(self.client.get("/api/products/night-cream/reviews/").status_code, status.HTTP_200_OK)
        res = self.client.post("/api/products/night-cream/reviews/", {"rating": 5, "body": "x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_own_review_recomputes_rating(self):
        self.client.force_authenticate(self.user)
        review_id = self.client.post(
            "/api/products/night-cream/reviews/", {"rating": 2, "body": "meh"}, format="json"
        ).data["id"]
        self.assertEqual(self.client.delete(f"/api/reviews/{review_id}/").status_code, status.HTTP_204_NO_CONTENT)
        self.cream.refresh_from_db()
        self.assertEqual(self.cream.review_count, 0)


class WishlistTests(CatalogTestCase):
    def test_add_list_remove(self):
        self.client.force_authenticate(self.user)
        first = self.client.post("/api/wishlist/", {"productId": self.serum.pk}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        again = self.client.post("/api/wishlist/", {"productId": self.serum.pk}, format="json")
        self.assertEqual(again.status_code, status.HTTP_200_OK)

        items = self.client.get("/api/wishlist/").data
        self.assertEqual([i["product"]["slug"] for i in items], ["glow-serum"])

        self.assertEqual(
            self.client.delete(f"/api/wishlist/{self.serum.pk}/").status_code, status.HTTP_204_NO_CONTENT
        )
        self.assertEqual(self.client.get("/api/wishlist/").data, [])

    def test_requires_auth(self):
        self.assertEqual(self.client.get("/api/wishlist/").status_code, status.HTTP_401_UNAUTHORIZED)
