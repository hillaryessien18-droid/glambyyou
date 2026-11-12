from drf_spectacular.utils import extend_schema
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import NewsletterSubscriber, Testimonial
from .serializers import ContactMessageSerializer, NewsletterSerializer, TestimonialSerializer


class NewsletterSubscribeView(generics.CreateAPIView):
    serializer_class = NewsletterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    @extend_schema(responses={201: dict})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        NewsletterSubscriber.objects.update_or_create(email=email, defaults={"is_active": True})
        return Response({"message": "Successfully subscribed to the newsletter!"}, status=status.HTTP_201_CREATED)


class TestimonialListView(generics.ListAPIView):
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    queryset = Testimonial.objects.filter(is_published=True)


class ContactMessageView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"
