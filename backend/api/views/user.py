from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from api.models import User
from api.serializers import UserSerializer, UserUpdateSerializer, UserStatsSerializer

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user registration and management.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Override to allow registration without authentication
        """
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_serializer_class(self):
        """
        Use different serializers for different actions
        """
        if self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        if self.action == 'stats':
            return UserStatsSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get current user's writing statistics
        """
        user = request.user
        user.last_active = timezone.now()
        user.save()
        serializer = UserStatsSerializer(user)
        return Response(serializer.data)

    def perform_update(self, serializer):
        """
        Update user and record last active time
        """
        serializer.save(last_active=timezone.now())
