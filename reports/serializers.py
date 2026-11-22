from rest_framework import serializers


class FinancialAssistantQuestionSerializer(serializers.Serializer):
    question = serializers.ChoiceField(
        choices=[
            "total_revenue",
            "outstanding",
            "overdue_invoices",
        ]
    )
