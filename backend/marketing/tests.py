from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage, NewsletterSubscriber, Testimonial


class MarketingTests(APITestCase):
    def test_newsletter_subscribe_is_idempotent(self):
        for email in ["Fan@Example.com", "fan@example.com"]:
            res = self.client.post("/api/newsletter/", {"email": email}, format="json")
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)

    def test_newsletter_rejects_invalid_email(self):
        res = self.client.post("/api/newsletter/", {"email": "not-an-email"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_published_testimonials_are_listed(self):
        Testimonial.objects.create(name="A", text="Lovely")
        Testimonial.objects.create(name="B", text="Hidden", is_published=False)
        res = self.client.get("/api/testimonials/")
        self.assertEqual([t["name"] for t in res.data], ["A"])

    def test_contact_message(self):
        res = self.client.post(
            "/api/contact/",
            {"name": "Jo", "email": "jo@example.com", "subject": "Hi", "message": "Question"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_health(self):
        self.assertEqual(self.client.get("/api/health/").json(), {"status": "ok"})
