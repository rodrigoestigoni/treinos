# backend/califit/core/serializers.py
from rest_framework import serializers
from .models import (
    User, Exercise, MuscleGroup, Workout, WorkoutExercise, 
    WorkoutSession, ExerciseRecord, SetRecord, Supplement,
    SupplementRecord, Achievement, UserAchievement, Notification
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'level', 'xp', 'streak_count', 'last_workout_date']
        read_only_fields = ['level', 'xp', 'streak_count', 'last_workout_date']


class UserProfileSerializer(serializers.ModelSerializer):
    xp_to_next_level = serializers.ReadOnlyField()
    level_progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'level', 'xp', 'total_xp', 'streak_count', 'last_workout_date',
            'xp_to_next_level', 'level_progress_percentage', 'height', 'weight'
        ]
        read_only_fields = [
            'level', 'xp', 'total_xp', 'streak_count', 'last_workout_date',
            'xp_to_next_level', 'level_progress_percentage'
        ]


class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = ['id', 'name']


class ExerciseSerializer(serializers.ModelSerializer):
    muscle_groups = MuscleGroupSerializer(many=True, read_only=True)
    muscle_group_ids = serializers.PrimaryKeyRelatedField(
        queryset=MuscleGroup.objects.all(),
        write_only=True,
        many=True,
        source='muscle_groups'
    )
    
    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'description', 'instructions', 'difficulty',
            'equipment_needed', 'image', 'video_url', 'muscle_groups',
            'muscle_group_ids', 'created_at'
        ]
        read_only_fields = ['created_at']
    
    def create(self, validated_data):
        muscle_groups = validated_data.pop('muscle_groups')
        exercise = Exercise.objects.create(**validated_data)
        exercise.muscle_groups.set(muscle_groups)
        return exercise
    
    def update(self, instance, validated_data):
        if 'muscle_groups' in validated_data:
            muscle_groups = validated_data.pop('muscle_groups')
            instance.muscle_groups.set(muscle_groups)
        
        return super().update(instance, validated_data)


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(),
        write_only=True,
        source='exercise'
    )
    exercise_detail = ExerciseSerializer(source='exercise', read_only=True)
    
    class Meta:
        model = WorkoutExercise
        fields = [
            'id', 'exercise_id', 'exercise_detail', 'order', 
            'sets', 'target_reps', 'rest_duration', 'notes'
        ]


class WorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'is_template', 'created_at']
        read_only_fields = ['created_at']


class WorkoutDetailSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'is_template', 'created_at', 'exercises']
        read_only_fields = ['created_at']


class WorkoutCreateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'is_template', 'exercises']
    
    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises')
        workout = Workout.objects.create(**validated_data)
        
        for i, exercise_data in enumerate(exercises_data):
            # Garantir ordem crescente se não especificado
            if 'order' not in exercise_data:
                exercise_data['order'] = i
            
            WorkoutExercise.objects.create(workout=workout, **exercise_data)
        
        return workout
    
    def update(self, instance, validated_data):
        if 'exercises' in validated_data:
            exercises_data = validated_data.pop('exercises')
            
            # Remover exercícios existentes
            instance.exercises.all().delete()
            
            # Criar novos exercícios
            for i, exercise_data in enumerate(exercises_data):
                if 'order' not in exercise_data:
                    exercise_data['order'] = i
                
                WorkoutExercise.objects.create(workout=instance, **exercise_data)
        
        return super().update(instance, validated_data)


class SetRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetRecord
        fields = ['id', 'set_number', 'actual_reps', 'weight', 'completed']


class ExerciseRecordSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source='exercise', read_only=True)
    workout_exercise_detail = WorkoutExerciseSerializer(source='workout_exercise', read_only=True)
    set_records = SetRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = ExerciseRecord
        fields = ['id', 'exercise_detail', 'workout_exercise_detail', 'set_records']


class WorkoutSessionSerializer(serializers.ModelSerializer):
    workout_detail = WorkoutSerializer(source='workout', read_only=True)
    
    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'workout', 'workout_detail', 'start_time', 
            'end_time', 'duration', 'calories_burned', 'notes', 'xp_earned'
        ]
        read_only_fields = ['start_time', 'end_time', 'duration', 'calories_burned', 'xp_earned']


class WorkoutSessionDetailSerializer(serializers.ModelSerializer):
    workout_detail = WorkoutDetailSerializer(source='workout', read_only=True)
    exercise_records = ExerciseRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'workout', 'workout_detail', 'start_time', 'end_time', 
            'duration', 'calories_burned', 'notes', 'xp_earned', 'exercise_records'
        ]
        read_only_fields = ['start_time', 'end_time', 'duration', 'calories_burned', 'xp_earned']


class SupplementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplement
        fields = [
            'id', 'name', 'description', 'frequency', 'time_type',
            'time', 'minutes_before_workout', 'minutes_after_workout', 'days'
        ]


class SupplementRecordSerializer(serializers.ModelSerializer):
    supplement_detail = SupplementSerializer(source='supplement', read_only=True)
    
    class Meta:
        model = SupplementRecord
        fields = ['id', 'supplement', 'supplement_detail', 'timestamp', 'taken']
        read_only_fields = ['timestamp']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'xp_reward', 'icon_name']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement_detail = AchievementSerializer(source='achievement', read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'achievement_detail', 'earned_date']
        read_only_fields = ['earned_date']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'icon', 'created_at', 'read', 'action_url']
        read_only_fields = ['created_at']