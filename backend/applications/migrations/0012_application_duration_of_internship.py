# Generated by Django 5.2.4 on 2025-07-29 08:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0011_alter_jobpost_duration_of_internship'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='duration_of_internship',
            field=models.PositiveIntegerField(default=3),
            preserve_default=False,
        ),
    ]
