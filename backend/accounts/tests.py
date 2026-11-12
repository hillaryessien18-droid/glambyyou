from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User

PASSWORD = "Sup3r-Secret-pass"


class AuthTests(APITestCase):
    def register(self, email="ada@example.com", password=PASSWORD):
        return self.client.post(
            reverse("register"), {"name": "Ada Lovelace", "email": email, "password": password}, format="json"
        )

    def test_register_returns_user_and_tokens(self):
        res = self.register()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["user"]["email"], "ada@example.com")
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertTrue(User.objects.get(email="ada@example.com").check_password(PASSWORD))

    def test_register_normalises_email_and_rejects_duplicates(self):
        self.register(email="Ada@Example.com")
        res = self.register(email="ADA@example.com")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_register_rejects_weak_password(self):
        res = self.register(password="12345")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_me(self):
        self.register()
        res = self.client.post(reverse("login"), {"email": "ADA@example.com", "password": PASSWORD}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["name"], "Ada Lovelace")

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        me = self.client.get(reverse("me"))
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["email"], "ada@example.com")

    def test_login_with_wrong_password_fails(self):
        self.register()
        res = self.client.post(reverse("login"), {"email": "ada@example.com", "password": "nope"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_authentication(self):
        self.assertEqual(self.client.get(reverse("me")).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_and_logout_blacklists(self):
        tokens = self.register().data
        refreshed = self.client.post(reverse("token-refresh"), {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        new_refresh = refreshed.data["refresh"]

        # The old refresh token was blacklisted by rotation.
        reused = self.client.post(reverse("token-refresh"), {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(reused.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refreshed.data['access']}")
        out = self.client.post(reverse("logout"), {"refresh": new_refresh}, format="json")
        self.assertEqual(out.status_code, status.HTTP_205_RESET_CONTENT)
        after = self.client.post(reverse("token-refresh"), {"refresh": new_refresh}, format="json")
        self.assertEqual(after.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password(self):
        tokens = self.register().data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        bad = self.client.post(
            reverse("change-password"), {"currentPassword": "wrong", "newPassword": "An0ther-Secret"}, format="json"
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        ok = self.client.post(
            reverse("change-password"), {"currentPassword": PASSWORD, "newPassword": "An0ther-Secret"}, format="json"
        )
        self.assertEqual(ok.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(User.objects.get().check_password("An0ther-Secret"))


class AddressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("bo@example.com", PASSWORD, name="Bo")
        self.other = User.objects.create_user("cy@example.com", PASSWORD, name="Cy")
        self.client.force_authenticate(self.user)

    def payload(self, **overrides):
        data = {
            "firstName": "Bo", "lastName": "Smith", "line1": "1 Main St", "city": "Austin",
            "state": "TX", "postalCode": "73301", "country": "US", "isDefault": True,
        }
        return {**data, **overrides}

    def test_only_one_default_address(self):
        self.client.post("/api/auth/addresses/", self.payload(), format="json")
        self.client.post("/api/auth/addresses/", self.payload(line1="2 Side St"), format="json")
        res = self.client.get("/api/auth/addresses/")
        self.assertEqual([a["isDefault"] for a in res.data], [True, False])
        self.assertEqual(res.data[0]["line1"], "2 Side St")

    def test_cannot_see_other_users_addresses(self):
        self.client.force_authenticate(self.other)
        self.client.post("/api/auth/addresses/", self.payload(), format="json")
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/auth/addresses/").data, [])
