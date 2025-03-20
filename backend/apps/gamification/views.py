from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Achievement, Challenge, UserAchievement, UserChallenge, Supplement
from .serializers import (
    AchievementSerializer, UserAchievementSerializer, 
    ChallengeSerializer, UserChallengeSerializer,
    SupplementSerializer
)

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        achievement = self.get_object()
        user = request.user
        
        # Verificar se o usuário já possui esta conquista
        if UserAchievement.objects.filter(user=user, achievement=achievement).exists():
            return Response(
                {"detail": "Achievement already unlocked."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Desbloquear conquista
        user_achievement = UserAchievement.objects.create(
            user=user,
            achievement=achievement
        )
        
        # Adicionar XP ao usuário
        user.add_xp(achievement.xp_reward)
        
        return Response({
            "detail": "Achievement unlocked!",
            "xp_gained": achievement.xp_reward
        })
    
    @action(detail=False, methods=['get'])
    def my_achievements(self, request):
        user_achievements = UserAchievement.objects.filter(user=request.user)
        serializer = UserAchievementSerializer(user_achievements, many=True)
        return Response(serializer.data)


class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.filter(is_active=True)
    serializer_class = ChallengeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        challenge = self.get_object()
        user = request.user
        
        # Verificar se o desafio ainda está aberto
        today = timezone.now().date()
        if today > challenge.end_date:
            return Response(
                {"detail": "This challenge has ended."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar se o usuário já participa deste desafio
        if UserChallenge.objects.filter(user=user, challenge=challenge).exists():
            return Response(
                {"detail": "You are already participating in this challenge."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Inscrever usuário no desafio
        user_challenge = UserChallenge.objects.create(
            user=user,
            challenge=challenge
        )
        
        return Response({
            "detail": "Joined challenge successfully!"
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        challenge = self.get_object()
        user = request.user
        
        try:
            user_challenge = UserChallenge.objects.get(user=user, challenge=challenge)
        except UserChallenge.DoesNotExist:
            return Response(
                {"detail": "You are not participating in this challenge."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user_challenge.completed:
            return Response(
                {"detail": "Challenge already completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marcar como concluído
        user_challenge.completed = True
        user_challenge.completed_at = timezone.now()
        user_challenge.save()
        
        # Adicionar XP ao usuário
        level_up = user.add_xp(challenge.xp_reward)
        
        return Response({
            "detail": "Challenge completed!",
            "xp_gained": challenge.xp_reward,
            "level_up": level_up
        })
    
    @action(detail=False, methods=['get'])
    def my_challenges(self, request):
        user_challenges = UserChallenge.objects.filter(user=request.user)
        serializer = UserChallengeSerializer(user_challenges, many=True)
        return Response(serializer.data)


class SupplementViewSet(viewsets.ModelViewSet):
    serializer_class = SupplementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Supplement.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)