# backend/califit/core/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from datetime import date


class User(AbstractUser):
    """Modelo de usuário estendido"""
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    streak_count = models.IntegerField(default=0)
    streak_last_date = models.DateField(null=True, blank=True)
    last_workout_date = models.DateField(null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    @property
    def xp_to_next_level(self):
        """Calcular XP necessário para o próximo nível"""
        return (self.level * 100) - self.xp
    
    @property
    def level_progress_percentage(self):
        """Calcular porcentagem de progresso para o próximo nível"""
        xp_for_level = self.level * 100
        xp_achieved = self.xp
        xp_for_previous_level = (self.level - 1) * 100 if self.level > 1 else 0
        progress = ((xp_achieved - xp_for_previous_level) / 
                    (xp_for_level - xp_for_previous_level)) * 100
        return min(round(progress, 1), 100)
    
    def add_xp(self, amount):
        """Adicionar XP e possivelmente subir de nível"""
        self.xp += amount
        self.total_xp += amount
        
        # Verificar se o usuário subiu de nível
        while self.xp >= (self.level * 100):
            self.xp -= (self.level * 100)
            self.level += 1
        
        self.save()
    
    def update_streak(self):
        """Atualizar streak ao completar um treino"""
        today = date.today()
        
        # Se não tem data anterior ou é o primeiro treino
        if not self.streak_last_date:
            self.streak_count = 1
        # Se treinou ontem, aumenta o streak
        elif (today - self.streak_last_date).days == 1:
            self.streak_count += 1
        # Se treinou hoje mesmo, não faz nada
        elif (today - self.streak_last_date).days == 0:
            pass
        # Se passou mais de um dia, reseta o streak
        else:
            self.streak_count = 1
        
        self.streak_last_date = today
        self.last_workout_date = today
        self.save()


class MuscleGroup(models.Model):
    """Grupos musculares para categorizar exercícios"""
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name


class Exercise(models.Model):
    """Exercícios cadastrados no sistema"""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Iniciante'),
        ('intermediate', 'Intermediário'),
        ('advanced', 'Avançado'),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='intermediate')
    equipment_needed = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='exercises/', null=True, blank=True)
    video_url = models.URLField(blank=True)
    muscle_groups = models.ManyToManyField(MuscleGroup, related_name='exercises')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class Workout(models.Model):
    """Treinos compostos por múltiplos exercícios"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    is_template = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class WorkoutExercise(models.Model):
    """Associação entre treinos e exercícios, com detalhes específicos"""
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    sets = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    target_reps = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    rest_duration = models.PositiveIntegerField(default=60, help_text="Duração do descanso em segundos")
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.workout.name} - {self.exercise.name}"


class WorkoutSession(models.Model):
    """Registro de sessão de treino realizada"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True, help_text="Duração em segundos")
    calories_burned = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    xp_earned = models.PositiveIntegerField(default=0)
    
    def complete_session(self):
        """Marcar sessão como completa e atualizar estatísticas do usuário"""
        from django.utils import timezone
        import random
        
        self.end_time = timezone.now()
        
        # Calcular duração em segundos
        delta = self.end_time - self.start_time
        self.duration = int(delta.total_seconds())
        
        # Calcular calorias (fórmula simplificada)
        weight = self.user.weight or 70  # padrão de 70kg se não tiver peso cadastrado
        minutes = self.duration / 60
        self.calories_burned = int((minutes * 8 * float(weight)) / 70)
        
        # Calcular XP baseado na duração e exercícios
        base_xp = 50  # XP base por completar qualquer treino
        duration_xp = min(int(minutes / 5), 50)  # Até 50 XP por tempo (max 50)
        exercise_xp = len(self.exercise_records.all()) * 5  # 5 XP por exercício
        
        # Adiciona um pouco de aleatoriedade para manter interessante
        randomness = random.randint(-10, 10)
        
        self.xp_earned = base_xp + duration_xp + exercise_xp + randomness
        self.xp_earned = max(self.xp_earned, 10)  # Garantir pelo menos 10 XP
        
        # Atualizar usuário
        self.user.add_xp(self.xp_earned)
        self.user.update_streak()
        
        self.save()
        
        # Verificar conquistas
        self.check_achievements()
        
        return self.xp_earned
    
    def check_achievements(self):
        """Verificar e atribuir conquistas baseadas nesta sessão"""
        from .achievements import check_achievements_for_session
        check_achievements_for_session(self)
    
    def __str__(self):
        return f"{self.user.username} - {self.workout.name} - {self.start_time.date()}"


class ExerciseRecord(models.Model):
    """Registro detalhado de cada exercício em uma sessão de treino"""
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='exercise_records')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"{self.session} - {self.exercise.name}"


class SetRecord(models.Model):
    """Registro de cada série de um exercício"""
    exercise_record = models.ForeignKey(ExerciseRecord, on_delete=models.CASCADE, related_name='set_records')
    set_number = models.PositiveIntegerField()
    actual_reps = models.PositiveIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    completed = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.exercise_record} - Set {self.set_number}"


class Supplement(models.Model):
    """Suplementos que o usuário toma"""
    FREQUENCY_CHOICES = [
        ('daily', 'Diariamente'),
        ('workout_day', 'Dias de treino'),
        ('custom', 'Personalizado'),
    ]
    
    TIME_TYPE_CHOICES = [
        ('time', 'Horário específico'),
        ('pre_workout', 'Pré-treino'),
        ('post_workout', 'Pós-treino'),
    ]
    
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supplements')
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='daily')
    time_type = models.CharField(max_length=20, choices=TIME_TYPE_CHOICES, default='time')
    time = models.TimeField(null=True, blank=True)
    minutes_before_workout = models.PositiveIntegerField(null=True, blank=True)
    minutes_after_workout = models.PositiveIntegerField(null=True, blank=True)
    days = models.CharField(max_length=50, blank=True, help_text="Dias da semana separados por vírgula (0-6, 0=Segunda)")
    
    def __str__(self):
        return self.name


class SupplementRecord(models.Model):
    """Registro de suplementos tomados"""
    supplement = models.ForeignKey(Supplement, on_delete=models.CASCADE, related_name='records')
    timestamp = models.DateTimeField(auto_now_add=True)
    taken = models.BooleanField(default=True)
    
    def __str__(self):
        status = "tomado" if self.taken else "pulado"
        return f"{self.supplement.name} - {status} em {self.timestamp}"


class Achievement(models.Model):
    """Conquistas que os usuários podem desbloquear"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    xp_reward = models.PositiveIntegerField(default=50)
    icon_name = models.CharField(max_length=50, blank=True, help_text="Nome do ícone no sistema")
    requirement_type = models.CharField(max_length=50, help_text="Tipo de requisito para desbloquear")
    requirement_value = models.PositiveIntegerField(help_text="Valor necessário para desbloquear")
    
    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    """Associação entre usuários e conquistas desbloqueadas"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'achievement']
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"