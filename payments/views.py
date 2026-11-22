
from django.shortcuts import get_object_or_404

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, BasePermission

from companies.models import Company, Employee
from invoices.models import Invoice

from .models import Payment
from .serializers import PaymentSerializer


class IsCompanyMember(BasePermission):
    """
    Allow access only to the company owner
    or an employee belonging to that company.
    """

    message = "You are not a member of this company."

    def has_permission(self, request, view):
        company_id = view.kwargs.get("company_id")
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Check whether the user owns this company.
        is_owner = Company.objects.filter(
            id=company_id,
            owner=user,
        ).exists()

        if is_owner:
            return True

        # Check whether the user is an employee of this company.
        is_employee = Employee.objects.filter(
            company_id=company_id,
            user=user,
        ).exists()

        return is_employee


class PaymentListCreateView(generics.ListCreateAPIView):

    serializer_class = PaymentSerializer

    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_company(self):
        return get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
        )

    def get_invoice(self):
        return get_object_or_404(
            Invoice,
            id=self.kwargs["invoice_id"],
            company_id=self.kwargs["company_id"],
        )

    def get_queryset(self):
        return Payment.objects.filter(
            invoice__company_id=self.kwargs["company_id"],
            invoice_id=self.kwargs["invoice_id"],
        ).select_related("invoice")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["invoice"] = self.get_invoice()
        return context
