# Modelos de dados - accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    """Modelo de usuário personalizado"""
    email = models.EmailField(_('email address'), unique=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    height = models.FloatField(null=True, blank=True, help_text=_("Height in centimeters"))
    weight = models.FloatField(null=True, blank=True, help_text=_("Weight in kilograms"))
    xp_points = models.PositiveIntegerField(default=0)
    level = models.PositiveIntegerField(default=1)
    
    # Campos para gamificação
    streak_count = models.PositiveIntegerField(default=0)
    last_workout_date = models.DateField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    @property
    def xp_to_next_level(self):
        """Calcula o XP necessário para o próximo nível"""
        return 100 * self.level - (self.xp_points % (100 * self.level))
    
    @property
    def level_progress_percentage(self):
        """Retorna a porcentagem de progresso para o próximo nível"""
        xp_for_level = 100 * self.level
        xp_in_current_level = self.xp_points % xp_for_level
        return int((xp_in_current_level / xp_for_level) * 100)
    
    def add_xp(self, points):
        """Adiciona pontos de XP e atualiza o nível, se necessário"""
        self.xp_points += points
        
        # Verifica se subiu de nível
        new_level = 1 + (self.xp_points // 100)
        level_up = new_level > self.level
        self.level = new_level
        self.save()
        
        return level_up


class UserBodyMeasurement(models.Model):
    """Registros históricos das medidas corporais do usuário"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='body_measurements')
    date = models.DateField(auto_now_add=True)
    weight = models.FloatField(help_text=_("Weight in kilograms"))
    body_fat = models.FloatField(null=True, blank=True, help_text=_("Body fat percentage"))
    chest = models.FloatField(null=True, blank=True, help_text=_("Chest measurement in centimeters"))
    waist = models.FloatField(null=True, blank=True, help_text=_("Waist measurement in centimeters"))
    hips = models.FloatField(null=True, blank=True, help_text=_("Hips measurement in centimeters"))
    biceps = models.FloatField(null=True, blank=True, help_text=_("Biceps measurement in centimeters"))
    thighs = models.FloatField(null=True, blank=True, help_text=_("Thighs measurement in centimeters"))
    calves = models.FloatField(null=True, blank=True, help_text=_("Calves measurement in centimeters"))
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.user.username} - {self.date}"