# Modelos de dados - exercises/models.py
from django.db import models
from django.utils.translation import gettext_lazy as _

class MuscleGroup(models.Model):
    """Grupos musculares para categorização de exercícios"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text=_("Icon identifier"))
    
    def __str__(self):
        return self.name


class Exercise(models.Model):
    """Modelo para exercícios individuais"""
    DIFFICULTY_CHOICES = [
        ('beginner', _('Beginner')),
        ('intermediate', _('Intermediate')),
        ('advanced', _('Advanced')),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField()
    muscle_groups = models.ManyToManyField(MuscleGroup, related_name='exercises')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='intermediate')
    equipment_needed = models.TextField(blank=True, help_text=_("Equipment needed for this exercise"))
    image = models.ImageField(upload_to='exercise_images/', null=True, blank=True)
    video_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name