from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers

from invoices.models import Invoice

from .models import Payment

from notifications.models import Notification
from notifications.services import notify_company_users


class PaymentSerializer(serializers.ModelSerializer):

    invoice_number = serializers.ReadOnlyField(
        source="invoice.invoice_number"
    )

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "invoice_number",
            "amount",
            "payment_method",
            "transaction_reference",
            "payment_date",
            "notes",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "invoice",
            "invoice_number",
            "created_at",
        ]

    def _get_invoice(self):
        invoice = self.context.get("invoice")
        if invoice is not None:
            return invoice

        if self.instance is not None:
            return self.instance.invoice

        raise serializers.ValidationError(
            {"invoice": "Invoice is required to process this payment."}
        )

    def validate(self, attrs):
        invoice = self._get_invoice()
        amount = attrs.get("amount")

        if amount is None:
            return attrs

        if amount <= Decimal("0.00"):
            raise serializers.ValidationError(
                {"amount": "Payment amount must be greater than zero."}
            )

        existing_payments = invoice.payments.all()
        if self.instance is not None and self.instance.invoice_id == invoice.id:
            existing_payments = existing_payments.exclude(pk=self.instance.pk)

        paid_amount = sum(
            (payment.amount for payment in existing_payments),
            Decimal("0.00"),
        )

        remaining = max(invoice.total_amount - paid_amount, Decimal("0.00"))

        if amount > remaining:
            raise serializers.ValidationError(
                {
                    "amount": (
                        f"Maximum payable amount is "
                        f"{remaining:.2f}."
                    )
                }
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        invoice = Invoice.objects.select_for_update().get(
            pk=self.context["invoice"].pk
        )
        paid_amount = (
            invoice.payments.aggregate(total=Sum("amount"))["total"]
            or Decimal("0.00")
        )
        remaining = max(
            invoice.total_amount - paid_amount,
            Decimal("0.00"),
        )

        if validated_data["amount"] > remaining:
            raise serializers.ValidationError(
                {
                    "amount": (
                        f"Maximum payable amount is "
                        f"{remaining:.2f}."
                    )
                }
            )

        payment = Payment.objects.create(
            invoice=invoice,
            **validated_data,
        )

        invoice.update_status()

        notify_company_users(
            company=invoice.company,
            invoice=invoice,
            notification_type=Notification.Type.PAYMENT_RECORDED,
            title="Payment Recorded",
            message=(
                f"Payment of Rs. {payment.amount} recorded "
                f"for invoice {invoice.invoice_number}."
            ),
        )

        return payment

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        instance.invoice.update_status()

        return instance

