# Visualizações para API REST - exercises/views.py
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import MuscleGroup, Exercise
from .serializers import MuscleGroupSerializer, ExerciseSerializer

class MuscleGroupViewSet(viewsets.ModelViewSet):
    queryset = MuscleGroup.objects.all()
    serializer_class = MuscleGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['name']
    search_fields = ['name', 'description']


class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['difficulty', 'muscle_groups']
    search_fields = ['name', 'description', 'instructions']
    
    @action(detail=False, methods=['get'])
    def by_muscle_group(self, request):
        """Retorna exercícios agrupados por grupo muscular"""
        muscle_groups = MuscleGroup.objects.all()
        result = {}
        
        for group in muscle_groups:
            exercises = group.exercises.all()
            result[group.name] = ExerciseSerializer(exercises, many=True).data
        
        return Response(result)