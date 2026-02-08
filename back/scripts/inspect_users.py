import os
import django
import sys

# Настройка путей
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

def inspect_users():
    for user_id in [1, 2]:
        try:
            user = User.objects.get(id=user_id)
            has_profile = StudentProfile.objects.filter(user=user).exists()
            groups = user.student_groups.all()
            print(f"👤 User ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")
            print(f"   Has StudentProfile: {has_profile}")
            print(f"   In groups: {[g.name for g in groups]}")
        except User.DoesNotExist:
            print(f"❌ User ID {user_id} not found.")

if __name__ == "__main__":
    inspect_users()

