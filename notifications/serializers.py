from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    company = serializers.IntegerField(
        source="company_id",
        read_only=True,
    )

    invoice_number = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "company",
            "invoice",
            "invoice_number",
            "notification_type",
            "title",
            "message",
            "is_read",
            "created_at",
        ]

    def get_invoice_number(self, obj):
        if obj.invoice:
            return obj.invoice.invoice_number
        return None