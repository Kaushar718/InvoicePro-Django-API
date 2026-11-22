import uuid
from datetime import date
from decimal import Decimal

from django.conf import settings
from django.db import models


class Invoice(models.Model):

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SENT = "SENT", "Sent"
        PARTIALLY_PAID = "PARTIALLY_PAID", "Partially Paid"
        PAID = "PAID", "Paid"
        OVERDUE = "OVERDUE", "Overdue"
        CANCELLED = "CANCELLED", "Cancelled"

    company = models.ForeignKey(
        "companies.Company",
        on_delete=models.CASCADE,
        related_name="invoices",
    )

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.PROTECT,
        related_name="invoices",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_invoices",
    )

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
    )

    issue_date = models.DateField()

    due_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    notes = models.TextField(
        blank=True,
    )

    terms_and_conditions = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    @property
    def paid_amount(self):
        return sum(
            payment.amount
            for payment in self.payments.all()
        )

    @property
    def remaining_amount(self):
        remaining = self.total_amount - self.paid_amount
        return max(remaining, Decimal("0.00"))

    def update_status(self):
        paid = self.paid_amount

        if paid >= self.total_amount:
            new_status = self.Status.PAID

        elif paid > Decimal("0.00"):
            new_status = self.Status.PARTIALLY_PAID

        elif (
            self.due_date < date.today()
            and self.status != self.Status.CANCELLED
        ):
            new_status = self.Status.OVERDUE

        else:
            new_status = self.status

        if self.status != new_status:
            self.status = new_status
            self.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

        return self.status

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = (
                f"INV-{self.issue_date.year}-"
                f"{uuid.uuid4().hex[:8].upper()}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number


class InvoiceItem(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoice_items",
    )

    description = models.CharField(
        max_length=255,
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    gst_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    line_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def save(self, *args, **kwargs):
        self.line_subtotal = (
            self.quantity * self.unit_price
        )

        self.gst_amount = (
            self.line_subtotal
            * self.gst_rate
            / Decimal("100")
        )

        self.line_total = (
            self.line_subtotal + self.gst_amount
        )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.description