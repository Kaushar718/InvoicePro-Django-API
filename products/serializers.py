from rest_framework import serializers

from .models import Category, Product


class CategorySerializer(serializers.ModelSerializer):
    company = serializers.ReadOnlyField(
        source="company.id"
    )

    created_by = serializers.ReadOnlyField(
        source="created_by.email"
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "company",
            "created_by",
            "name",
            "description",
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


class ProductSerializer(serializers.ModelSerializer):
    company = serializers.ReadOnlyField(
        source="company.id"
    )

    created_by = serializers.ReadOnlyField(
        source="created_by.email"
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "company",
            "category",
            "created_by",
            "name",
            "sku",
            "description",
            "price",
            "gst_rate",
            "stock_quantity",
            "is_active",
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

def validate_category(self, value):
    if value is not None:
        company_id = self.context["view"].kwargs["company_id"]

        if value.company_id != int(company_id):
            raise serializers.ValidationError(
                "This category does not belong to your company."
            )

    return value        