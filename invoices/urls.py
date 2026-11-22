from django.urls import path

from .views import (
    InvoiceDetailView,
    InvoiceListCreateView,
    InvoicePDFView,
)


urlpatterns = [
    path(
        "",
        InvoiceListCreateView.as_view(),
        name="invoice-list-create",
    ),
    path(
        "<int:pk>/",
        InvoiceDetailView.as_view(),
        name="invoice-detail",
    ),
    path(
        "<int:pk>/pdf/",
        InvoicePDFView.as_view(),
        name="invoice-pdf",
    ),
]