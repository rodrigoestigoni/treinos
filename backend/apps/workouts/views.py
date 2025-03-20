# Visualizações para API REST - workouts/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from .models import Workout, WorkoutExercise, WorkoutSchedule, WorkoutSession, ExerciseLog
from .serializers import (
    WorkoutSerializer, WorkoutExerciseSerializer, WorkoutScheduleSerializer,
    WorkoutSessionSerializer, ExerciseLogSerializer
)

class WorkoutViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['difficulty', 'is_template']
    search_fields = ['name', 'description']
    
    def get_queryset(self):
        user = self.request.user
        return Workout.objects.filter(user=user) | Workout.objects.filter(is_template=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def copy_template(self, request, pk=None):
        """Copia um treino modelo para o usuário"""
        template = self.get_object()
        
        if not template.is_template:
            return Response(
                {"detail": "This workout is not a template."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cria uma cópia do treino
        new_workout = Workout.objects.create(
            name=f"Cópia de {template.name}",
            description=template.description,
            user=request.user,
            is_template=False,
            estimated_duration=template.estimated_duration,
            difficulty=template.difficulty
        )
        
        # Copia os exercícios
        for template_ex in template.workout_exercises.all():
            WorkoutExercise.objects.create(
                workout=new_workout,
                exercise=template_ex.exercise,
                order=template_ex.order,
                sets=template_ex.sets,
                target_reps=template_ex.target_reps,
                rest_duration=template_ex.rest_duration,
                notes=template_ex.notes
            )
        
        return Response(
            WorkoutSerializer(new_workout).data,
            status=status.HTTP_201_CREATED
        )


class WorkoutExerciseViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutExercise.objects.filter(workout__user=self.request.user)


class WorkoutScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return WorkoutSchedule.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def this_week(self, request):
        """Retorna o cronograma de treinos para a semana atual"""
        schedules = self.get_queryset()
        today = timezone.now().weekday()
        
        # Reorganizar para que o dia atual seja o primeiro
        result = []
        for i in range(7):
            day = (today + i) % 7
            day_schedules = schedules.filter(day_of_week=day)
            
            result.append({
                'day': day,
                'day_name': WorkoutSchedule.DAYS_OF_WEEK[day][1],
                'is_today': i == 0,
                'schedules': WorkoutScheduleSerializer(day_schedules, many=True).data
            })
        
        return Response(result)


class WorkoutSessionViewSet(viewsets.ModelViewSet):
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['completed', 'workout']
    
    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        instance = serializer.save(
            user=self.request.user,
            start_time=timezone.now()
        )
        
        # Atualize a contagem de streak se este é um novo dia de treino
        user = self.request.user
        today = timezone.now().date()
        
        if not user.last_workout_date or user.last_workout_date != today:
            if user.last_workout_date and (today - user.last_workout_date).days == 1:
                # Dia consecutivo - aumenta streak
                user.streak_count += 1
            elif not user.last_workout_date or (today - user.last_workout_date).days > 1:
                # Streak quebrado - reinicia
                user.streak_count = 1
            
            user.last_workout_date = today
            user.save()
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Marca uma sessão de treino como concluída"""
        session = self.get_object()
        
        if session.completed:
            return Response(
                {"detail": "This session is already completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.completed = True
        session.end_time = timezone.now()
        session.save()
        
        # Adicionar XP ao usuário
        user = request.user
        xp_gained = 50  # XP base por treino concluído
        
        # Bônus para cada exercício com todas as séries completas
        completed_exercises = set()
        for log in session.exercise_logs.all():
            completed_exercises.add(log.workout_exercise.id)
        
        xp_gained += len(completed_exercises) * 5
        
        # Bônus de streak
        if user.streak_count >= 7:
            xp_gained += 25
        elif user.streak_count >= 3:
            xp_gained += 10
        
        level_up = user.add_xp(xp_gained)
        
        return Response({
            'session': WorkoutSessionSerializer(session).data,
            'xp_gained': xp_gained,
            'level_up': level_up,
            'new_level': user.level if level_up else None
        })


class ExerciseLogViewSet(viewsets.ModelViewSet):
    serializer_class = ExerciseLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return ExerciseLog.objects.filter(session__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def log_set(self, request):
        """Log para uma série de exercício específica"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)