from django.db import models
from django.conf import settings
import json
from .base import AuditModel

class Document(AuditModel):
    title = models.CharField(max_length=255)
    content = models.JSONField(default=dict, blank=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    is_public = models.BooleanField(default=False)

    def __str__(self):
        return self.title

    def get_plain_text(self):
        """
        Extract plain text from Quill content
        """
        try:
            # Handle case where content is a string
            if isinstance(self.content, str):
                try:
                    content = json.loads(self.content)
                except json.JSONDecodeError:
                    return self.content  # Return as is if not valid JSON
            else:
                content = self.content

            # Handle null content
            if not content:
                return ""

            # Handle case where content doesn't have ops
            if not isinstance(content, dict) or 'ops' not in content:
                return str(content)
            
            text = ""
            for op in content['ops']:
                if isinstance(op, dict) and 'insert' in op:
                    text += str(op['insert'])
            return text.strip()
        except Exception as e:
            print(f"Error extracting plain text: {e}")
            return ""  # Return empty string on error

class AIFeedback(AuditModel):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='ai_feedbacks')
    feedback_type = models.CharField(max_length=50)  # grammar, content, style
    start_index = models.IntegerField()
    end_index = models.IntegerField()
    suggestion = models.TextField()

    def __str__(self):
        return f"{self.feedback_type} feedback for {self.document.title}"
