# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_teacherprofile_liked_by'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('student', 'Student'),
                    ('teacher', 'Teacher'),
                    ('director', 'Director'),
                    ('admin', 'Admin'),
                    ('head_teacher', 'Head Teacher'),
                    ('merchant', 'Merchant')
                ],
                default='student',
                max_length=20,
                verbose_name='Role'
            ),
        ),
    ]

