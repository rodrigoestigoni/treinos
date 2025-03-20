# backend/califit/core/achievements.py
from .models import Achievement, UserAchievement
from django.utils import timezone
from django.db.models import Count, Sum

# Definições de conquistas disponíveis
ACHIEVEMENTS = [
    {
        'id': 'first_workout',
        'name': 'Primeiro Passo',
        'description': 'Complete seu primeiro treino',
        'xp_reward': 25,
        'icon_name': 'first_workout',
        'requirement_type': 'workout_count',
        'requirement_value': 1
    },
    {
        'id': 'workout_streak_3',
        'name': 'Consistência Inicial',
        'description': 'Complete 3 dias consecutivos de treino',
        'xp_reward': 30,
        'icon_name': 'streak_3',
        'requirement_type': 'streak_count',
        'requirement_value': 3
    },
    {
        'id': 'workout_streak_7',
        'name': 'Persistência de Ferro',
        'description': 'Complete 7 dias consecutivos de treino',
        'xp_reward': 50,
        'icon_name': 'streak_7',
        'requirement_type': 'streak_count',
        'requirement_value': 7
    },
    {
        'id': 'workout_streak_30',
        'name': 'Força de Vontade',
        'description': 'Complete 30 dias consecutivos de treino',
        'xp_reward': 150,
        'icon_name': 'streak_30',
        'requirement_type': 'streak_count',
        'requirement_value': 30
    },
    {
        'id': 'total_workouts_10',
        'name': 'Atleta Dedicado',
        'description': 'Complete 10 treinos',
        'xp_reward': 40,
        'icon_name': 'workouts_10',
        'requirement_type': 'total_workouts',
        'requirement_value': 10
    },
    {
        'id': 'total_workouts_50',
        'name': 'Mestre dos Treinos',
        'description': 'Complete 50 treinos',
        'xp_reward': 100,
        'icon_name': 'workouts_50',
        'requirement_type': 'total_workouts',
        'requirement_value': 50
    },
    {
        'id': 'total_workouts_100',
        'name': 'Lendário',
        'description': 'Complete 100 treinos',
        'xp_reward': 200,
        'icon_name': 'workouts_100',
        'requirement_type': 'total_workouts',
        'requirement_value': 100
    },
    {
        'id': 'long_workout',
        'name': 'Resistência',
        'description': 'Complete um treino com mais de 60 minutos',
        'xp_reward': 35,
        'icon_name': 'long_workout',
        'requirement_type': 'session_duration',
        'requirement_value': 60
    },
    {
        'id': 'evening_athlete',
        'name': 'Atleta Noturno',
        'description': 'Complete um treino após as 20:00',
        'xp_reward': 25,
        'icon_name': 'night_workout',
        'requirement_type': 'workout_time',
        'requirement_value': 20
    },
    {
        'id': 'early_bird',
        'name': 'Pássaro Madrugador',
        'description': 'Complete um treino antes das 7:00',
        'xp_reward': 30,
        'icon_name': 'morning_workout',
        'requirement_type': 'workout_time',
        'requirement_value': 7
    },
    {
        'id': 'weekend_warrior',
        'name': 'Guerreiro de Final de Semana',
        'description': 'Complete 5 treinos em fins de semana',
        'xp_reward': 40,
        'icon_name': 'weekend_workout',
        'requirement_type': 'weekend_workouts',
        'requirement_value': 5
    },
    {
        'id': 'variety_master',
        'name': 'Mestre da Variedade',
        'description': 'Complete treinos trabalhando todos os grupos musculares',
        'xp_reward': 50,
        'icon_name': 'variety',
        'requirement_type': 'muscle_group_variety',
        'requirement_value': 1
    },
    {
        'id': 'supplement_routine',
        'name': 'Rotina de Suplementação',
        'description': 'Registre 30 suplementos tomados',
        'xp_reward': 35,
        'icon_name': 'supplement',
        'requirement_type': 'supplements_taken',
        'requirement_value': 30
    },
]

