from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    """Modelo de usuário estendido"""
    email = models.EmailField(_('email address'), unique=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True, help_text=_("Height in centimeters"))
    weight = models.FloatField(null=True, blank=True, help_text=_("Weight in kilograms"))
    
    # Gamification fields
    level = models.PositiveIntegerField(default=1)
    xp_points = models.PositiveIntegerField(default=0)
    total_xp = models.PositiveIntegerField(default=0)
    streak_count = models.PositiveIntegerField(default=0)
    last_workout_date = models.DateField(null=True, blank=True)
    streak_last_date = models.DateField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    def save(self, *args, **kwargs):
        # Ao criar um usuário, gerar automaticamente um username a partir do email se não for fornecido
        if not self.username:
            self.username = self.email.split('@')[0]
            # Verificar se username já existe e adicionar número se necessário
            base_username = self.username
            count = 1
            while User.objects.filter(username=self.username).exists():
                self.username = f"{base_username}{count}"
                count += 1
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.email
    
    @property
    def xp_to_next_level(self):
        """Calcula o XP necessário para o próximo nível"""
        return (self.level * 100) - (self.xp_points % (100 * self.level))
    
    @property
    def level_progress_percentage(self):
        """Retorna a porcentagem de progresso para o próximo nível"""
        xp_for_level = 100 * self.level
        xp_in_current_level = self.xp_points % xp_for_level
        return int((xp_in_current_level / xp_for_level) * 100)
    
    def add_xp(self, points):
        """Adiciona pontos de XP e atualiza o nível, se necessário"""
        self.xp_points += points
        self.total_xp += points
        
        # Verificar se o usuário subiu de nível
        old_level = self.level
        new_level = 1 + (self.xp_points // 100)
        
        if new_level > old_level:
            self.level = new_level
            self.save()
            return True  # Indica que subiu de nível
        
        self.save()
        return False
    
    def update_streak(self):
        """Atualizar streak ao completar um treino"""
        today = timezone.now().date()
        
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


class UserBodyMeasurement(models.Model):
    """Registros históricos das medidas corporais do usuário"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_measurements')
    date = models.DateField(auto_now_add=True)
    weight = models.FloatField(help_text=_("Weight in kilograms"))
    body_fat = models.FloatField(null=True, blank=True, help_text=_("Body fat percentage"))
    chest = models.FloatField(null=True, blank=True, help_text=_("Chest measurement in centimeters"))
    waist = models.FloatField(null=True, blank=True, help_text=_("Waist measurement in centimeters"))
    hips = models.FloatField(null=True, blank=True, help_text=_("Hips measurement in centimeters"))
    biceps = models.FloatField(null=True, blank=True, help_text=_("Biceps measurement in centimeters"))
    thighs = models.FloatField(null=True, blank=True, help_text=_("Thighs measurement in centimeters"))
    calves = models.FloatField(null=True, blank=True, help_text=_("Calves measurement in centimeters"))
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"


class MuscleGroup(models.Model):
    """Grupos musculares para categorizar exercícios"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text=_("Icon identifier"))
    
    def __str__(self):
        return self.name


class Exercise(models.Model):
    """Modelo para exercícios individuais"""
    DIFFICULTY_CHOICES = [
        ('beginner', _('Beginner')),
        ('intermediate', _('Intermediate')),
        ('advanced', _('Advanced')),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField()
    muscle_groups = models.ManyToManyField(MuscleGroup, related_name='exercises')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='intermediate')
    equipment_needed = models.TextField(blank=True, help_text=_("Equipment needed for this exercise"))
    image = models.ImageField(upload_to='exercise_images/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class Workout(models.Model):
    """Modelo para treinos completos"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    is_template = models.BooleanField(default=False, help_text=_("If true, this is a template workout that can be copied"))
    estimated_duration = models.PositiveIntegerField(default=60, help_text=_("Estimated duration in minutes"))
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
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(null=True, blank=True, help_text="Duração em segundos")
    calories_burned = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    xp_earned = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.workout.name} - {self.start_time.date()}"
    
    def complete_session(self):
        """Marcar sessão como completa e atualizar estatísticas do usuário"""
        if self.end_time:
            return False  # Já foi completada

        from django.utils import timezone
        import random
        
        self.end_time = timezone.now()
        self.completed = True
        
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
        level_up = self.user.add_xp(self.xp_earned)
        self.user.update_streak()
        
        self.save()
        
        # Verificar conquistas
        self.check_achievements()
        
        return self.xp_earned, level_up
    
    def check_achievements(self):
        """Verificar e atribuir conquistas baseadas nesta sessão"""
        from .achievements import check_achievements_for_session
        check_achievements_for_session(self)


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


class Notification(models.Model):
    """Modelo para armazenar notificações"""
    NOTIFICATION_TYPES = [
        ('achievement', 'Conquista'),
        ('streak', 'Sequência de treinos'),
        ('reminder', 'Lembrete'),
        ('supplement', 'Suplemento'),
        ('workout', 'Treino'),
        ('system', 'Sistema'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=100)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    icon = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Challenge(models.Model):
    """Desafios temporários para os usuários"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    xp_reward = models.PositiveIntegerField(default=100)
    required_workouts = models.PositiveIntegerField(default=0)
    required_exercises = models.ManyToManyField(Exercise, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class UserChallenge(models.Model):
    """Relação entre usuários e desafios aceitos"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenges')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    joined_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'challenge')
    
    def __str__(self):
        return f"{self.user.username} - {self.challenge.name}"