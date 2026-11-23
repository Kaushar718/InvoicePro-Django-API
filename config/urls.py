from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import AllowAny

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    login_page,
    register_page,
    dashboard_page,
    clients_page,
    products_page,
    invoices_page,
    payments_page,
    reports_page,
    notifications_page,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication APIs
    path("api/auth/", include("accounts.urls")),
    path(
        "api/auth/login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="refresh",
    ),

    # Company APIs
    path("api/companies/", include("companies.urls")),

    # Company-scoped application APIs
    path(
        "api/companies/<int:company_id>/clients/",
        include("clients.urls"),
    ),
    path(
        "api/companies/<int:company_id>/",
        include("products.urls"),
    ),
    path(
        "api/companies/<int:company_id>/invoices/",
        include("invoices.urls"),
    ),
    path(
        "api/companies/<int:company_id>/invoices/<int:invoice_id>/payments/",
        include("payments.urls"),
    ),
    path(
        "api/companies/<int:company_id>/",
        include("reports.urls"),
    ),
    path(
        "api/companies/<int:company_id>/notifications/",
        include("notifications.urls"),
    ),

    # API documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),

    # Frontend pages
    path("", login_page, name="login-page"),
    path("register/", register_page, name="register-page"),
    path("dashboard/", dashboard_page, name="dashboard-page"),
    path("clients/", clients_page, name="clients-page"),
    path("products/", products_page, name="products-page"),
    path("invoices/", invoices_page, name="invoices-page"),
    path("payments/", payments_page, name="payments-page"),
    path("reports/", reports_page, name="reports-page"),
    path("notifications/", notifications_page, name="notifications-page"),
]
