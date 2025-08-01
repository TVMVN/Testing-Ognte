# Generated by Django 5.2.4 on 2025-07-22 08:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('candidates', '0004_candidate_duration_of_internship_candidate_location'),
    ]

    operations = [
        migrations.AddField(
            model_name='candidate',
            name='internship_focus_area',
            field=models.CharField(default='web-dev', max_length=100),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='candidate',
            name='duration_of_internship',
            field=models.IntegerField(),
        ),
    ]
