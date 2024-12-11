from rest_framework import serializers
from api.models import User
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'password2', 'email', 'first_name', 
                 'last_name', 'role', 'bio', 'profile_picture', 'preferences', 'last_active')
        read_only_fields = ('last_active',)
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'email', 'bio', 'profile_picture', 'preferences')

class UserStatsSerializer(serializers.ModelSerializer):
    writing_stats = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'writing_stats')

    def get_writing_stats(self, obj):
        return obj.get_writing_stats()
