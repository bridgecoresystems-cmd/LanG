import os
import django
import sys

# Add the project root to sys.path so we can import apps
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import StudentProfile

User = get_user_model()

def int_to_base7(n):
    if n == 0:
        return "0"
    digits = ""
    while n:
        digits = str(n % 7) + digits
        n //= 7
    return digits

students_data = [
    ("Arslan", "Hakberdiyew"),
    ("Merjen", "Orazowa"),
    ("Serdar", "Amanow"),
    ("Gulyalek", "Myradowa"),
    ("Batyr", "Saparow"),
    ("Ayna", "Begmyradowa"),
    ("Kerim", "Berdiyew"),
    ("Selbi", "Atayewa"),
    ("Maksat", "Jumayew"),
    ("Leyla", "Esenowa"),
]

def create_demo_students():
    password = "pass123"
    print("🚀 Starting student creation process...")
    
    for i, (first_name, last_name) in enumerate(students_data, 1):
        # Генерируем семеричный ID с дополнением до 5 знаков
        base7_id = int_to_base7(i).zfill(5)
        # Убираем пробелы и приводим к нижнему регистру для логина
        username = f"{first_name.lower()}{base7_id}"
        
        # Создаем пользователя
        if not User.objects.filter(username=username).exists():
            try:
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    role=User.Role.STUDENT
                )
                # Профиль студента обычно создается через сигналы, но создадим явно если нет
                StudentProfile.objects.get_or_create(user=user)
                print(f"✅ Created: {username} ({first_name} {last_name})")
            except Exception as e:
                print(f"❌ Error creating {username}: {e}")
        else:
            print(f"⚠️ Skipped: {username} already exists")
    
    print("🏁 Done!")

if __name__ == "__main__":
    create_demo_students()