def init_achievements():
    """Inicializar conquistas no banco de dados"""
    for achievement_data in ACHIEVEMENTS:
        achievement_id = achievement_data.pop('id')
        Achievement.objects.update_or_create(
            id=achievement_id,
            defaults=achievement_data
        )

def check_achievements_for_session(session):
    """Verificar e atribuir conquistas baseadas em uma sessão finalizada"""
    user = session.user
    earned_achievements = []
    
    # Conquistas já obtidas pelo usuário
    user_achievements = user.achievements.values_list('achievement_id', flat=True)
    
    # Verifica conquista de primeiro treino
    if 'first_workout' not in user_achievements:
        achievement = Achievement.objects.get(id='first_workout')
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    # Verifica conquistas de streak
    streak_achievements = Achievement.objects.filter(
        requirement_type='streak_count',
        requirement_value__lte=user.streak_count
    ).exclude(id__in=user_achievements)
    
    for achievement in streak_achievements:
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    # Verifica total de treinos
    total_workouts = user.workout_sessions.filter(end_time__isnull=False).count()
    total_workout_achievements = Achievement.objects.filter(
        requirement_type='total_workouts',
        requirement_value__lte=total_workouts
    ).exclude(id__in=user_achievements)
    
    for achievement in total_workout_achievements:
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    # Verifica duração do treino
    if session.duration >= 60 * 60 and 'long_workout' not in user_achievements:  # 60 minutos em segundos
        achievement = Achievement.objects.get(id='long_workout')
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    # Verifica horário do treino
    hour = session.start_time.hour
    
    if hour >= 20 and 'evening_athlete' not in user_achievements:
        achievement = Achievement.objects.get(id='evening_athlete')
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    if hour < 7 and 'early_bird' not in user_achievements:
        achievement = Achievement.objects.get(id='early_bird')
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    # Verifica treinos de fim de semana
    if session.start_time.weekday() >= 5:  # 5 = Sábado, 6 = Domingo
        weekend_count = user.workout_sessions.filter(
            end_time__isnull=False,
            start_time__week_day__in=[1, 7]  # Django usa 1-7 para domingo-sábado
        ).count()
        
        if weekend_count >= 5 and 'weekend_warrior' not in user_achievements:
            achievement = Achievement.objects.get(id='weekend_warrior')
            earn_achievement(user, achievement)
            earned_achievements.append(achievement)
    
    # Verifica variedade de grupos musculares
    if 'variety_master' not in user_achievements:
        # Obter todos os grupos musculares disponíveis
        from .models import MuscleGroup
        all_muscle_groups = set(MuscleGroup.objects.values_list('id', flat=True))
        
        # Obter grupos musculares treinados pelo usuário
        trained_groups = set()
        for session in user.workout_sessions.filter(end_time__isnull=False):
            for record in session.exercise_records.all():
                trained_groups.update(record.exercise.muscle_groups.values_list('id', flat=True))
        
        # Se treinou todos os grupos musculares
        if trained_groups == all_muscle_groups:
            achievement = Achievement.objects.get(id='variety_master')
            earn_achievement(user, achievement)
            earned_achievements.append(achievement)
    
    # Verifica suplementos tomados
    supplement_count = user.supplements.filter(records__taken=True).count()
    if supplement_count >= 30 and 'supplement_routine' not in user_achievements:
        achievement = Achievement.objects.get(id='supplement_routine')
        earn_achievement(user, achievement)
        earned_achievements.append(achievement)
    
    return earned_achievements

def earn_achievement(user, achievement):
    """Atribuir uma conquista ao usuário"""
    UserAchievement.objects.create(
        user=user,
        achievement=achievement
    )
    
    # Adicionar XP
    user.add_xp(achievement.xp_reward)
    
    # Enviar notificação (poderia ser implementado com websockets ou push notifications)
    from .notifications import send_achievement_notification
    send_achievement_notification(user, achievement)