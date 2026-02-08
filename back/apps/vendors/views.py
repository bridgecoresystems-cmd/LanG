from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import VendorProfile
from .serializers import VendorProfileSerializer
import uuid

class VendorProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vendor profiles.
    """
    queryset = VendorProfile.objects.all()
    serializer_class = VendorProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == "director":
            return VendorProfile.objects.all()
        return VendorProfile.objects.filter(user=user)

    @action(detail=True, methods=['post'])
    def reset_token(self, request, pk=None):
        """
        Reset the terminal auth token.
        """
        vendor = self.get_object()
        vendor.auth_token = str(uuid.uuid4())
        vendor.save()
        return Response({'auth_token': vendor.auth_token})

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current vendor's profile.
        """
        vendor = get_object_or_404(VendorProfile, user=request.user)
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)

