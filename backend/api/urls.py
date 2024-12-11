from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import DocumentViewSet, UserViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
