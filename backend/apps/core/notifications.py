# backend/califit/core/notifications.py
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta


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
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notifications')
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


def send_achievement_notification(user, achievement):
    """Enviar notificação de conquista desbloqueada"""
    Notification.objects.create(
        user=user,
        title=f"Conquista Desbloqueada: {achievement.name}",
        message=f"Parabéns! Você desbloqueou a conquista '{achievement.name}' e ganhou {achievement.xp_reward} XP!",
        type='achievement',
        icon=achievement.icon_name,
        action_url='/achievements'
    )


def send_streak_notification(user):
    """Enviar notificação de streak"""
    if user.streak_count in [3, 7, 14, 30, 60, 90, 100]:
        Notification.objects.create(
            user=user,
            title=f"Sequência de {user.streak_count} dias!",
            message=f"Incrível! Você manteve uma sequência de treinos por {user.streak_count} dias consecutivos. Continue assim!",
            type='streak',
            icon='streak',
            action_url='/profile'
        )


def send_supplement_reminder(supplement):
    """Enviar lembrete para tomar suplemento"""
    user = supplement.user
    
    Notification.objects.create(
        user=user,
        title=f"Hora de tomar: {supplement.name}",
        message=f"Lembrete: é hora de tomar seu suplemento {supplement.name}.",
        type='supplement',
        icon='supplement',
        action_url='/supplements'
    )


def send_workout_reminder(user, workout=None):
    """Enviar lembrete para fazer treino"""
    if workout:
        title = f"Hora do treino: {workout.name}"
        message = f"Não se esqueça do seu treino de {workout.name} hoje!"
    else:
        title = "Hora de treinar!"
        message = "Você ainda não treinou hoje. Que tal começar agora?"
    
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type='workout',
        icon='workout',
        action_url='/workouts'
    )


def send_streak_warning(user):
    """Avisar usuário que está prestes a perder streak"""
    last_workout = user.last_workout_date
    today = timezone.now().date()
    
    if last_workout and (today - last_workout).days == 1 and user.streak_count >= 3:
        Notification.objects.create(
            user=user,
            title="Não perca sua sequência!",
            message=f"Você está com uma sequência de {user.streak_count} dias. Treine hoje para não perder!",
            type='streak',
            icon='streak_warning',
            action_url='/workouts'
        )


def schedule_supplement_reminders():
    """Agendar lembretes de suplementos para o dia"""
    from .models import Supplement
    
    now = timezone.now()
    today_weekday = now.weekday()  # 0-6, onde 0 é segunda-feira
    
    # Suplementos diários com horário específico
    daily_supplements = Supplement.objects.filter(
        frequency='daily',
        time_type='time',
        time__isnull=False
    )
    
    for supplement in daily_supplements:
        supplement_time = datetime.combine(now.date(), supplement.time)
        supplement_time = timezone.make_aware(supplement_time)
        
        # Se ainda não passou do horário, agendar
        if supplement_time > now:
            # Aqui você implementaria o agendamento com Celery, Django-Q ou similar
            # Por simplicidade, vamos apenas criar uma tarefa simulada
            print(f"Agendando lembrete para {supplement.name} às {supplement.time}")
            # task = send_supplement_reminder.apply_async(
            #     args=[supplement.id],
            #     eta=supplement_time
            # )
    
    # Suplementos para dias específicos
    custom_supplements = Supplement.objects.filter(
        frequency='custom',
        time_type='time',
        time__isnull=False
    )
    
    for supplement in custom_supplements:
        # Verificar se hoje é um dia para tomar
        if str(today_weekday) in supplement.days.split(','):
            supplement_time = datetime.combine(now.date(), supplement.time)
            supplement_time = timezone.make_aware(supplement_time)
            
            if supplement_time > now:
                print(f"Agendando lembrete para {supplement.name} às {supplement.time}")
                # task = send_supplement_reminder.apply_async(
                #     args=[supplement.id],
                #     eta=supplement_time
                # )


def check_streak_warnings():
    """Verificar e enviar avisos de perda de streak"""
    from .models import User
    
    today = timezone.now().date()
    
    # Usuários com streak >= 3 que não treinaram hoje e treinaram ontem
    users = User.objects.filter(
        streak_count__gte=3,
        last_workout_date=today - timedelta(days=1)
    )
    
    for user in users:
        send_streak_warning(user)