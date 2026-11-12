from rest_framework import serializers

from .models import ContactMessage, NewsletterSubscriber, Testimonial


class NewsletterSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["email"]
        # Uniqueness is handled in the view so re-subscribing isn't an error.
        extra_kwargs = {"email": {"validators": []}}


class TestimonialSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = Testimonial
        fields = ["id", "name", "location", "avatar", "rating", "text", "product"]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["name", "email", "subject", "message"]
