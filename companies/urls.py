from django.urls import path

from .views import (
    CompanyCreateView,
    EmployeeCreateView,
    EmployeeListView,
)


urlpatterns = [
    path(
        "",
        CompanyCreateView.as_view(),
        name="company-create",
    ),

    path(
        "<int:company_id>/employees/",
        EmployeeListView.as_view(),
        name="employee-list",
    ),

    path(
        "<int:company_id>/employees/create/",
        EmployeeCreateView.as_view(),
        name="employee-create",
    ),
]