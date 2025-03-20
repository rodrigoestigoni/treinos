from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserBodyMeasurement

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'date_of_birth', 
                  'height', 'weight', 'profile_image', 'xp_points', 'level', 
                  'streak_count', 'last_workout_date']
        read_only_fields = ['xp_points', 'level', 'streak_count', 'last_workout_date']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserBodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserBodyMeasurement
        fields = '__all__'
        read_only_fields = ['user', 'date']