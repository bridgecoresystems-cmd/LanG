from rest_framework import serializers
from .models import VendorProfile
from django.contrib.auth import get_user_model

User = get_user_model()

class VendorProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    
    class Meta:
        model = VendorProfile
        fields = [
            "id", 
            "user",
            "username", 
            "email", 
            "name_tm", 
            "name_ru", 
            "name_en", 
            "description_tm", 
            "description_ru", 
            "description_en", 
            "terminal_id", 
            "auth_token", 
            "is_active", 
            "created_at"
        ]
        read_only_fields = ["id", "auth_token", "created_at"]

