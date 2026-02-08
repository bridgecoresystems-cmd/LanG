import os
import sys
import django

# Add project root to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.users.models import User
from apps.chat.models import Room

def init_ai():
    # 1. Create AI User
    ai_user, created = User.objects.get_or_create(
        username="ai_assistant",
        defaults={
            "first_name": "LanG AI",
            "last_name": "Assistant",
            "email": "ai@lang-school.com",
            "role": User.Role.STUDENT, # Give it a role so it can interact
            "is_active": True
        }
    )
    if created:
        ai_user.set_unusable_password()
        ai_user.save()
        print("AI Assistant user created.")
    else:
        print("AI Assistant user already exists.")

    return ai_user

if __name__ == "__main__":
    init_ai()
