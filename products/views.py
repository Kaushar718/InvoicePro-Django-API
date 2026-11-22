from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics
from rest_framework.permissions import IsAuthenticated

from companies.models import Company

from .models import Category, Product
from .permissions import IsCompanyMember
from .serializers import CategorySerializer, ProductSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    search_fields = [
        "name",
        "description",
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    ordering_fields = [
        "name",
        "created_at",
    ]

    def get_queryset(self):
        return Category.objects.filter(
            company_id=self.kwargs["company_id"]
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


class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
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
        "category",
        "is_active",
    ]

    search_fields = [
        "name",
        "sku",
        "description",
    ]

    ordering_fields = [
        "name",
        "price",
        "stock_quantity",
        "created_at",
    ]

    def get_queryset(self):
        return Product.objects.filter(
            company_id=self.kwargs["company_id"]
        ).select_related(
            "category",
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


class ProductDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = ProductSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Product.objects.filter(
            company_id=self.kwargs["company_id"]
        )