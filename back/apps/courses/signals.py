from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
import requests
import logging
from .models import ExamGrade

logger = logging.getLogger(__name__)

@receiver(post_save, sender=ExamGrade)
def notify_leaderboard_update(sender, instance, **kwargs):
    """
    Notify Chat Service (Bun) that grades have been updated,
    so it can broadcast to landing page clients.
    """
    try:
        chat_service_url = getattr(settings, 'CHAT_SERVICE_URL', 'http://localhost:3001')
        internal_secret = getattr(settings, 'INTERNAL_SECRET', 'your-secret-key')
        
        # We only notify that a specific course's leaderboard might have changed
        # This reduces noise and allows clients to only refresh if needed
        course_id = instance.group.course.id
        
        payload = {
            'type': 'LEADERBOARD_UPDATE',
            'data': {
                'course_id': course_id,
                'course_name': instance.group.course.name
            }
        }
        
        headers = {
            'x-internal-secret': internal_secret,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f"{chat_service_url}/api/system/notify",
            json=payload,
            headers=headers,
            timeout=2
        )
        
        if response.status_code != 200:
            logger.error(f"Failed to notify chat service: {response.status_code} {response.text}")
            
    except Exception as e:
        logger.error(f"Error notifying chat service of grade update: {e}")

