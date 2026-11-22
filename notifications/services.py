from .models import Notification


def notify_company_users(
    company,
    invoice,
    notification_type,
    title,
    message,
):
    # Notify the company owner.
    recipient_ids = {company.owner_id}

    # Also notify active employees of this company.
    employee_ids = company.employees.filter(
        is_active=True
    ).values_list("user_id", flat=True)

    recipient_ids.update(employee_ids)

    notifications = [
        Notification(
            company=company,
            recipient_id=recipient_id,
            invoice=invoice,
            notification_type=notification_type,
            title=title,
            message=message,
        )
        for recipient_id in recipient_ids
    ]

    Notification.objects.bulk_create(notifications)