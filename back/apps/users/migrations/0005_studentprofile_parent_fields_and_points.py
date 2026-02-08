# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_teacherprofile_bio_en_teacherprofile_bio_ru_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='parent1_name',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Parent 1 Name'),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='parent1_phone',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Parent 1 Phone'),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='parent2_name',
            field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Parent 2 Name'),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='parent2_phone',
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name='Parent 2 Phone'),
        ),
        migrations.AddField(
            model_name='studentprofile',
            name='points',
            field=models.PositiveIntegerField(default=0, help_text='Points for student activities', verbose_name='Activity Points'),
        ),
    ]

