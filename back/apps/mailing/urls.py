"""
URLs for mailing app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, MessageRecipientViewSet

router = DefaultRouter()
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"my-messages", MessageRecipientViewSet, basename="my-message")

app_name = "mailing"

urlpatterns = [
    path("", include(router.urls)),
]

