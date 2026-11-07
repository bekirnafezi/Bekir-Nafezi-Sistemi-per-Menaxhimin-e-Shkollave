from django.shortcuts import render


def login_page(request):
    return render(request, "shkolla/login.html")


def dashboard_page(request):
    return render(request, "shkolla/dashboard.html")


def klasat_page(request):
    return render(request, "shkolla/klasat.html")