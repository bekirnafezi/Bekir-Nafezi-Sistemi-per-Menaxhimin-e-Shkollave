from collections import defaultdict

from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Klasa, Nxenesi, Nota


def director_grades_page(request):
    return render(request, "shkolla/director_grades.html")


def _mesatarja(vlerat):
    if not vlerat:
        return None
    return round(sum(vlerat) / len(vlerat), 2)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def director_grades_data_api(request):
    if getattr(request.user, "roli", None) != "drejtor":
        return Response({"gabim": "Vetem Drejtori mund t'i shikoje keto te dhena."}, status=status.HTTP_403_FORBIDDEN)

    klasa_param = request.query_params.get("klasa", "").strip()
    nxenesi_param = request.query_params.get("nxenesi", "").strip()
    for fusha, vlera in (("klasa", klasa_param), ("nxenesi", nxenesi_param)):
        if vlera and not (vlera.isascii() and vlera.isdecimal() and int(vlera) > 0):
            return Response({"gabim": f"Parametri {fusha} nuk eshte i vlefshem."}, status=status.HTTP_400_BAD_REQUEST)

    klasa_id = int(klasa_param) if klasa_param else None
    nxenesi_id = int(nxenesi_param) if nxenesi_param else None

    klasat = list(Klasa.objects.order_by("emri", "id").values("id", "emri"))
    nxenesit_qs = Nxenesi.objects.select_related("perdorues", "klasa").order_by("perdorues__first_name", "perdorues__last_name", "id")
    nxenesit = []
    for n in nxenesit_qs:
        emri = (f"{n.perdorues.first_name} {n.perdorues.last_name}").strip() or n.perdorues.email
        nxenesit.append({"id": n.pk, "emri": emri, "klasa_id": n.klasa_id})

    if klasa_id is not None and not any(k["id"] == klasa_id for k in klasat):
        return Response({"gabim": "Klasa nuk ekziston."}, status=status.HTTP_404_NOT_FOUND)
    if nxenesi_id is not None:
        student = next((n for n in nxenesit if n["id"] == nxenesi_id), None)
        if not student:
            return Response({"gabim": "Nxenesi nuk ekziston."}, status=status.HTTP_404_NOT_FOUND)
        if klasa_id is not None and student["klasa_id"] != klasa_id:
            return Response({"gabim": "Nxenesi nuk i perket klases se zgjedhur."}, status=status.HTTP_400_BAD_REQUEST)

    grades = Nota.objects.select_related("nxenesi__perdorues", "nxenesi__klasa", "angazhimi__lenda", "angazhimi__mesimdhenesi__perdorues").order_by("-data", "-id")
    school_values = defaultdict(list)
    class_values = defaultdict(list)
    all_rows = []
    for nota in grades:
        n = nota.nxenesi
        school_values[n.pk].append(nota.vleresimi)
        class_values[n.klasa_id].append(nota.vleresimi)
        emri = (f"{n.perdorues.first_name} {n.perdorues.last_name}").strip() or n.perdorues.email
        teacher = nota.angazhimi.mesimdhenesi.perdorues
        teacher_name = (f"{teacher.first_name} {teacher.last_name}").strip() or teacher.email
        all_rows.append({
            "id": nota.pk,
            "nxenesi_id": n.pk,
            "nxenesi": emri,
            "klasa_id": n.klasa_id,
            "klasa": n.klasa.emri,
            "lenda": nota.angazhimi.lenda.emri,
            "nota": nota.vleresimi,
            "data": nota.data.isoformat() if nota.data else "",
            "mesimdhenesi": teacher_name,
        })

    student_means = [_mesatarja(vlerat) for vlerat in school_values.values()]
    avg_school = _mesatarja(student_means)
    selected_rows = [r for r in all_rows if (klasa_id is None or r["klasa_id"] == klasa_id) and (nxenesi_id is None or r["nxenesi_id"] == nxenesi_id)]
    if klasa_id is None:
        avg_class = None
    else:
        class_student_means = [_mesatarja(school_values[n["id"]]) for n in nxenesit if n["klasa_id"] == klasa_id and n["id"] in school_values]
        avg_class = _mesatarja(class_student_means)
    avg_student = _mesatarja(school_values[nxenesi_id]) if nxenesi_id is not None else None

    return Response({
        "klasat": klasat,
        "nxenesit": nxenesit,
        "notat": selected_rows,
        "statistika": {
            "mesatarja_shkollore": avg_school,
            "mesatarja_klases": avg_class,
            "mesatarja_nxenesit": avg_student,
            "nota_ne_perzgjedhje": len(selected_rows),
            "nxenes_me_nota": len(school_values),
        },
    })
