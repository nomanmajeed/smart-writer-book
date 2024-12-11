from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from api.models import Document, AIFeedback
from api.serializers import DocumentSerializer, AIFeedbackSerializer
import openai

class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents and AI suggestions.
    """
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        """
        Return documents owned by the current user or temporary documents for anonymous users.
        """
        if self.request.user.is_authenticated:
            return Document.objects.filter(author=self.request.user)
        else:
            # For anonymous users, return documents with null author
            return Document.objects.filter(author__isnull=True)

    def perform_create(self, serializer):
        """
        Set the author as the current user when creating a document.
        For anonymous users, leave author as null.
        """
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            serializer.save(author=None)

    @action(detail=True, methods=['post'])
    def get_ai_suggestions(self, request, pk=None):
        """
        Get AI-powered suggestions for document content.
        """
        document = self.get_object()
        content = document.content

        try:
            # Initialize OpenAI client
            client = openai.OpenAI()
            
            # Get AI suggestions
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are a helpful writing assistant. Analyze the text and provide grammar and style suggestions."
                    },
                    {
                        "role": "user", 
                        "content": f"Please analyze this text and provide suggestions: {content}"
                    }
                ]
            )

            # Create AI feedback
            suggestion = response.choices[0].message.content
            feedback = AIFeedback.objects.create(
                document=document,
                feedback_type='general',
                start_index=0,
                end_index=len(content),
                suggestion=suggestion
            )

            return Response(AIFeedbackSerializer(feedback).data)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
