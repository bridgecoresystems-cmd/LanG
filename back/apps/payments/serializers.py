from rest_framework import serializers
from .models import Payment
from django.contrib.auth import get_user_model

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class PaymentSerializer(serializers.ModelSerializer):
    student_info = UserShortSerializer(source="student", read_only=True)
    received_by_info = UserShortSerializer(source="received_by", read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)
    course_name = serializers.CharField(source="group.course.name", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", 
            "invoice_number", 
            "student", 
            "student_info",
            "group", 
            "group_name",
            "course_name",
            "amount", 
            "discount",
            "currency", 
            "payment_method", 
            "status", 
            "received_by", 
            "received_by_info",
            "comment", 
            "created_at"
        ]
        read_only_fields = ["id", "invoice_number", "created_at", "received_by"]

    def create(self, validated_data):
        # Set received_by to current user
        validated_data['received_by'] = self.context['request'].user
        return super().create(validated_data)

