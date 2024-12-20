# Generated by Django 5.1.4 on 2024-12-11 11:02

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="aifeedback",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AlterModelOptions(
            name="document",
            options={"ordering": ["-created_at"]},
        ),
        migrations.AlterModelOptions(
            name="user",
            options={"verbose_name": "user", "verbose_name_plural": "users"},
        ),
        migrations.AddField(
            model_name="aifeedback",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="user",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name="user",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name="aifeedback",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name="document",
            name="created_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
