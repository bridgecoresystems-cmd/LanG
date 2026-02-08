import os
import django
import sys

# Настройка путей
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.courses.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()

def find_group_members():
    groups = Group.objects.all()
    print(f"📁 Checking {groups.count()} groups...")
    for g in groups:
        print(f"\nGroup: {g.name}")
        members = g.students.all()
        for m in members:
            print(f"  - Student: {m.username} (ID: {m.id}, Role: {m.role})")

if __name__ == "__main__":
    find_group_members()

