from rest_framework import serializers
from django.contrib.auth.models import User
from api.models import Document, AIFeedback
import json

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
    plain_text = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ('id', 'title', 'content', 'plain_text', 'author', 'created_at', 'updated_at', 'is_public', 'ai_feedbacks')
        read_only_fields = ('author', 'created_at', 'updated_at')

    def get_plain_text(self, obj):
        """
        Get the plain text version of the document content
        """
        return obj.get_plain_text()

    def validate_content(self, value):
        """
        Validate that content is a proper Quill delta object
        """
        try:
            # If content is a string, try to parse it as JSON
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    raise serializers.ValidationError("Content must be a valid JSON object")

            # Ensure value is a dict
            if not isinstance(value, dict):
                raise serializers.ValidationError("Content must be a JSON object")
            
            # Validate ops key exists and is a list
            if 'ops' not in value:
                raise serializers.ValidationError("Content must contain 'ops' key")
            
            if not isinstance(value['ops'], list):
                raise serializers.ValidationError("'ops' must be a list")
            
            # Validate each operation in the ops list
            for op in value['ops']:
                if not isinstance(op, dict):
                    raise serializers.ValidationError("Each operation must be an object")
                
                if 'insert' not in op:
                    raise serializers.ValidationError("Each operation must have an 'insert' key")
                
                # Attributes are optional but must be an object if present
                if 'attributes' in op and not isinstance(op['attributes'], dict):
                    raise serializers.ValidationError("Operation attributes must be an object")

            return value

        except Exception as e:
            raise serializers.ValidationError(f"Invalid content format: {str(e)}")

    def to_internal_value(self, data):
        """
        Convert the incoming data to the correct format before validation
        """
        if 'content' in data and data['content'] is None:
            data['content'] = {'ops': []}
        return super().to_internal_value(data)
