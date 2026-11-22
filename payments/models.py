from decimal import Decimal

from django.db import models


class Payment(models.Model):

    class Method(models.TextChoices):
        CASH = "CASH", "Cash"
        UPI = "UPI", "UPI"
        BANK = "BANK", "Bank Transfer"
        CARD = "CARD", "Card"
        OTHER = "OTHER", "Other"

    invoice = models.ForeignKey(
        "invoices.Invoice",
        on_delete=models.CASCADE,
        related_name="payments",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.OTHER,
    )

    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
    )

    payment_date = models.DateField()

    notes = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.amount}"