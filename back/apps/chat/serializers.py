from rest_framework import serializers
from .models import Room, Message
from apps.users.serializers import UserSerializer

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = "__all__"

class MessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Message
        fields = "__all__"

