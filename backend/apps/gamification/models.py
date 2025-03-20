# Modelos de dados - gamification/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User

class Achievement(models.Model):
    """Conquistas que os usuários podem desbloquear"""
    TYPES = [
        ('workout_count', _('Número de treinos')),
        ('streak', _('Dias consecutivos')),
        ('xp', _('Pontos de experiência')),
        ('exercise', _('Exercícios específicos')),
        ('custom', _('Personalizado')),
    ]
    
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    type = models.CharField(max_length=20, choices=TYPES)
    requirement_value = models.PositiveIntegerField(help_text=_("The value required to unlock this achievement"))
    xp_reward = models.PositiveIntegerField(default=50, help_text=_("XP points awarded when achievement is unlocked"))
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    """Relação entre usuários e conquistas desbloqueadas"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='users')
    unlocked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'achievement')
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"


class Challenge(models.Model):
    """Desafios temporários para os usuários"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    xp_reward = models.PositiveIntegerField(default=100)
    required_workouts = models.PositiveIntegerField(default=0)
    required_exercises = models.ManyToManyField('exercises.Exercise', blank=True)
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


class Supplement(models.Model):
    """Suplementos cadastrados pelos usuários"""
    FREQUENCY_CHOICES = [
        ('daily', _('Diariamente')),
        ('workout_days', _('Dias de treino')),
        ('custom', _('Personalizado')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supplements')
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    time_of_day = models.TimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    reminder_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"