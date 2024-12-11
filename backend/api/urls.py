from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    DocumentViewSet,
    UserViewSet,
    AISuggestionsView,
    WordAnalysisView,
    GrammarCheckView,
    TestView
)

router = DefaultRouter()
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('test/', TestView.as_view(), name='test'),
    path('ai/suggestions/', AISuggestionsView.as_view(), name='ai-suggestions'),
    path('ai/word-analysis/<str:word>/', WordAnalysisView.as_view(), name='word-analysis'),
    path('ai/grammar/', GrammarCheckView.as_view(), name='grammar-check'),
]
