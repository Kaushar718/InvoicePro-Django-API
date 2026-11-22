from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Company
from .serializers import CompanySerializer


class CompanyCreateView(generics.ListCreateAPIView):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Company.objects.filter(
            Q(owner=self.request.user)
            | Q(employees__user=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)



from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Company, Employee
from .permissions import IsCompanyOwner
from .serializers import (
    CompanySerializer,
    EmployeeCreateSerializer,
    EmployeeSerializer,
)        


class EmployeeCreateView(generics.CreateAPIView):
    serializer_class = EmployeeCreateSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyOwner,
    ]

    def get_serializer_context(self):
        context = super().get_serializer_context()

        company = get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
            owner=self.request.user,
        )

        context["company"] = company
        return context



class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyOwner,
    ]

    def get_queryset(self):
        return Employee.objects.filter(
            company__id=self.kwargs["company_id"],
            company__owner=self.request.user,
        )    