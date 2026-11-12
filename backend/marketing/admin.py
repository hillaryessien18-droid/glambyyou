from django.contrib import admin

from .models import ContactMessage, NewsletterSubscriber, Testimonial


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "is_active", "subscribed_at"]
    search_fields = ["email"]


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "rating", "is_published"]
    list_editable = ["is_published"]


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["subject", "email", "is_resolved", "created_at"]
    list_filter = ["is_resolved"]
    list_editable = ["is_resolved"]
