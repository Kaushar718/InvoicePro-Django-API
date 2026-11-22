from django.urls import path

from .views import (
    CompanyDashboardView,
    FinancialAssistantView,
    MonthlyRevenueView,
)


urlpatterns = [
    path(
        "dashboard/",
        CompanyDashboardView.as_view(),
        name="company-dashboard",
    ),
    path(
        "monthly-revenue/",
        MonthlyRevenueView.as_view(),
        name="monthly-revenue",
    ),
    path(
        "financial-assistant/",
        FinancialAssistantView.as_view(),
        name="financial-assistant",
    ),
]