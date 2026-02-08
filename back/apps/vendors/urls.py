from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorProfileViewSet

router = DefaultRouter()
router.register(r'profiles', VendorProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

