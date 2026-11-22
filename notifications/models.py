from django.conf import settings
from django.db import models


class Notification(models.Model):

    class Type(models.TextChoices):
        INVOICE_CREATED = "INVOICE_CREATED", "Invoice Created"
        PAYMENT_RECORDED = "PAYMENT_RECORDED", "Payment Recorded"

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    invoice = models.ForeignKey(
        "invoices.Invoice",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=30,
        choices=Type.choices,
    )

    title = models.CharField(max_length=150)

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.email}: {self.title}"
