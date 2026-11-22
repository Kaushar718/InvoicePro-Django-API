from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "role",
        ]

def create(self, validated_data):
    password = validated_data.pop("password")

    user = User(
        **validated_data,
        role=User.Role.COMPANY_OWNER,
    )

    user.set_password(password)
    user.save()

    return user



class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_email_verified",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "is_email_verified",
            "created_at",
        ]


