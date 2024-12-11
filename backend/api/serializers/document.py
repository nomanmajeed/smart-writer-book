from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import Document, AIFeedback

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class AIFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIFeedback
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    ai_feedbacks = AIFeedbackSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ('id', 'title', 'content', 'author', 'created_at', 'updated_at', 'is_public', 'ai_feedbacks')
        read_only_fields = ('author', 'created_at', 'updated_at')
