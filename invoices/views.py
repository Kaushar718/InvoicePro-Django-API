from io import BytesIO

from django.http import HttpResponse, response
from django.template.loader import render_to_string
from xhtml2pdf import pisa


from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from companies.models import Company

from .models import Invoice
from .permissions import IsCompanyMember
from .serializers import InvoiceSerializer


class InvoiceListCreateView(generics.ListCreateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Invoice.objects.filter(
            company_id=self.kwargs["company_id"]
        ).prefetch_related("items")

    def get_serializer_context(self):
        context = super().get_serializer_context()

        company = get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
        )

        context["company"] = company
        return context


class InvoiceDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Invoice.objects.filter(
            company_id=self.kwargs["company_id"]
        ).prefetch_related("items")

    def get_serializer_context(self):
        context = super().get_serializer_context()

        company = get_object_or_404(
            Company,
            id=self.kwargs["company_id"],
        )

        context["company"] = company
        return context 


class InvoicePDFView(generics.GenericAPIView):
    permission_classes = [
        IsAuthenticated,
        IsCompanyMember,
    ]

    def get_queryset(self):
        return Invoice.objects.filter(
            company_id=self.kwargs["company_id"]
        ).select_related(
            "company",
            "client",
        ).prefetch_related(
            "items",
            "payments",
        )

    def get(self, request, *args, **kwargs):
        invoice = get_object_or_404(
            self.get_queryset(),
            id=kwargs["pk"],
        )

        html = render_to_string(
            "invoices/invoice_pdf.html",
            {
                "invoice": invoice,
                "company": invoice.company,
                "client": invoice.client,
            },
        )

        result = BytesIO()

        pdf = pisa.CreatePDF(
            html,
            dest=result,
        )

        if pdf.err:
            return HttpResponse(
                "Error generating PDF",
                status=500,
            )

        response = HttpResponse(
            result.getvalue(),
            content_type="application/pdf",
        )

        response["Content-Disposition"] = (
            f'attachment; filename="{invoice.invoice_number}.pdf"'
        )
        return response   
