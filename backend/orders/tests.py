from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from catalog.models import Category, Product

from .models import Coupon, Order
from .payments import PaymentError

SHIPPING = {
    "firstName": "Ada", "lastName": "L", "line1": "1 Main St", "city": "Austin",
    "state": "TX", "postalCode": "73301", "country": "US",
}


class OrderTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Skincare", slug="skincare")
        common = {"category": category, "description": "d", "short_description": "s", "brand": "B",
                  "image": "https://images.unsplash.com/photo-1.jpg"}
        cls.serum = Product.objects.create(name="Serum", slug="serum", price=Decimal("30.00"), stock=5, **common)
        cls.cream = Product.objects.create(name="Cream", slug="cream", price=Decimal("25.00"), stock=1, **common)
        cls.user = User.objects.create_user("ada@example.com", "Sup3r-Secret-pass", name="Ada")
        Coupon.objects.create(code="welcome10", discount_type="percent", value=10)
        Coupon.objects.create(code="BIG", discount_type="fixed", value=15, min_order_amount=100)

    def order_payload(self, **overrides):
        data = {
            "email": "ada@example.com",
            "items": [{"productId": self.serum.pk, "quantity": 2}],
            "shipping": SHIPPING,
            "paymentMethod": "card",
        }
        return {**data, **overrides}

    def test_quote_uses_database_prices(self):
        res = self.client.post(
            "/api/orders/quote/", {"items": [{"productId": self.serum.pk, "quantity": 1}]}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["subtotal"], 30)
        self.assertEqual(res.data["shipping"], Decimal("5.99"))  # under the free-shipping threshold
        self.assertEqual(res.data["tax"], Decimal("2.40"))
        self.assertEqual(res.data["total"], Decimal("38.39"))

    def test_quote_with_coupon_and_free_shipping(self):
        res = self.client.post(
            "/api/orders/quote/",
            {"items": [{"productId": self.serum.pk, "quantity": 2}], "couponCode": "Welcome10"},
            format="json",
        )
        self.assertEqual(res.data["discount"], Decimal("6.00"))
        self.assertEqual(res.data["shipping"], 0)
        self.assertEqual(res.data["couponCode"], "WELCOME10")

    def test_coupon_minimum_is_enforced(self):
        res = self.client.post(
            "/api/orders/quote/",
            {"items": [{"productId": self.serum.pk, "quantity": 1}], "couponCode": "BIG"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("couponCode", res.data)

    def test_guest_checkout_decrements_stock(self):
        res = self.client.post("/api/orders/", self.order_payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["status"], "confirmed")
        self.assertEqual(res.data["paymentStatus"], "paid")
        self.assertEqual(res.data["items"][0]["lineTotal"], 60)
        self.serum.refresh_from_db()
        self.assertEqual(self.serum.stock, 3)
        self.assertIsNone(Order.objects.get().user)

    def test_client_supplied_prices_are_ignored(self):
        payload = self.order_payload(items=[{"productId": self.serum.pk, "quantity": 1, "price": 0.01}], total=0.01)
        res = self.client.post("/api/orders/", payload, format="json")
        self.assertEqual(res.data["subtotal"], 30)

    def test_cannot_order_more_than_stock(self):
        res = self.client.post(
            "/api/orders/", self.order_payload(items=[{"productId": self.cream.pk, "quantity": 2}]), format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)

    def test_signed_in_user_sees_and_cancels_own_orders(self):
        self.client.force_authenticate(self.user)
        number = self.client.post("/api/orders/", self.order_payload(), format="json").data["orderNumber"]

        self.assertEqual(self.client.get("/api/orders/").data["count"], 1)
        cancelled = self.client.post(f"/api/orders/{number}/cancel/")
        self.assertEqual(cancelled.data["status"], "cancelled")
        self.assertEqual(cancelled.data["paymentStatus"], "refunded")
        self.serum.refresh_from_db()
        self.assertEqual(self.serum.stock, 5)

        again = self.client.post(f"/api/orders/{number}/cancel/")
        self.assertEqual(again.status_code, status.HTTP_400_BAD_REQUEST)

    def test_users_cannot_see_others_orders(self):
        number = self.client.post("/api/orders/", self.order_payload(), format="json").data["orderNumber"]
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(f"/api/orders/{number}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_track_order_requires_matching_email(self):
        number = self.client.post("/api/orders/", self.order_payload(), format="json").data["orderNumber"]
        ok = self.client.get("/api/orders/track/", {"orderNumber": number.lower(), "email": "ADA@example.com"})
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        bad = self.client.get("/api/orders/track/", {"orderNumber": number, "email": "x@example.com"})
        self.assertEqual(bad.status_code, status.HTTP_404_NOT_FOUND)

    def test_coupon_usage_is_counted(self):
        self.client.post("/api/orders/", self.order_payload(couponCode="WELCOME10"), format="json")
        self.assertEqual(Coupon.objects.get(code="WELCOME10").times_used, 1)


@override_settings(FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-x", FLUTTERWAVE_SECRET_HASH="hook-secret", PAYMENT_CURRENCY="USD")
class FlutterwavePaymentTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Perfumes", slug="perfumes")
        cls.perfume = Product.objects.create(
            name="Oud", slug="oud", price=Decimal("120.00"), stock=3, category=category, description="d",
            short_description="s", brand="B", image="https://images.unsplash.com/photo-1.jpg",
        )

    def place_order(self):
        with patch("orders.payments._request", return_value={"link": "https://checkout.flutterwave.com/pay/abc"}) as req:
            res = self.client.post("/api/orders/", {
                "email": "ada@example.com", "items": [{"productId": self.perfume.pk, "quantity": 2}],
                "shipping": SHIPPING, "paymentMethod": "card",
            }, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        payload = req.call_args.args[2]
        self.assertEqual(payload["tx_ref"], res.data["orderNumber"])
        self.assertEqual(payload["amount"], str(res.data["total"]))
        return res.data

    def verify(self, order, **extra):
        return self.client.post("/api/orders/verify-payment/", {
            "orderNumber": order["orderNumber"], "email": "ada@example.com", **extra,
        }, format="json")

    def transaction(self, order, **overrides):
        return {"id": 991, "status": "successful", "tx_ref": order["orderNumber"],
                "amount": float(order["total"]), "currency": "USD", **overrides}

    def test_order_waits_for_payment_and_returns_checkout_link(self):
        order = self.place_order()
        self.assertEqual(order["paymentUrl"], "https://checkout.flutterwave.com/pay/abc")
        self.assertEqual((order["status"], order["paymentStatus"]), ("pending", "unpaid"))
        self.perfume.refresh_from_db()
        self.assertEqual(self.perfume.stock, 1)

    def test_verified_transaction_marks_order_paid(self):
        order = self.place_order()
        with patch("orders.payments._request", return_value=self.transaction(order)) as req:
            res = self.verify(order, transactionId=991, status="successful")
        req.assert_called_once_with("GET", "/transactions/991/verify")
        self.assertEqual((res.data["status"], res.data["paymentStatus"]), ("confirmed", "paid"))
        self.assertEqual(Order.objects.get().payment_reference, "991")

    def test_underpaid_or_foreign_transaction_is_rejected(self):
        order = self.place_order()
        for bad in ({"amount": 1}, {"tx_ref": "GBY-OTHER"}, {"currency": "NGN"}, {"status": "failed"}):
            with patch("orders.payments._request", return_value=self.transaction(order, **bad)):
                res = self.verify(order, transactionId=991, status="successful")
            self.assertEqual(res.status_code, status.HTTP_402_PAYMENT_REQUIRED, bad)
        self.assertEqual(Order.objects.get().payment_status, "unpaid")

    def test_cancelled_payment_releases_stock(self):
        order = self.place_order()
        res = self.verify(order, status="cancelled")
        self.assertEqual(res.data["status"], "cancelled")
        self.perfume.refresh_from_db()
        self.assertEqual(self.perfume.stock, 3)

    def test_verify_requires_matching_email(self):
        order = self.place_order()
        res = self.client.post("/api/orders/verify-payment/", {
            "orderNumber": order["orderNumber"], "email": "someone@else.com", "status": "cancelled",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_provider_failure_cancels_order(self):
        with patch("orders.payments._request", side_effect=PaymentError("down")):
            res = self.client.post("/api/orders/", {
                "email": "ada@example.com", "items": [{"productId": self.perfume.pk, "quantity": 1}],
                "shipping": SHIPPING, "paymentMethod": "card",
            }, format="json")
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(Order.objects.get().status, "cancelled")
        self.perfume.refresh_from_db()
        self.assertEqual(self.perfume.stock, 3)

    def test_webhook_requires_secret_hash_and_marks_paid(self):
        order = self.place_order()
        event = {"event": "charge.completed", "data": self.transaction(order)}
        res = self.client.post("/api/payments/flutterwave/webhook/", event, format="json", HTTP_VERIF_HASH="wrong")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        with patch("orders.payments._request", return_value=self.transaction(order)):
            res = self.client.post(
                "/api/payments/flutterwave/webhook/", event, format="json", HTTP_VERIF_HASH="hook-secret"
            )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.get().payment_status, "paid")
