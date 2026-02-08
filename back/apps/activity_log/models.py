"""
Activity Log models for tracking user actions.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class ActivityLog(models.Model):
    """
    Логирование действий пользователей в системе.
    """
    class ActionType(models.TextChoices):
        VIEW = 'view', _('Просмотр')
        CREATE = 'create', _('Создание')
        UPDATE = 'update', _('Обновление')
        DELETE = 'delete', _('Удаление')
        LOGIN = 'login', _('Вход')
        LOGOUT = 'logout', _('Выход')
        EXPORT = 'export', _('Экспорт')
        IMPORT = 'import', _('Импорт')
        OTHER = 'other', _('Другое')

    # Основная информация
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs',
        verbose_name=_('Пользователь')
    )
    action_type = models.CharField(
        max_length=20,
        choices=ActionType.choices,
        default=ActionType.VIEW,
        verbose_name=_('Тип действия')
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Время действия')
    )
    
    # Информация о странице/компоненте
    page_path = models.CharField(
        max_length=500,
        verbose_name=_('Путь страницы'),
        help_text=_('Например: /cabinet/grades или /management/news')
    )
    component_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name=_('Название компонента'),
        help_text=_('Например: GradesPage.vue или NewsListPage.vue')
    )
    
    # Детали действия
    action_description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Описание действия'),
        help_text=_('Например: "Редактировал студента Amanow Bahtyyar" или "Создал группу English basic winter 124"')
    )
    
    # Метаданные
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_('IP адрес')
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('User Agent')
    )
    
    # Связанный объект (опционально)
    object_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('Тип объекта'),
        help_text=_('Например: Student, Group, Course')
    )
    object_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_('ID объекта')
    )
    object_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name=_('Название объекта'),
        help_text=_('Например: "Amanow Bahtyyar" или "English basic winter 124"')
    )
    
    # Дополнительные данные (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Дополнительные данные')
    )

    class Meta:
        verbose_name = _('Лог активности')
        verbose_name_plural = _('Логи активности')
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action_type', '-timestamp']),
            models.Index(fields=['page_path', '-timestamp']),
        ]

    def __str__(self):
        user_name = self.user.get_full_name() if self.user else 'Аноним'
        return f"{user_name} - {self.get_action_type_display()} - {self.page_path} - {self.timestamp.strftime('%d.%m.%Y %H:%M')}"

