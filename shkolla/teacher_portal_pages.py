from django.shortcuts import render


def teacher_classes_page(request):
    return render(request, "shkolla/teacher_classes.html", {"section": "klasat"})


def teacher_grades_page(request):
    return render(request, "shkolla/teacher_grades.html", {"section": "notat"})


def teacher_tutor_page(request):
    return render(request, "shkolla/teacher_tutor.html", {"section": "klasa-ime"})


def teacher_decisions_page(request):
    return render(request, "shkolla/teacher_decisions.html", {"section": "vendimet"})


def teacher_requests_page(request):
    return render(request, "shkolla/teacher_requests.html", {"section": "kerkesat"})
