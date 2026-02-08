"""
Chat models for Language School Management System.
WebSocket chat functionality.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Room(models.Model):
    """
    Chat room model.
    Can be associated with a course, group, or be a direct message.
    """
    class RoomType(models.TextChoices):
        COURSE = "course", _("Course Chat")
        GROUP = "group", _("Group Chat")
        DIRECT = "direct", _("Direct Message")
        GENERAL = "general", _("General Chat")
        AI = "ai", _("AI Assistant Chat")

    name = models.CharField(
        max_length=255,
        verbose_name=_("Room Name"),
    )
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.GENERAL,
        verbose_name=_("Room Type"),
    )
    # Related objects
    course = models.ForeignKey(
        "courses.Course",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_rooms",
        verbose_name=_("Course"),
    )
    group = models.ForeignKey(
        "courses.Group",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="chat_rooms",
        verbose_name=_("Group"),
    )
    # Participants
    participants = models.ManyToManyField(
        "users.User",
        related_name="chat_rooms",
        blank=True,
        verbose_name=_("Participants"),
    )
    # Settings
    is_private = models.BooleanField(
        default=False,
        verbose_name=_("Private Room"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )

    class Meta:
        verbose_name = _("Chat Room")
        verbose_name_plural = _("Chat Rooms")
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["room_type"]),
            models.Index(fields=["course"]),
            models.Index(fields=["group"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_room_type_display()})"


class Message(models.Model):
    """
    Chat message model.
    """
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name=_("Room"),
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="chat_messages",
        verbose_name=_("User"),
    )
    content = models.TextField(
        verbose_name=_("Message Content"),
    )
    # File attachments
    file = models.FileField(
        upload_to="chat/files/",
        blank=True,
        null=True,
        verbose_name=_("File Attachment"),
    )
    file_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("File Name"),
    )
    # Message status
    is_edited = models.BooleanField(
        default=False,
        verbose_name=_("Edited"),
    )
    is_deleted = models.BooleanField(
        default=False,
        verbose_name=_("Deleted"),
    )
    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At"),
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Updated At"),
    )

    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["room"]),
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["is_deleted"]),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}... ({self.room.name})"


class MessageReadStatus(models.Model):
    """
    Track read status of messages for each user.
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="read_statuses",
        verbose_name=_("Message"),
    )
    user = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name="read_messages",
        verbose_name=_("User"),
    )
    read_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Read At"),
    )

    class Meta:
        verbose_name = _("Message Read Status")
        verbose_name_plural = _("Message Read Statuses")
        unique_together = [["message", "user"]]
        indexes = [
            models.Index(fields=["message"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user.username} read message {self.message.id}"
