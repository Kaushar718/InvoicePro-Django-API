from rest_framework.permissions import BasePermission

from companies.models import Company


class IsCompanyMember(BasePermission):
    message = "You do not have access to this company."

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        company_id = view.kwargs.get("company_id")

        if not company_id:
            return False

        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return False

        # Company owner
        if company.owner_id == request.user.id:
            return True

        # Company employee
        return hasattr(
            request.user,
            "employee_profile",
        ) and request.user.employee_profile.company_id == company.id