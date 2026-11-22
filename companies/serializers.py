from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(
        source="owner.email"
    )

    class Meta:
        model = Company
        fields = [
            "id",
            "owner",
            "name",
            "email",
            "phone",
            "gst_number",
            "address",
            "city",
            "state",
            "pincode",
            "logo",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "owner",
            "created_at",
            "updated_at",
        ]




from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Employee


User = get_user_model()


class EmployeeCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )
    designation = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value

    def create(self, validated_data):
        designation = validated_data.pop("designation", "")

        password = validated_data.pop("password")

        user = User(
            **validated_data,
            role=User.Role.EMPLOYEE,
        )

        user.set_password(password)
        user.save()

        company = self.context["company"]

        employee = Employee.objects.create(
            user=user,
            company=company,
            designation=designation,
        )

        return employee

    def to_representation(self, instance):
        return EmployeeSerializer(instance, context=self.context).data



class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    class Meta:
        model = Employee
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "designation",
            "is_active",
            "created_at",
        ]    