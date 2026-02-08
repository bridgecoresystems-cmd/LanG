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

def list_all_students():
    print("📋 All Users with role='student':")
    students = User.objects.filter(role='student').order_by('id')
    for s in students:
        has_profile = StudentProfile.objects.filter(user=s).exists()
        print(f"ID: {s.id} | Username: {s.username} | Has Profile: {has_profile}")

if __name__ == "__main__":
    list_all_students()

