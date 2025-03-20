# backend/califit/core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MuscleGroupViewSet, ExerciseViewSet, WorkoutViewSet,
    WorkoutSessionViewSet, SupplementViewSet, AchievementViewSet,
    NotificationViewSet, UserProfileViewSet
)

router = DefaultRouter()
router.register(r'muscle-groups', MuscleGroupViewSet)
router.register(r'exercises', ExerciseViewSet, basename='exercise')
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'workout-sessions', WorkoutSessionViewSet, basename='workout-session')
router.register(r'supplements', SupplementViewSet, basename='supplement')
router.register(r'achievements', AchievementViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'profile', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
]


# backend/califit/califit/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="CaliFit API",
      default_version='v1',
      description="API para o aplicativo CaliFit",
      terms_of_service="https://www.califit.com.br/terms/",
      contact=openapi.Contact(email="contact@califit.com.br"),
      license=openapi.License(name="MIT License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include('core.urls')),
    path('api/v1/auth/', include('dj_rest_auth.urls')),
    path('api/v1/auth/registration/', include('dj_rest_auth.registration.urls')),
    
    # Documentação da API
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Servir mídia em desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)