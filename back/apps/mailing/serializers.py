"""
Serializers for mailing app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Message, MessageRecipient, MessageGroupFilter

User = get_user_model()


class MessageGroupFilterSerializer(serializers.ModelSerializer):
    """Serializer for MessageGroupFilter."""
    group_name = serializers.CharField(source="group.name", read_only=True)
    group_id = serializers.IntegerField(source="group.id", read_only=True)
    
    class Meta:
        model = MessageGroupFilter
        fields = ["id", "group", "group_id", "group_name"]
        read_only_fields = ["id"]


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    recipient_type_display = serializers.CharField(source="get_recipient_type_display", read_only=True)
    group_filters = MessageGroupFilterSerializer(many=True, read_only=True)
    group_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text="List of group IDs for GROUPS or GROUP_TEACHERS recipient type"
    )
    
    class Meta:
        model = Message
        fields = [
            "id",
            "title",
            "content",
            "recipient_type",
            "recipient_type_display",
            "created_by",
            "created_by_name",
            "created_by_username",
            "created_at",
            "scheduled_at",
            "sent_at",
            "is_sent",
            "total_recipients",
            "group_filters",
            "group_ids",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_at",
            "sent_at",
            "is_sent",
            "total_recipients",
        ]
    
    def create(self, validated_data):
        """Create message and handle group filters."""
        group_ids = validated_data.pop("group_ids", [])
        user = self.context["request"].user
        
        # Set created_by to current user
        validated_data["created_by"] = user
        
        # Create message
        message = Message.objects.create(**validated_data)
        
        # Handle group filters if needed
        if message.recipient_type in [Message.RecipientType.GROUPS, Message.RecipientType.GROUP_TEACHERS]:
            if not group_ids:
                raise serializers.ValidationError({
                    "group_ids": "group_ids is required when recipient_type is GROUPS or GROUP_TEACHERS"
                })
            
            from apps.courses.models import Group
            for group_id in group_ids:
                try:
                    group = Group.objects.get(id=group_id)
                    MessageGroupFilter.objects.create(message=message, group=group)
                except Group.DoesNotExist:
                    raise serializers.ValidationError({
                        "group_ids": f"Group with id {group_id} does not exist"
                    })
        
        return message


class MessageRecipientSerializer(serializers.ModelSerializer):
    """Serializer for MessageRecipient model."""
    message_title = serializers.CharField(source="message.title", read_only=True)
    message_content = serializers.CharField(source="message.content", read_only=True)
    message_created_at = serializers.DateTimeField(source="message.created_at", read_only=True)
    recipient_name = serializers.CharField(source="recipient.full_name", read_only=True)
    recipient_username = serializers.CharField(source="recipient.username", read_only=True)
    sender_id = serializers.IntegerField(source="message.created_by.id", read_only=True)
    sender_name = serializers.CharField(source="message.created_by.full_name", read_only=True)
    sender_username = serializers.CharField(source="message.created_by.username", read_only=True)
    
    class Meta:
        model = MessageRecipient
        fields = [
            "id",
            "message",
            "message_title",
            "message_content",
            "message_created_at",
            "recipient",
            "recipient_name",
            "recipient_username",
            "sender_id",
            "sender_name",
            "sender_username",
            "is_read",
            "read_at",
            "received_at",
        ]
        read_only_fields = [
            "id",
            "message",
            "recipient",
            "received_at",
            "read_at",
        ]


class MessageListSerializer(serializers.ModelSerializer):
    """Simplified serializer for message list."""
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)
    recipient_type_display = serializers.CharField(source="get_recipient_type_display", read_only=True)
    
    class Meta:
        model = Message
        fields = [
            "id",
            "title",
            "recipient_type",
            "recipient_type_display",
            "created_by_name",
            "total_recipients",
            "is_sent",
            "created_at",
            "sent_at",
        ]

