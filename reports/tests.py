
import json
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from clients.models import Client
from companies.models import Company
from invoices.models import Invoice
from payments.models import Payment


User = get_user_model()


class FinancialAssistantTests(TestCase):

    def setUp(self):
        # Create company owners
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="test-password",
        )

        self.other_owner = User.objects.create_user(
            email="other@example.com",
            password="test-password",
        )

        # Create companies
        self.company = Company.objects.create(
            owner=self.owner,
            name="Owner Company",
            email="owner-company@example.com",
        )

        self.other_company = Company.objects.create(
            owner=self.other_owner,
            name="Other Company",
            email="other-company@example.com",
        )

        # Create clients
        self.client_record = Client.objects.create(
            company=self.company,
            created_by=self.owner,
            name="Owner Client",
        )

        self.other_client = Client.objects.create(
            company=self.other_company,
            created_by=self.other_owner,
            name="Other Client",
        )

        # Create own-company invoices
        self.invoice = self.create_invoice(
            self.company,
            self.client_record,
            Invoice.Status.SENT,
            date.today() + timedelta(days=30),
            Decimal("100.00"),
        )

        self.overdue_invoice = self.create_invoice(
            self.company,
            self.client_record,
            Invoice.Status.OVERDUE,
            date.today() - timedelta(days=1),
            Decimal("50.00"),
        )

        # Create another company's invoices
        self.other_invoice = self.create_invoice(
            self.other_company,
            self.other_client,
            Invoice.Status.SENT,
            date.today() + timedelta(days=30),
            Decimal("900.00"),
        )

        self.other_overdue_invoice = self.create_invoice(
            self.other_company,
            self.other_client,
            Invoice.Status.OVERDUE,
            date.today() - timedelta(days=1),
            Decimal("75.00"),
        )

        # Create payments
        Payment.objects.create(
            invoice=self.invoice,
            amount=Decimal("25.00"),
            payment_method=Payment.Method.CASH,
            payment_date=date.today(),
        )

        Payment.objects.create(
            invoice=self.other_invoice,
            amount=Decimal("800.00"),
            payment_method=Payment.Method.CASH,
            payment_date=date.today(),
        )

        # Authenticate owner
        self.api_client = APIClient()
        self.api_client.force_authenticate(self.owner)

        self.url = reverse(
            "financial-assistant",
            kwargs={"company_id": self.company.id},
        )

    @staticmethod
    def create_invoice(company, client, status, due_date, total_amount):
        return Invoice.objects.create(
            company=company,
            client=client,
            created_by=company.owner,
            issue_date=date.today(),
            due_date=due_date,
            status=status,
            total_amount=total_amount,
        )

    @staticmethod
    def mock_ai_response(answer):
        response = MagicMock()

        response.__enter__.return_value = response

        response.read.return_value = json.dumps({
            "choices": [
                {
                    "message": {
                        "content": answer
                    }
                }
            ]
        }).encode("utf-8")

        return response

    def ask(self, message, history=None):
        return self.api_client.post(
            self.url,
            {
                "message": message,
                "history": history or [],
            },
            format="json",
        )

    @staticmethod
    def extract_financial_context(mock_call):
        request = mock_call.args[0]

        payload = json.loads(
            request.data.decode("utf-8")
        )

        system_message = payload["messages"][0]["content"]

        marker = "Company financial data:\n"

        financial_json = system_message.split(marker, 1)[1]

        return json.loads(financial_json)

    @patch("reports.views.urlopen")
    def test_answers_use_only_company_financial_data(self, mock_urlopen):

        mock_urlopen.side_effect = [
            self.mock_ai_response(
                "Your company received ₹25.00 in payments."
            ),
            self.mock_ai_response(
                "Your outstanding balance is ₹125.00."
            ),
        ]

        revenue_response = self.ask(
            "How much revenue did my company receive?"
        )

        outstanding_response = self.ask(
            "How much payment is outstanding?"
        )

        self.assertEqual(
            revenue_response.status_code,
            200,
            msg=str(revenue_response.data),
        )

        self.assertEqual(
            outstanding_response.status_code,
            200,
            msg=str(outstanding_response.data),
        )

        self.assertEqual(
            revenue_response.data["answer"],
            "Your company received ₹25.00 in payments.",
        )

        self.assertEqual(
            outstanding_response.data["answer"],
            "Your outstanding balance is ₹125.00.",
        )

        # Verify only the authenticated company's figures are supplied.
        financial_data = self.extract_financial_context(
            mock_urlopen.call_args_list[0]
        )

        self.assertEqual(
            financial_data["company_name"],
            "Owner Company",
        )

        self.assertEqual(
            financial_data["payments_received"],
            "25.00",
        )

        self.assertEqual(
            financial_data["outstanding_balance"],
            "125.00",
        )

        self.assertEqual(
            financial_data["total_invoices"],
            2,
        )

        self.assertEqual(
            financial_data["overdue_invoice_count"],
            1,
        )

    @patch("reports.views.urlopen")
    def test_lists_only_this_company_overdue_invoices(self, mock_urlopen):

        mock_urlopen.return_value = self.mock_ai_response(
            f"Your overdue invoice is {self.overdue_invoice.invoice_number}."
        )

        response = self.ask(
            "Which invoices are overdue?"
        )

        self.assertEqual(
            response.status_code,
            200,
            msg=str(response.data),
        )

        self.assertIn(
            self.overdue_invoice.invoice_number,
            response.data["answer"],
        )

        # Verify that the other company's overdue invoice is excluded.
        financial_data = self.extract_financial_context(
            mock_urlopen.call_args
        )

        overdue_numbers = [
            item["invoice_number"]
            for item in financial_data["overdue_invoices"]
        ]

        self.assertIn(
            self.overdue_invoice.invoice_number,
            overdue_numbers,
        )

        self.assertNotIn(
            self.other_overdue_invoice.invoice_number,
            overdue_numbers,
        )

    def test_rejects_empty_messages(self):

        response = self.ask("")

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_rejects_messages_longer_than_1000_characters(self):

        response = self.ask("A" * 1001)

        self.assertEqual(
            response.status_code,
            400,
        )

    def test_denies_users_without_company_membership(self):

        self.api_client.force_authenticate(self.other_owner)

        response = self.ask(
            "How much revenue did my company receive?"
        )

        self.assertEqual(
            response.status_code,
            403,
        )
