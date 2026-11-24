from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Klasa, Nxenesi, Mungesa


def director_absences_page(request):
    return render(request, "shkolla/director_absences.html")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def director_absences_data_api(request):
    if getattr(request.user, "roli", None) != "drejtor":
        return Response({"gabim": "Vetem Drejtori mund t'i shikoje te gjitha mungesat."}, status=status.HTTP_403_FORBIDDEN)

    params = {}
    for field in ("klasa", "nxenesi"):
        raw = request.query_params.get(field, "").strip()
        if raw:
            if not raw.isascii() or not raw.isdecimal() or int(raw) <= 0:
                return Response({"gabim": f"Parametri {field} nuk eshte i vlefshem."}, status=status.HTTP_400_BAD_REQUEST)
            params[field] = int(raw)

    requested_status = request.query_params.get("statusi", "").strip()
    valid_statuses = {"ne_shqyrtim", "e_arsyeshme", "e_paarsyeshme"}
    if requested_status and requested_status not in valid_statuses:
        return Response({"gabim": "Statusi nuk eshte i vlefshem."}, status=status.HTTP_400_BAD_REQUEST)

    klasses = list(Klasa.objects.order_by("emri", "id").values("id", "emri"))
    students = []
    for student in Nxenesi.objects.select_related("perdorues", "klasa").order_by("perdorues__first_name", "perdorues__last_name", "id"):
        user = student.perdorues
        name = (f"{user.first_name} {user.last_name}").strip() or user.email
        students.append({"id": student.pk, "emri": name, "klasa_id": student.klasa_id})

    class_id = params.get("klasa")
    student_id = params.get("nxenesi")
    if class_id is not None and not any(c["id"] == class_id for c in klasses):
        return Response({"gabim": "Klasa nuk ekziston."}, status=status.HTTP_404_NOT_FOUND)
    if student_id is not None:
        student = next((n for n in students if n["id"] == student_id), None)
        if student is None:
            return Response({"gabim": "Nxenesi nuk ekziston."}, status=status.HTTP_404_NOT_FOUND)
        if class_id is not None and student["klasa_id"] != class_id:
            return Response({"gabim": "Nxenesi nuk i perket klases se zgjedhur."}, status=status.HTTP_400_BAD_REQUEST)

    qs = Mungesa.objects.select_related("nxenesi__perdorues", "nxenesi__klasa", "angazhimi__lenda").order_by("-data", "-ora_mesimore", "-id")
    if class_id is not None:
        qs = qs.filter(nxenesi__klasa_id=class_id)
    if student_id is not None:
        qs = qs.filter(nxenesi_id=student_id)
    if requested_status:
        qs = qs.filter(statusi=requested_status)

    counts = {"gjithsej": 0, "e_arsyeshme": 0, "e_paarsyeshme": 0, "ne_shqyrtim": 0}
    rows = []
    for absence in qs:
        student = absence.nxenesi
        user = student.perdorues
        name = (f"{user.first_name} {user.last_name}").strip() or user.email
        counts["gjithsej"] += 1
        if absence.statusi in counts:
            counts[absence.statusi] += 1
        rows.append({
            "id": absence.pk,
            "nxenesi": name,
            "nxenesi_id": student.pk,
            "klasa": student.klasa.emri,
            "klasa_id": student.klasa_id,
            "lenda": absence.angazhimi.lenda.emri,
            "data": absence.data.isoformat() if absence.data else "",
            "ora_mesimore": absence.ora_mesimore,
            "statusi": absence.statusi,
            "arsyetimi": absence.arsyetimi or "",
        })

    return Response({"klasat": klasses, "nxenesit": students, "mungesat": rows, "statistika": counts})
