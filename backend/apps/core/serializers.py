from rest_framework import serializers
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

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 
                 'date_of_birth', 'height', 'weight', 'profile_image', 
                 'level', 'xp_points', 'streak_count', 'last_workout_date']
        read_only_fields = ['level', 'xp_points', 'streak_count', 'last_workout_date']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    xp_to_next_level = serializers.ReadOnlyField()
    level_progress_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'level', 'xp_points', 'total_xp', 'streak_count', 'last_workout_date',
            'xp_to_next_level', 'level_progress_percentage', 'height', 'weight'
        ]
        read_only_fields = [
            'level', 'xp_points', 'total_xp', 'streak_count', 'last_workout_date',
            'xp_to_next_level', 'level_progress_percentage'
        ]


class UserBodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBodyMeasurement
        fields = '__all__'
        read_only_fields = ['user']


class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = ['id', 'name', 'description', 'icon']


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
        read_only_fields = ['created_at', 'user']
    
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
        fields = ['id', 'name', 'description', 'is_template', 'estimated_duration',
                 'difficulty', 'created_at', 'exercise_count']
        read_only_fields = ['created_at', 'exercise_count']


class WorkoutDetailSerializer(serializers.ModelSerializer):
    workout_exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workout
        fields = ['id', 'name', 'description', 'is_template', 'estimated_duration',
                 'difficulty', 'created_at', 'workout_exercises']
        read_only_fields = ['created_at']
    
    def create(self, validated_data):
        workout_exercises = self.context['request'].data.get('workout_exercises', [])
        workout = Workout.objects.create(**validated_data)
        
        for i, exercise_data in enumerate(workout_exercises):
            exercise_id = exercise_data.get('exercise_id')
            if not exercise_id:
                continue
                
            try:
                exercise = Exercise.objects.get(id=exercise_id)
                WorkoutExercise.objects.create(
                    workout=workout,
                    exercise=exercise,
                    order=exercise_data.get('order', i),
                    sets=exercise_data.get('sets', 3),
                    target_reps=exercise_data.get('target_reps', 12),
                    rest_duration=exercise_data.get('rest_duration', 60),
                    notes=exercise_data.get('notes', '')
                )
            except Exercise.DoesNotExist:
                pass
                
        return workout
    
    def update(self, instance, validated_data):
        workout_exercises = self.context['request'].data.get('workout_exercises', [])
        
        # Atualizar campos do treino
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.is_template = validated_data.get('is_template', instance.is_template)
        instance.estimated_duration = validated_data.get('estimated_duration', instance.estimated_duration)
        instance.difficulty = validated_data.get('difficulty', instance.difficulty)
        instance.save()
        
        # Remover exercícios existentes se novos foram fornecidos
        if workout_exercises:
            instance.workout_exercises.all().delete()
            
            # Adicionar novos exercícios
            for i, exercise_data in enumerate(workout_exercises):
                exercise_id = exercise_data.get('exercise_id')
                if not exercise_id:
                    continue
                    
                try:
                    exercise = Exercise.objects.get(id=exercise_id)
                    WorkoutExercise.objects.create(
                        workout=instance,
                        exercise=exercise,
                        order=exercise_data.get('order', i),
                        sets=exercise_data.get('sets', 3),
                        target_reps=exercise_data.get('target_reps', 12),
                        rest_duration=exercise_data.get('rest_duration', 60),
                        notes=exercise_data.get('notes', '')
                    )
                except Exercise.DoesNotExist:
                    pass
                    
        return instance


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
            'end_time', 'duration', 'calories_burned', 'notes', 'xp_earned', 'completed'
        ]
        read_only_fields = ['start_time', 'end_time', 'duration', 'calories_burned', 'xp_earned', 'completed']


class WorkoutSessionDetailSerializer(serializers.ModelSerializer):
    workout_detail = WorkoutDetailSerializer(source='workout', read_only=True)
    exercise_records = ExerciseRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'workout', 'workout_detail', 'start_time', 'end_time', 
            'duration', 'calories_burned', 'notes', 'xp_earned', 'completed', 'exercise_records'
        ]
        read_only_fields = ['start_time', 'end_time', 'duration', 'calories_burned', 'xp_earned', 'completed']


class SupplementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplement
        fields = [
            'id', 'name', 'description', 'frequency', 'time_type',
            'time', 'minutes_before_workout', 'minutes_after_workout', 'days'
        ]
        read_only_fields = ['user']


class SupplementRecordSerializer(serializers.ModelSerializer):
    supplement_detail = SupplementSerializer(source='supplement', read_only=True)
    
    class Meta:
        model = SupplementRecord
        fields = ['id', 'supplement', 'supplement_detail', 'timestamp', 'taken']
        read_only_fields = ['timestamp']


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'xp_reward', 'icon_name', 
                 'requirement_type', 'requirement_value']


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement_detail = AchievementSerializer(source='achievement', read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'achievement_detail', 'earned_date']
        read_only_fields = ['earned_date']


class ChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Challenge
        fields = ['id', 'name', 'description', 'icon', 'start_date', 'end_date',
                 'xp_reward', 'required_workouts', 'required_exercises', 'is_active']


class UserChallengeSerializer(serializers.ModelSerializer):
    challenge_detail = ChallengeSerializer(source='challenge', read_only=True)
    
    class Meta:
        model = UserChallenge
        fields = ['id', 'challenge', 'challenge_detail', 'joined_at', 'completed', 'completed_at']
        read_only_fields = ['joined_at', 'completed_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'icon', 'created_at', 'read', 'action_url']
        read_only_fields = ['created_at']