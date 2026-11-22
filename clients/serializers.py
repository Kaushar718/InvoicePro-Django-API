from rest_framework import serializers

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    company = serializers.ReadOnlyField(
        source="company.id"
    )

    created_by = serializers.ReadOnlyField(
        source="created_by.email"
    )

    class Meta:
        model = Client
        fields = [
            "id",
            "company",
            "created_by",
            "name",
            "email",
            "phone",
            "gst_number",
            "address",
            "city",
            "state",
            "pincode",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "company",
            "created_by",
            "created_at",
            "updated_at",
        ]