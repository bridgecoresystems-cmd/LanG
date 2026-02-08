import random
import string
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from .models import User

logger = logging.getLogger(__name__)

def to_septenary(n):
    """Convert a decimal number to base 7 (septenary) string."""
    if n == 0:
        return '0'
    digits = []
    while n:
        digits.append(str(n % 7))
        n //= 7
    return ''.join(reversed(digits))

def clean_turkmen_name(text):
    """
    Replaces Turkmen specific characters with Latin equivalents
    and lowercases the text.
    ж-z, ä-a, ň-n, ö-o, ş-s, ü-u, ý-y
    """
    replacements = {
        'ž': 'z', 'Ž': 'z',
        'ä': 'a', 'Ä': 'a',
        'ň': 'n', 'Ň': 'n',
        'ö': 'o', 'Ö': 'o',
        'ş': 's', 'Ş': 's',
        'ü': 'u', 'Ü': 'u',
        'ý': 'y', 'Ý': 'y',
        # Cyrillic equivalents just in case
        'ж': 'z', 'Ж': 'z',
        'ш': 's', 'Ш': 's',
        'ч': 'c', 'Ч': 'c',
    }
    
    text = text.lower()
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    
    # Remove any non-alphanumeric characters
    return ''.join(c for c in text if c.isalnum())

def generate_unique_username(first_name):
    """
    Generates a unique username like 'merjen00025' where 00025 is septenary suffix.
    """
    base_name = clean_turkmen_name(first_name)
    
    # Get all student usernames
    all_student_usernames = User.objects.filter(role=User.Role.STUDENT).values_list('username', flat=True)
    
    max_decimal = 0
    for uname in all_student_usernames:
        # Extract the last 5 characters
        if len(uname) >= 5:
            suffix_str = uname[-5:]
            # Check if it consists only of septenary digits (0-6)
            if all(c in '0123456' for c in suffix_str):
                try:
                    # Convert septenary string back to decimal to find the real max
                    decimal_val = int(suffix_str, 7)
                    if decimal_val > max_decimal:
                        max_decimal = decimal_val
                except ValueError:
                    continue
    
    next_decimal = max_decimal + 1
    next_septenary = to_septenary(next_decimal).zfill(5)
    
    return f"{base_name}{next_septenary}"

def generate_random_password(length=12):
    """Generate a random secure password."""
    # Using a mix of letters and digits as requested, avoiding too complex symbols for easier manual entry
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def send_welcome_email(user, password):
    """Sends a welcome email with credentials to the student."""
    if not user.email:
        logger.warning(f"Cannot send welcome email to {user.username}: No email provided.")
        return False

    subject = "LanG School - Registration Successful"
    
    message = f"""
Salam, {user.first_name} {user.last_name}!

Siz biziň ulgamymyzda üstünlikli hasaba alyndyňyz.
Siziň ulgama girmek üçin maglumatlaryňyz:

Loginiňyz: {user.username}
Paroluňyz: {password}

Bu paroly hiç kime bermäň.
---
Здравствуйте, {user.first_name} {user.last_name}!

Вы успешно зарегистрированы в нашей системе.
Ваши данные для входа:

Логин: {user.username}
Пароль: {password}

Никому не передавайте этот пароль.
---
Hello, {user.first_name} {user.last_name}!

You have successfully registered in our system.
Your login credentials:

Username: {user.username}
Password: {password}

Do not share this password with anyone.
"""
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or "noreply@lang-school.com",
            [user.email],
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")
        return False
