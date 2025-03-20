# backend/califit/core/views.py
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import datetime, timedelta

from .models import (
    User, Exercise, MuscleGroup, Workout, WorkoutExercise, 
    WorkoutSession, ExerciseRecord, SetRecord, Supplement,
    SupplementRecord, Achievement, UserAchievement, Notification
)

from .serializers import (
    UserSerializer, ExerciseSerializer, MuscleGroupSerializer,
    WorkoutSerializer, WorkoutExerciseSerializer, WorkoutSessionSerializer,
    ExerciseRecordSerializer, SetRecordSerializer, SupplementSerializer,
    SupplementRecordSerializer, AchievementSerializer, UserAchievementSerializer,
    NotificationSerializer, WorkoutCreateSerializer, WorkoutDetailSerializer,
    WorkoutSessionDetailSerializer, UserProfileSerializer
)


class MuscleGroupViewSet(viewsets.ModelViewSet):
    """API para gerenciar grupos musculares"""
    queryset = MuscleGroup.objects.all()
    serializer_class = MuscleGroupSerializer
    permission_classes = [IsAuthenticated]


class ExerciseViewSet(viewsets.ModelViewSet):
    """API para gerenciar exercícios"""
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retornar todos os exercícios ou apenas do usuário atual"""
        # Administradores veem todos os exercícios, usuários comuns só veem os próprios
        user = self.request.user
        if user.is_staff:
            return Exercise.objects.all()
        return Exercise.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """Salvar o usuário atual como criador do exercício"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def by_muscle_group(self, request):
        """Listar exercícios agrupados por grupo muscular"""
        muscle_group_id = request.query_params.get('muscle_group_id')
        
        if not muscle_group_id:
            return Response(
                {"error": "Parâmetro muscle_group_id é obrigatório"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filtrar exercícios do usuário e do grupo muscular especificado
        exercises = self.get_queryset().filter(
            muscle_groups__id=muscle_group_id
        )
        
        serializer = self.get_serializer(exercises, many=True)
        return Response(serializer.data)


class WorkoutViewSet(viewsets.ModelViewSet):
    """API para gerenciar treinos"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Selecionar serializer apropriado baseado na ação"""
        if self.action == 'create' or self.action == 'update' or self.action == 'partial_update':
            return WorkoutCreateSerializer
        elif self.action == 'retrieve':
            return WorkoutDetailSerializer
        return WorkoutSerializer
    
    def get_queryset(self):
        """Retornar apenas treinos do usuário atual"""
        return Workout.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Salvar o usuário atual como criador do treino"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def start_session(self, request, pk=None):
        """Iniciar uma sessão de treino"""
        workout = self.get_object()
        
        # Criar nova sessão
        session = WorkoutSession.objects.create(
            user=request.user,
            workout=workout
        )
        
        # Inicializar registros de exercícios
        for workout_exercise in workout.exercises.all():
            exercise_record = ExerciseRecord.objects.create(
                session=session,
                exercise=workout_exercise.exercise,
                workout_exercise=workout_exercise
            )
        
        serializer = WorkoutSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def templates(self, request):
        """Listar treinos marcados como templates"""
        templates = self.get_queryset().filter(is_template=True)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """API para gerenciar sessões de treino"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return WorkoutSessionDetailSerializer
        return WorkoutSessionSerializer
    
    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marcar sessão de treino como completa"""
        session = self.get_object()
        
        if session.end_time:
            return Response(
                {"error": "Esta sessão já foi finalizada"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Finalizar sessão e calcular estatísticas
        xp_earned = session.complete_session()
        
        serializer = self.get_serializer(session)
        return Response({
            "session": serializer.data,
            "xp_earned": xp_earned,
            "message": "Sessão finalizada com sucesso!"
        })
    
    @action(detail=True, methods=['post'])
    def record_set(self, request, pk=None):
        """Registrar série de exercício completada"""
        session = self.get_object()
        
        # Validar dados
        exercise_id = request.data.get('exercise_id')
        set_number = request.data.get('set_number')
        actual_reps = request.data.get('actual_reps')
        weight = request.data.get('weight', None)
        
        if not all([exercise_id, set_number, actual_reps]):
            return Response(
                {"error": "Dados incompletos. Informe exercise_id, set_number e actual_reps."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Obter ou criar registro de exercício
            exercise_record = ExerciseRecord.objects.get(
                session=session,
                exercise_id=exercise_id
            )
            
            # Criar ou atualizar registro de série
            set_record, created = SetRecord.objects.update_or_create(
                exercise_record=exercise_record,
                set_number=set_number,
                defaults={
                    'actual_reps': actual_reps,
                    'weight': weight,
                    'completed': True
                }
            )
            
            serializer = SetRecordSerializer(set_record)
            return Response(serializer.data)
            
        except ExerciseRecord.DoesNotExist:
            return Response(
                {"error": "Exercício não encontrado nesta sessão."}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Obter sessões recentes para o feed de atividades"""
        days = int(request.query_params.get('days', 7))
        
        # Limitar a um máximo de 30 dias
        if days > 30:
            days = 30
        
        start_date = timezone.now() - timedelta(days=days)
        sessions = self.get_queryset().filter(
            end_time__isnull=False,
            end_time__gte=start_date
        ).order_by('-end_time')
        
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class SupplementViewSet(viewsets.ModelViewSet):
    """API para gerenciar suplementos"""
    serializer_class = SupplementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Supplement.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def take(self, request, pk=None):
        """Registrar que tomou o suplemento"""
        supplement = self.get_object()
        
        record = SupplementRecord.objects.create(
            supplement=supplement,
            taken=True
        )
        
        serializer = SupplementRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def skip(self, request, pk=None):
        """Registrar que pulou o suplemento"""
        supplement = self.get_object()
        
        record = SupplementRecord.objects.create(
            supplement=supplement,
            taken=False
        )
        
        serializer = SupplementRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Listar suplementos para hoje"""
        today = timezone.now().date()
        weekday = today.weekday()  # 0-6 (segunda a domingo)
        
        # Suplementos diários
        daily_supplements = self.get_queryset().filter(frequency='daily')
        
        # Suplementos para dias específicos
        custom_supplements = self.get_queryset().filter(
            frequency='custom',
            days__contains=str(weekday)
        )
        
        # Suplementos para dias de treino
        workout_day_supplements = []
        
        # Verificar se há alguma sessão de treino para hoje
        has_workout_today = WorkoutSession.objects.filter(
            user=request.user,
            start_time__date=today
        ).exists()
        
        if has_workout_today:
            workout_day_supplements = self.get_queryset().filter(frequency='workout_day')
        
        # Combinar resultados
        all_supplements = list(daily_supplements) + list(custom_supplements) + list(workout_day_supplements)
        serializer = self.get_serializer(all_supplements, many=True)
        
        return Response(serializer.data)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """API para listar conquistas (somente leitura)"""
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_achievements(self, request):
        """Listar conquistas do usuário atual"""
        user_achievements = UserAchievement.objects.filter(user=request.user)
        
        # Preparar dados para exibição
        result = []
        for user_achievement in user_achievements:
            achievement = user_achievement.achievement
            result.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'xp_reward': achievement.xp_reward,
                'icon_name': achievement.icon_name,
                'earned_date': user_achievement.earned_date
            })
        
        return Response(result)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """API para gerenciar notificações"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar notificação como lida"""
        notification = self.get_object()
        notification.read = True
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marcar todas as notificações como lidas"""
        self.get_queryset().update(read=True)
        return Response({"status": "Todas as notificações foram marcadas como lidas"})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Contar notificações não lidas"""
        count = self.get_queryset().filter(read=False).count()
        return Response({"unread_count": count})


class UserProfileViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin, mixins.UpdateModelMixin):
    """API para gerenciar perfil de usuário"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obter estatísticas do usuário"""
        user = request.user
        
        # Estatísticas básicas
        total_workouts = WorkoutSession.objects.filter(
            user=user, 
            end_time__isnull=False
        ).count()
        
        total_duration = WorkoutSession.objects.filter(
            user=user,
            end_time__isnull=False
        ).aggregate(Sum('duration'))['duration__sum'] or 0
        
        # Formatar em horas
        total_hours = total_duration / 3600
        
        # Treinos por grupo muscular
        muscle_groups = MuscleGroup.objects.all()
        muscle_group_stats = []
        
        for group in muscle_groups:
            count = ExerciseRecord.objects.filter(
                session__user=user,
                session__end_time__isnull=False,
                exercise__muscle_groups=group
            ).count()
            
            muscle_group_stats.append({
                'name': group.name,
                'count': count
            })
        
        # Estatísticas de streak
        max_streak = user.streak_count  # Simplificação - em um app real, você rastrearia o máximo histórico
        current_streak = user.streak_count
        
        # Estatísticas de XP e nível
        next_level_xp = user.level * 100
        
        # Calcular número de dias treinados nos últimos 30 dias
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        workout_dates = WorkoutSession.objects.filter(
            user=user,
            end_time__isnull=False,
            start_time__date__gte=thirty_days_ago
        ).values('start_time__date').distinct().count()
        
        return Response({
            'total_workouts': total_workouts,
            'total_hours': round(total_hours, 1),
            'current_streak': current_streak,
            'max_streak': max_streak,
            'level': user.level,
            'total_xp': user.total_xp,
            'xp_to_next_level': user.xp_to_next_level,
            'level_progress': user.level_progress_percentage,
            'muscle_group_stats': muscle_group_stats,
            'days_trained_last_30': workout_dates
        })