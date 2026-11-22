from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIClient

from clients.models import Client
from companies.models import Company
from invoices.models import Invoice

from .models import Payment
from .serializers import PaymentSerializer


User = get_user_model()


class PaymentBalanceTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="test-password",
        )
        self.company = Company.objects.create(
            owner=self.owner,
            name="Test Company",
            email="company@example.com",
        )
        self.client_record = Client.objects.create(
            company=self.company,
            created_by=self.owner,
            name="Test Client",
        )
        self.invoice = Invoice.objects.create(
            company=self.company,
            client=self.client_record,
            created_by=self.owner,
            issue_date=date(2026, 1, 1),
            due_date=date(2026, 1, 8),
            total_amount=Decimal("100.00"),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.owner)
        self.url = reverse(
            "payment-list-create",
            kwargs={
                "company_id": self.company.id,
                "invoice_id": self.invoice.id,
            },
        )

    def record_payment(self, amount):
        return self.client.post(
            self.url,
            {
                "amount": str(amount),
                "payment_method": Payment.Method.CASH,
                "payment_date": "2026-01-05",
            },
            format="json",
        )

    def test_payment_cannot_exceed_remaining_invoice_balance(self):
        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal("75.00"),
            payment_method=Payment.Method.CASH,
            payment_date=date(2026, 1, 4),
        )

        response = self.record_payment("25.01")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            Payment.objects.filter(invoice=self.invoice).count(),
            1,
        )

    def test_recording_remaining_balance_marks_invoice_paid(self):
        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal("75.00"),
            payment_method=Payment.Method.CASH,
            payment_date=date(2026, 1, 4),
        )

        response = self.record_payment("25.00")

        self.assertEqual(response.status_code, 201)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, Invoice.Status.PAID)
        self.assertEqual(self.invoice.remaining_amount, Decimal("0.00"))

    def test_create_rechecks_balance_after_serializer_validation(self):
        serializer = PaymentSerializer(
            data={
                "amount": "30.00",
                "payment_method": Payment.Method.CASH,
                "payment_date": "2026-01-05",
            },
            context={"invoice": self.invoice},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal("75.00"),
            payment_method=Payment.Method.CASH,
            payment_date=date(2026, 1, 4),
        )

        with self.assertRaises(ValidationError) as context:
            serializer.save()

        self.assertIn("amount", context.exception.detail)
        self.assertEqual(
            Payment.objects.filter(invoice=self.invoice).count(),
            1,
        )
