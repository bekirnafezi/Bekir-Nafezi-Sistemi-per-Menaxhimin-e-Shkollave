
from django.shortcuts import render


def login_page(request):
    return render(request, "shkolla/login.html")


def dashboard_page(request):
    return render(request, "shkolla/dashboard.html")


def klasat_page(request):
    return render(request, "shkolla/klasat.html")


def nxenesit_page(request):
    return render(request, "shkolla/nxenesit.html")


def mesimdhenesit_page(request):
    return render(request, "shkolla/mesimdhenesit.html")


def lendet_page(request):
    return render(request, "shkolla/lendet.html")


def angazhimet_page(request):
    return render(request, "shkolla/angazhimet.html")


def notat_page(request):
    return render(request, "shkolla/evidenca.html", {"tipi": "notat"})


def mungesat_page(request):
    return render(request, "shkolla/evidenca.html", {"tipi": "mungesat"})
