# Modelos de dados - workouts/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.exercises.models import Exercise
from apps.accounts.models import User

class Workout(models.Model):
    """Modelo para treinos completos"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    is_template = models.BooleanField(default=False, help_text=_("If true, this is a template workout that can be copied"))
    estimated_duration = models.PositiveIntegerField(help_text=_("Estimated duration in minutes"))
    difficulty = models.CharField(max_length=20, choices=Exercise.DIFFICULTY_CHOICES, default='intermediate')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def exercise_count(self):
        return self.workout_exercises.count()


class WorkoutExercise(models.Model):
    """Relação entre treinos e exercícios, incluindo detalhes específicos"""
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='workout_instances')
    order = models.PositiveIntegerField(default=0)
    sets = models.PositiveIntegerField(default=3)
    target_reps = models.PositiveIntegerField(default=12)
    rest_duration = models.PositiveIntegerField(default=60, help_text=_("Rest time in seconds"))
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.workout.name} - {self.exercise.name}"


class WorkoutSchedule(models.Model):
    """Agendamento de treinos"""
    DAYS_OF_WEEK = [
        (0, 'Segunda-feira'),
        (1, 'Terça-feira'),
        (2, 'Quarta-feira'),
        (3, 'Quinta-feira'),
        (4, 'Sexta-feira'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_schedule')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField(null=True, blank=True)
    reminder = models.BooleanField(default=True, help_text=_("Send reminder notification"))
    
    class Meta:
        unique_together = ('user', 'day_of_week')
        ordering = ['day_of_week']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_day_of_week_display()} - {self.workout.name}"


class WorkoutSession(models.Model):
    """Registro de sessões de treino completadas"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.workout.name} - {self.start_time.date()}"
    
    @property
    def duration(self):
        """Duração em minutos"""
        if self.end_time and self.start_time:
            return round((self.end_time - self.start_time).total_seconds() / 60)
        return None


class ExerciseLog(models.Model):
    """Registro detalhado de exercícios completados em uma sessão"""
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='exercise_logs')
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE, related_name='logs')
    set_number = models.PositiveIntegerField()
    reps_completed = models.PositiveIntegerField()
    weight = models.FloatField(null=True, blank=True, help_text=_("Weight used (if applicable)"))
    difficulty_rating = models.PositiveIntegerField(null=True, blank=True, help_text=_("User's difficulty rating (1-10)"))
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['workout_exercise__order', 'set_number']
    
    def __str__(self):
        return f"{self.workout_exercise.exercise.name} - Set {self.set_number}"