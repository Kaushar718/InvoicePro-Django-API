"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import AllowAny

from .views import (
    login_page,
    dashboard_page,
    clients_page,
    products_page,
    invoices_page,
    payments_page,
    reports_page,
    notifications_page,
)

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/", 
         include("accounts.urls")),

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

    path(
    "api/companies/",
    include("companies.urls"),
),

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


path(
    "api/schema/",
    SpectacularAPIView.as_view(
        permission_classes=[AllowAny]
    ),
    name="schema",
),

path(
    "api/docs/",
    SpectacularSwaggerView.as_view(
        url_name="schema"
    ),
    name="swagger-ui",
),

path(
    "api/redoc/",
    SpectacularRedocView.as_view(
        url_name="schema"
    ),
    name="redoc",
),
path("", login_page, name="login-page"),

path("dashboard/", dashboard_page, name="dashboard-page"),

path("clients/", clients_page, name="clients-page"),

path("products/", products_page, name="products-page"),

path("invoices/", invoices_page, name="invoices-page"),

path("payments/", payments_page, name="payments-page"),

path("reports/", reports_page, name="reports-page"),

path(
    "notifications/",
    notifications_page,
    name="notifications-page",
),
]