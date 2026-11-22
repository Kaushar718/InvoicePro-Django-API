from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Company, Employee


User = get_user_model()


class AccessibleCompanyListTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="test-password",
        )
        self.other_owner = User.objects.create_user(
            email="other@example.com",
            password="test-password",
        )
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
        self.client = APIClient()

    def test_owner_only_sees_companies_they_own(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get(reverse("company-create"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [company["id"] for company in response.data],
            [self.company.id],
        )
        self.assertNotIn(
            self.other_company.id,
            [company["id"] for company in response.data],
        )

    def test_employee_sees_their_company(self):
        employee_user = User.objects.create_user(
            email="employee@example.com",
            password="test-password",
        )
        Employee.objects.create(
            user=employee_user,
            company=self.company,
        )
        self.client.force_authenticate(employee_user)

        response = self.client.get(reverse("company-create"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [company["id"] for company in response.data],
            [self.company.id],
        )
