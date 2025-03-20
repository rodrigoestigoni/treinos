from .models import Achievement, UserAchievement, User, WorkoutSession

# Lista de conquistas disponíveis
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
    total_workouts = WorkoutSession.objects.filter(
        user=user, 
        end_time__isnull=False
    ).count()
    
    total_workout_achievements = Achievement.objects.filter(
        requirement_type='total_workouts',
        requirement_value__lte=total_workouts
    ).exclude(id__in=user_achievements)
    
    for achievement in total_workout_achievements:
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
    
    # Enviar notificação
    from .models import Notification
    Notification.objects.create(
        user=user,
        title=f"Conquista Desbloqueada: {achievement.name}",
        message=f"Parabéns! Você desbloqueou a conquista '{achievement.name}' e ganhou {achievement.xp_reward} XP!",
        type='achievement',
        icon=achievement.icon_name,
        action_url='/achievements'
    )