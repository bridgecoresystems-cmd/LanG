"""
Mailing models for Language School Management System.
Система рассылок сообщений пользователям.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class Message(models.Model):
    """
    Модель рассылки сообщений.
    Создается завучем или суперпользователем.
    """
    
    class RecipientType(models.TextChoices):
        ALL = "all", _("All Users")
        STUDENTS = "students", _("All Students")
        TEACHERS = "teachers", _("All Teachers")
        DIRECTORS = "directors", _("All Directors")
        HEAD_TEACHERS = "head_teachers", _("All Head Teachers")
        GROUPS = "groups", _("Specific Groups")
        GROUP_TEACHERS = "group_teachers", _("Teachers of Specific Groups")
        CUSTOM = "custom", _("Custom Selection")
    
    # Основная информация
    title = models.CharField(
        max_length=255,
        verbose_name=_("Title"),
        help_text=_("Title of the message")
    )
    content = models.TextField(
        verbose_name=_("Content"),
        help_text=_("Message content")
    )
    
    # Тип получателей
    recipient_type = models.CharField(
        max_length=20,
        choices=RecipientType.choices,
        verbose_name=_("Recipient Type"),
        help_text=_("Type of recipients for this message")
    )
    
    # Создатель сообщения
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_messages",
        verbose_name=_("Created By"),
        help_text=_("User who created this message")
    )
    
    # Временные метки
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Created At")
    )
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Scheduled At"),
        help_text=_("Schedule message for later (optional)")
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Sent At"),
        help_text=_("When the message was actually sent")
    )
    
    # Статус
    is_sent = models.BooleanField(
        default=False,
        verbose_name=_("Is Sent"),
        help_text=_("Whether the message has been sent")
    )
    
    # Метаданные
    total_recipients = models.IntegerField(
        default=0,
        verbose_name=_("Total Recipients"),
        help_text=_("Total number of recipients")
    )
    
    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.title} ({self.get_recipient_type_display()})"


class MessageRecipient(models.Model):
    """
    Модель связи сообщения с получателем.
    Создается автоматически при отправке сообщения.
    """
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="recipients",
        verbose_name=_("Message")
    )
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_messages",
        verbose_name=_("Recipient")
    )
    
    # Статус прочтения
    is_read = models.BooleanField(
        default=False,
        verbose_name=_("Is Read")
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Read At")
    )
    
    # Временная метка получения
    received_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Received At")
    )
    
    class Meta:
        verbose_name = _("Message Recipient")
        verbose_name_plural = _("Message Recipients")
        unique_together = [["message", "recipient"]]
        ordering = ["-received_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["message", "recipient"]),
        ]
    
    def __str__(self):
        return f"{self.message.title} -> {self.recipient.username}"
    
    def mark_as_read(self):
        """Отметить сообщение как прочитанное."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class MessageGroupFilter(models.Model):
    """
    Фильтр групп для рассылки.
    Используется когда recipient_type = GROUPS или GROUP_TEACHERS.
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="group_filters",
        verbose_name=_("Message")
    )
    group = models.ForeignKey(
        "courses.Group",
        on_delete=models.CASCADE,
        related_name="message_filters",
        verbose_name=_("Group")
    )
    
    class Meta:
        verbose_name = _("Message Group Filter")
        verbose_name_plural = _("Message Group Filters")
        unique_together = [["message", "group"]]
    
    def __str__(self):
        return f"{self.message.title} -> {self.group.name}"
