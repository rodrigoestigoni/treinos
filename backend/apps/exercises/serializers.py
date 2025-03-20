# Serializers para API REST - exercises/serializers.py
from rest_framework import serializers
from .models import MuscleGroup, Exercise

class MuscleGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = MuscleGroup
        fields = '__all__'


class ExerciseSerializer(serializers.ModelSerializer):
    muscle_groups = MuscleGroupSerializer(many=True, read_only=True)
    muscle_group_ids = serializers.PrimaryKeyRelatedField(
        queryset=MuscleGroup.objects.all(),
        many=True,
        write_only=True,
        source='muscle_groups'
    )
    
    class Meta:
        model = Exercise
        fields = '__all__'