# Serializers para API REST - workouts/serializers.py
from rest_framework import serializers
from .models import Workout, WorkoutExercise, WorkoutSchedule, WorkoutSession, ExerciseLog
from apps.exercises.serializers import ExerciseSerializer

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_detail = ExerciseSerializer(source='exercise', read_only=True)
    
    class Meta:
        model = WorkoutExercise
        fields = '__all__'


class WorkoutSerializer(serializers.ModelSerializer):
    workout_exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    exercises = serializers.SerializerMethodField()
    
    class Meta:
        model = Workout
        fields = '__all__'
    
    def get_exercises(self, obj):
        workout_exercises = obj.workout_exercises.all().order_by('order')
        return WorkoutExerciseSerializer(workout_exercises, many=True).data


class WorkoutScheduleSerializer(serializers.ModelSerializer):
    workout_detail = WorkoutSerializer(source='workout', read_only=True)
    
    class Meta:
        model = WorkoutSchedule
        fields = '__all__'


class ExerciseLogSerializer(serializers.ModelSerializer):
    exercise_name = serializers.ReadOnlyField(source='workout_exercise.exercise.name')
    
    class Meta:
        model = ExerciseLog
        fields = '__all__'


class WorkoutSessionSerializer(serializers.ModelSerializer):
    workout_detail = WorkoutSerializer(source='workout', read_only=True)
    exercise_logs = ExerciseLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = WorkoutSession
        fields = '__all__'