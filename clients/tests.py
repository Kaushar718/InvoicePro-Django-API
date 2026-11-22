
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from companies.models import Company, Employee


class ClientAPITests(APITestCase):

    def create_test_user(self, email, role):
        """
        Create a test user without using the default create_user manager,
        because the current custom UserManager still requires username.
        """
        user = User(
            email=email,
            role=role,
            is_active=True,
        )
        user.set_password("StrongPass123!")
        user.save()
        return user

    def setUp(self):
        # 1. Create company owner
        self.owner = self.create_test_user(
            email="owner@test.com",
            role=User.Role.COMPANY_OWNER,
        )

        # 2. Create owner's company
        self.company = Company.objects.create(
            name="Owner Test Company",
            owner=self.owner,
        )

        # 3. Create employee user
        self.employee_user = self.create_test_user(
            email="employee@test.com",
            role=User.Role.EMPLOYEE,
        )

        # 4. Connect employee to owner's company
        self.employee = Employee.objects.create(
            user=self.employee_user,
            company=self.company,
        )

        # 5. Create another company owner
        self.other_owner = self.create_test_user(
            email="otherowner@test.com",
            role=User.Role.COMPANY_OWNER,
        )

        # 6. Create another owner's company
        self.other_company = Company.objects.create(
            name="Other Test Company",
            owner=self.other_owner,
        )

        # 7. Client API URL
        self.clients_url = (
            f"/api/companies/{self.company.id}/clients/"
        )

    def test_owner_can_create_client(self):
        """
        Company owner should be able to create a client.
        """
        self.client.force_authenticate(user=self.owner)

        payload = {
            "name": "Test ABC Enterprises",
            "email": "abc@test.com",
            "phone": "9876501234",
            "address": "Whitefield",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560066",
            "gstin": "29ABCDE1234F1Z5",
        }

        response = self.client.post(
            self.clients_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            msg=str(response.data),
        )

    def test_employee_can_access_own_company_clients(self):
        """
        An employee should be able to access clients
        belonging to their own company.
        """
        self.client.force_authenticate(user=self.employee_user)

        response = self.client.get(self.clients_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
            msg=str(response.data),
        )

    def test_other_company_cannot_access_clients(self):
        """
        An owner of another company should not be able
        to access this company's clients.
        """
        self.client.force_authenticate(user=self.other_owner)

        other_company_url = (
            f"/api/companies/{self.company.id}/clients/"
        )

        response = self.client.get(other_company_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND,
            ],
            msg=f"Unexpected response: {response.status_code} - {response.data}",
        )
