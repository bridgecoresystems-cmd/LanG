from rest_framework import serializers
from .models import Wallet, Transaction
from django.contrib.auth import get_user_model

User = get_user_model()

class UserShortSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "full_name", "role"]

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class WalletSerializer(serializers.ModelSerializer):
    user = UserShortSerializer(read_only=True)
    
    class Meta:
        model = Wallet
        fields = ["id", "user", "balance", "weekly_limit", "updated_at"]

class TransactionSerializer(serializers.ModelSerializer):
    sender_info = UserShortSerializer(source="sender", read_only=True)
    receiver_info = UserShortSerializer(source="receiver", read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            "id", 
            "sender", 
            "receiver", 
            "sender_info", 
            "receiver_info", 
            "amount", 
            "transaction_type", 
            "comment", 
            "timestamp"
        ]
        read_only_fields = ["id", "timestamp"]

class PointTransferSerializer(serializers.Serializer):
    receiver_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    comment = serializers.CharField(required=False, allow_blank=True)

class RFIDPaymentSerializer(serializers.Serializer):
    rfid_uid = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    terminal_id = serializers.CharField()
    auth_token = serializers.CharField()

