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

def fix_missing_profiles():
    print("🔍 Checking for students without profiles...")
    students = User.objects.filter(role='student')
    count = 0
    
    for student in students:
        profile, created = StudentProfile.objects.get_or_create(user=student)
        if created:
            print(f"✅ Created missing profile for: {student.username} (ID: {student.id})")
            count += 1
    
    if count == 0:
        print(" enrollment. No missing profiles found.")
    else:
        print(f"🏁 Done! Fixed {count} profiles.")

if __name__ == "__main__":
    fix_missing_profiles()

