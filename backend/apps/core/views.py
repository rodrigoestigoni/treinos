from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import (
    User, UserBodyMeasurement,
    MuscleGroup, Exercise,
    Workout, WorkoutExercise, WorkoutSession,
    ExerciseRecord, SetRecord,
    Supplement, SupplementRecord,
    Achievement, UserAchievement,
    Challenge, UserChallenge,
    Notification
)

from .serializers import (
    UserSerializer, UserProfileSerializer, UserBodyMeasurementSerializer,
    MuscleGroupSerializer, ExerciseSerializer,
    WorkoutSerializer, WorkoutExerciseSerializer, WorkoutSessionSerializer,
    ExerciseRecordSerializer, SetRecordSerializer,
    SupplementSerializer, SupplementRecordSerializer,
    AchievementSerializer, UserAchievementSerializer,
    ChallengeSerializer, UserChallengeSerializer,
    NotificationSerializer, WorkoutDetailSerializer, WorkoutSessionDetailSerializer
)

# ViewSet para usuários
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
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


class UserBodyMeasurementViewSet(viewsets.ModelViewSet):
    serializer_class = UserBodyMeasurementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserBodyMeasurement.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MuscleGroupViewSet(viewsets.ModelViewSet):
    queryset = MuscleGroup.objects.all()
    serializer_class = MuscleGroupSerializer
    permission_classes = [permissions.IsAuthenticated]


class ExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Exercise.objects.all()
        return Exercise.objects.filter(Q(user=user) | Q(user__is_staff=True))
    
    def perform_create(self, serializer):
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
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WorkoutDetailSerializer
        elif self.action == 'retrieve':
            return WorkoutDetailSerializer
        return WorkoutSerializer
    
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(Q(user=user) | Q(is_template=True))
    
    def perform_create(self, serializer):
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
        for workout_exercise in workout.workout_exercises.all():
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


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutExercise.objects.filter(workout__user=self.request.user)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
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
        xp_earned, level_up = session.complete_session()
        
        serializer = self.get_serializer(session)
        return Response({
            "session": serializer.data,
            "xp_earned": xp_earned,
            "level_up": level_up,
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


class ExerciseRecordViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ExerciseRecord.objects.filter(session__user=self.request.user)


class SetRecordViewSet(viewsets.ModelViewSet):
    serializer_class = SetRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SetRecord.objects.filter(exercise_record__session__user=self.request.user)


class SupplementViewSet(viewsets.ModelViewSet):
    serializer_class = SupplementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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


class SupplementRecordViewSet(viewsets.ModelViewSet):
    serializer_class = SupplementRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SupplementRecord.objects.filter(supplement__user=self.request.user)
    
    def perform_create(self, serializer):
        supplement_id = self.request.data.get('supplement')
        supplement = Supplement.objects.get(id=supplement_id, user=self.request.user)
        serializer.save(supplement=supplement)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_achievements(self, request):
        """Listar conquistas do usuário atual"""
        user_achievements = UserAchievement.objects.filter(user=request.user)
        serializer = UserAchievementSerializer(user_achievements, many=True)
        return Response(serializer.data)


class UserAchievementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user)


class ChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Challenge.objects.filter(is_active=True)
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Participar de um desafio"""
        challenge = self.get_object()
        
        # Verificar se o desafio ainda está aberto
        today = timezone.now().date()
        if today > challenge.end_date:
            return Response(
                {"error": "Este desafio já terminou"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se o usuário já participa
        if UserChallenge.objects.filter(user=request.user, challenge=challenge).exists():
            return Response(
                {"error": "Você já está participando deste desafio"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar participação
        user_challenge = UserChallenge.objects.create(
            user=request.user,
            challenge=challenge
        )
        
        serializer = UserChallengeSerializer(user_challenge)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserChallengeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return UserChallenge.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marcar um desafio como concluído"""
        user_challenge = self.get_object()
        
        if user_challenge.completed:
            return Response(
                {"error": "Este desafio já foi concluído"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_challenge.completed = True
        user_challenge.completed_at = timezone.now()
        user_challenge.save()
        
        # Adicionar XP ao usuário
        challenge = user_challenge.challenge
        level_up = request.user.add_xp(challenge.xp_reward)
        
        # Enviar notificação
        Notification.objects.create(
            user=request.user,
            title=f"Desafio Concluído: {challenge.name}",
            message=f"Parabéns! Você concluiu o desafio '{challenge.name}' e ganhou {challenge.xp_reward} XP!",
            type='achievement',
            icon='challenge_complete',
            action_url='/challenges'
        )
        
        serializer = self.get_serializer(user_challenge)
        return Response({
            "user_challenge": serializer.data,
            "xp_gained": challenge.xp_reward,
            "level_up": level_up
        })


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
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
        return Response({"message": "Todas as notificações foram marcadas como lidas"})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Contar notificações não lidas"""
        count = self.get_queryset().filter(read=False).count()
        return Response({"unread_count": count})