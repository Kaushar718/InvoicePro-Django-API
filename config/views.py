from django.shortcuts import render


def login_page(request):
    return render(request, "frontend/login.html")


def register_page(request):
    return render(request, "frontend/register.html")


def dashboard_page(request):
    return render(request, "frontend/dashboard.html")


def clients_page(request):
    return render(request, "frontend/clients.html")


def products_page(request):
    return render(request, "frontend/products.html")


def invoices_page(request):
    return render(request, "frontend/invoices.html")


def payments_page(request):
    return render(request, "frontend/payments.html")


def reports_page(request):
    return render(request, "frontend/reports.html")


def notifications_page(request):
    return render(request, "frontend/notifications.html")
