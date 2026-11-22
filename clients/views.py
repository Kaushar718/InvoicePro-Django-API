from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import IsAuthenticated

from companies.models import Company

from .models import Client
from .permissions import IsCompanyMember
from .serializers import ClientSerializer


class ClientListCreateView(generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "city",
        "state",
    ]

    search_fields = [
        "name",
        "email",
        "phone",
        "gst_number",
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    def get_queryset(self):
        return Client.objects.filter(
            company_id=self.kwargs["company_id"]
        ).select_related(
            "company",
            "created_by",
        )

    def perform_create(self, serializer):
        company = get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
        )

        serializer.save(
            company=company,
            created_by=self.request.user,
        )


class ClientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Client.objects.filter(
            company_id=self.kwargs["company_id"]
        ).select_related(
            "company",
            "created_by",
        )
