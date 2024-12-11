from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from .base import AuditModel

class User(AbstractUser, AuditModel):
    """
    Custom User model extending Django's AbstractUser and AuditModel.
    Allows for easy addition of custom fields and methods.
    """
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('editor', 'Editor'),
        ('viewer', 'Viewer'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
    last_active = models.DateTimeField(null=True, blank=True)

    class Meta(AbstractUser.Meta):
        db_table = 'auth_user'
        
    def get_writing_stats(self):
        """
        Get user's writing statistics.
        Returns dict with stats like total_documents, total_words, etc.
        """
        from api.models import Document  # Import here to avoid circular import
        
        documents = Document.objects.filter(author=self)
        total_words = sum(len(doc.content.split()) for doc in documents)
        
        return {
            'total_documents': documents.count(),
            'total_words': total_words,
            'average_words_per_document': total_words / documents.count() if documents.count() > 0 else 0,
            'documents_this_month': documents.filter(created_at__month=timezone.now().month).count()
        }

    def has_permission(self, permission_type):
        """
        Check if user has specific permission based on their role.
        """
        role_permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users'],
            'editor': ['read', 'write'],
            'viewer': ['read']
        }
        return permission_type in role_permissions.get(self.role, [])
