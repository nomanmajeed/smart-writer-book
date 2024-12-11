from django.db import models
from django.utils import timezone

class AuditModel(models.Model):
    """
    An abstract base model that provides self-updating created_at and updated_at fields.
    """
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']