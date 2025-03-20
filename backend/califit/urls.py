# URLs da API REST - califit/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions

# API Schema
schema_view = get_schema_view(
    openapi.Info(
        title="CaliFit API",
        default_version='v1',
        description="API para aplicativo de treino calistenia",
        contact=openapi.Contact(email="contato@califit.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

router = routers.DefaultRouter()

# Importar ViewSets
from apps.exercises.views import MuscleGroupViewSet, ExerciseViewSet
from apps.workouts.views import (
    WorkoutViewSet, WorkoutExerciseViewSet, WorkoutScheduleViewSet,
    WorkoutSessionViewSet, ExerciseLogViewSet
)
from apps.gamification.views import (
    AchievementViewSet, ChallengeViewSet, SupplementViewSet
)
from apps.accounts.views import UserViewSet, UserBodyMeasurementViewSet

# Registrar rotas
router.register(r'muscle-groups', MuscleGroupViewSet)
router.register(r'exercises', ExerciseViewSet)
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'workout-exercises', WorkoutExerciseViewSet, basename='workout-exercise')
router.register(r'workout-schedules', WorkoutScheduleViewSet, basename='workout-schedule')
router.register(r'workout-sessions', WorkoutSessionViewSet, basename='workout-session')
router.register(r'exercise-logs', ExerciseLogViewSet, basename='exercise-log')
router.register(r'achievements', AchievementViewSet)
router.register(r'challenges', ChallengeViewSet)
router.register(r'supplements', SupplementViewSet, basename='supplement')
router.register(r'users', UserViewSet, basename='user')
router.register(r'body-measurements', UserBodyMeasurementViewSet, basename='body-measurement')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(router.urls)),
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Documentação
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)