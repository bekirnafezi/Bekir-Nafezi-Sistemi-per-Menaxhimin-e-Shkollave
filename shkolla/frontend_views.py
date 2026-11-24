from django.shortcuts import render, redirect


def login_page(request):
    if request.GET.get("role") == "nxenes":
        from .student_portal import student_login_page
        return student_login_page(request)
    if request.GET.get("role") == "drejtor":
        return render(request, "shkolla/director_login.html")
    if request.GET.get("role") == "mesimdhenes":
        return render(request, "shkolla/teacher_login.html")

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


def zgjedh_rolin_page(request):
    return render(request, "shkolla/zgjedh_rolin.html")


def teacher_register_page(request):
    return render(request, "shkolla/teacher_register.html")


def teacher_dashboard_page(request):
    return redirect("teacher_classes")

def director_requests_page(request):
    return render(request, "shkolla/director_requests.html")