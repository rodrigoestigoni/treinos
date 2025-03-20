from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, UserBodyMeasurementViewSet,
    MuscleGroupViewSet, ExerciseViewSet,
    WorkoutViewSet, WorkoutExerciseViewSet, WorkoutSessionViewSet,
    ExerciseRecordViewSet, SetRecordViewSet,
    SupplementViewSet, SupplementRecordViewSet,
    AchievementViewSet, UserAchievementViewSet,
    ChallengeViewSet, UserChallengeViewSet,
    NotificationViewSet
)

router = DefaultRouter()

# Usuário e perfil
router.register(r'users', UserViewSet, basename='user')
router.register(r'body-measurements', UserBodyMeasurementViewSet, basename='body-measurement')

# Exercícios
router.register(r'muscle-groups', MuscleGroupViewSet)
router.register(r'exercises', ExerciseViewSet, basename='exercise')

# Treinos
router.register(r'workouts', WorkoutViewSet, basename='workout')
router.register(r'workout-exercises', WorkoutExerciseViewSet, basename='workout-exercise')
router.register(r'workout-sessions', WorkoutSessionViewSet, basename='workout-session')
router.register(r'exercise-records', ExerciseRecordViewSet, basename='exercise-record')
router.register(r'set-records', SetRecordViewSet, basename='set-record')

# Suplementos
router.register(r'supplements', SupplementViewSet, basename='supplement')
router.register(r'supplement-records', SupplementRecordViewSet, basename='supplement-record')

# Gamificação
router.register(r'achievements', AchievementViewSet)
router.register(r'user-achievements', UserAchievementViewSet, basename='user-achievement')
router.register(r'challenges', ChallengeViewSet)
router.register(r'user-challenges', UserChallengeViewSet, basename='user-challenge')

# Notificações
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]