from django.urls import path

from . import views

urlpatterns = [
    path("newsletter/", views.NewsletterSubscribeView.as_view(), name="newsletter"),
    path("testimonials/", views.TestimonialListView.as_view(), name="testimonials"),
    path("contact/", views.ContactMessageView.as_view(), name="contact"),
]
