"""
Views for mailing app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Message, MessageRecipient, MessageGroupFilter
from .serializers import (
    MessageSerializer,
    MessageListSerializer,
    MessageRecipientSerializer,
)
from .permissions import CanCreateMessage, CanViewOwnMessages

User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Message model.
    Only head_teacher and superuser can create messages.
    """
    queryset = Message.objects.select_related("created_by").prefetch_related("group_filters__group")
    permission_classes = [CanCreateMessage]
    
    def get_serializer_class(self):
        if self.action == "list":
            return MessageListSerializer
        return MessageSerializer
    
    def get_queryset(self):
        """Filter messages based on user role."""
        user = self.request.user
        
        # Head teacher and superuser can see all messages
        if user.role == "head_teacher" or user.is_superuser:
            return self.queryset.all()
        
        # Others cannot access this endpoint
        return Message.objects.none()
    
    def perform_create(self, serializer):
        """Create message and send it."""
        message = serializer.save()
        
        # Send message immediately (or schedule if scheduled_at is set)
        if not message.scheduled_at or message.scheduled_at <= timezone.now():
            self._send_message(message)
    
    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Manually send a message."""
        message = self.get_object()
        
        if message.is_sent:
            return Response(
                {"detail": "Message has already been sent."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self._send_message(message)
        return Response({"detail": "Message sent successfully."})
    
    @action(detail=True, methods=["get"])
    def recipients(self, request, pk=None):
        """Get all recipients for a message with read status (admin and head_teacher only)."""
        message = self.get_object()
        user = request.user
        
        # Only superuser and head_teacher can see recipients
        if not (user.is_superuser or user.role == "head_teacher"):
            return Response(
                {"detail": "Only superuser and head_teacher can view recipients."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        recipients = MessageRecipient.objects.filter(message=message).select_related("recipient").order_by("-received_at")
        
        # Get read/unread counts
        total = recipients.count()
        read_count = recipients.filter(is_read=True).count()
        unread_count = total - read_count
        
        # Serialize recipients
        from .serializers import MessageRecipientSerializer
        serializer = MessageRecipientSerializer(recipients, many=True)
        
        return Response({
            "message_id": message.id,
            "message_title": message.title,
            "total_recipients": total,
            "read_count": read_count,
            "unread_count": unread_count,
            "read_percentage": round((read_count / total * 100), 2) if total > 0 else 0,
            "recipients": serializer.data
        })
    
    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """Get statistics for a message (admin only)."""
        message = self.get_object()
        user = request.user
        
        # Only superuser can see statistics
        if not user.is_superuser:
            return Response(
                {"detail": "Only superuser can view statistics."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        recipients = MessageRecipient.objects.filter(message=message)
        total = recipients.count()
        read_count = recipients.filter(is_read=True).count()
        unread_count = total - read_count
        
        # Group by role
        from django.db.models import Count, Q
        role_stats = recipients.values('recipient__role').annotate(
            total=Count('id'),
            read=Count('id', filter=Q(is_read=True)),
            unread=Count('id', filter=Q(is_read=False))
        )
        
        return Response({
            "message_id": message.id,
            "message_title": message.title,
            "created_by": {
                "id": message.created_by.id,
                "username": message.created_by.username,
                "full_name": message.created_by.get_full_name() or message.created_by.username,
                "role": message.created_by.role
            },
            "created_at": message.created_at,
            "sent_at": message.sent_at,
            "is_sent": message.is_sent,
            "total_recipients": total,
            "read_count": read_count,
            "unread_count": unread_count,
            "read_percentage": round((read_count / total * 100), 2) if total > 0 else 0,
            "by_role": list(role_stats)
        })
    
    def _send_message(self, message):
        """
        Send message to recipients based on recipient_type.
        Creates MessageRecipient records for each recipient.
        """
        recipients = self._get_recipients(message)
        
        # Create MessageRecipient records
        message_recipients = []
        for recipient in recipients:
            message_recipients.append(
                MessageRecipient(message=message, recipient=recipient)
            )
        
        MessageRecipient.objects.bulk_create(message_recipients, ignore_conflicts=True)
        
        # Update message status
        message.is_sent = True
        message.sent_at = timezone.now()
        message.total_recipients = len(recipients)
        message.save()
    
    def _get_recipients(self, message):
        """
        Get list of recipients based on message recipient_type.
        """
        recipients = []
        
        if message.recipient_type == Message.RecipientType.ALL:
            # All active users
            recipients = list(User.objects.filter(is_active=True))
        
        elif message.recipient_type == Message.RecipientType.STUDENTS:
            # All students
            recipients = list(User.objects.filter(role=User.Role.STUDENT, is_active=True))
        
        elif message.recipient_type == Message.RecipientType.TEACHERS:
            # All teachers
            recipients = list(User.objects.filter(role=User.Role.TEACHER, is_active=True))
        
        elif message.recipient_type == Message.RecipientType.DIRECTORS:
            # All directors
            recipients = list(User.objects.filter(role=User.Role.DIRECTOR, is_active=True))
        
        elif message.recipient_type == Message.RecipientType.HEAD_TEACHERS:
            # All head teachers
            recipients = list(User.objects.filter(role=User.Role.HEAD_TEACHER, is_active=True))
        
        elif message.recipient_type == Message.RecipientType.GROUPS:
            # Students in specific groups
            group_filters = message.group_filters.all()
            if group_filters.exists():
                from apps.courses.models import Group
                group_ids = [gf.group_id for gf in group_filters]
                groups = Group.objects.filter(id__in=group_ids).prefetch_related("students")
                for group in groups:
                    recipients.extend(group.students.filter(is_active=True))
                # Remove duplicates
                recipients = list(set(recipients))
        
        elif message.recipient_type == Message.RecipientType.GROUP_TEACHERS:
            # Teachers of specific groups
            group_filters = message.group_filters.all()
            if group_filters.exists():
                from apps.courses.models import Group
                group_ids = [gf.group_id for gf in group_filters]
                groups = Group.objects.filter(id__in=group_ids).select_related("teacher")
                teachers = [group.teacher for group in groups if group.teacher and group.teacher.is_active]
                # Remove duplicates
                recipients = list(set(teachers))
        
        return recipients


class MessageRecipientViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for MessageRecipient model.
    Users can only view their own messages.
    """
    serializer_class = MessageRecipientSerializer
    permission_classes = [CanViewOwnMessages]
    
    def get_queryset(self):
        """Filter to only show messages for current user."""
        user = self.request.user
        queryset = MessageRecipient.objects.filter(
            recipient=user
        ).select_related("message", "message__created_by", "recipient").order_by("-received_at")
        
        # Filter by read/unread status
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            is_read_bool = is_read.lower() == "true"
            queryset = queryset.filter(is_read=is_read_bool)
        
        return queryset
    
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark message as read."""
        message_recipient = self.get_object()
        
        # Ensure user can only mark their own messages as read
        if message_recipient.recipient != request.user:
            return Response(
                {"detail": "You can only mark your own messages as read."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message_recipient.mark_as_read()
        return Response({"detail": "Message marked as read."})
    
    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Get count of unread messages."""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})
    
    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        """Mark all messages as read."""
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({"detail": f"{updated} messages marked as read."})
