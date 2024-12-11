from django.db import models
from django.conf import settings
from .base import AuditModel

class Document(AuditModel):
    title = models.CharField(max_length=255)
    content = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class AIFeedback(AuditModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='ai_feedbacks')
    feedback_type = models.CharField(max_length=50)  # grammar, content, style
    start_index = models.IntegerField()
    end_index = models.IntegerField()
    suggestion = models.TextField()

    def __str__(self):
        return f"{self.feedback_type} feedback for {self.document.title}"
