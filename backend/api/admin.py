from django.contrib import admin

# Register your models here.

from api.models import Document, AIFeedback, User

admin.site.register(User)
admin.site.register(Document)
admin.site.register(AIFeedback)