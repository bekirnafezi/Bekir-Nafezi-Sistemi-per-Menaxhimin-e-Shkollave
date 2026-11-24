from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.contrib.auth import authenticate
from django.db.models import Q
from django.shortcuts import render
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Nxenesi, Nota, Mungesa, Vendim, NjoftimMesimdhenesi
from .teacher_notices_api import njoftim_data


class StudentLoginLimit(AnonRateThrottle):
    rate = "8/min"


def student_login_page(request):
    return render(request, "shkolla/student_login.html")


def student_panel_page(request, section):
    sections = {"klasa", "notat", "mungesat", "njoftimet", "aktivitetet"}
    if section not in sections:
        from django.http import Http404
        raise Http404
    return render(request, "shkolla/student_portal.html", {"section": section})


def _nxenesi(request):
    user = request.user
    if not user.is_authenticated or not user.is_active or user.roli != "nxenes":
        return None
    return Nxenesi.objects.select_related(
        "perdorues", "klasa", "klasa__kujdestari__perdorues"
    ).filter(perdorues_id=user.pk).first()


def _avg(nums):
    if not nums:
        return None
    return float((sum(Decimal(str(x)) for x in nums) / Decimal(len(nums))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _student_id(raw):
    raw = str(raw or "").strip().upper()
    if raw.startswith("NX-"):
        raw = raw[3:]
    if not raw.isascii() or not raw.isdigit():
        return None
    value = int(raw)
    return value if 0 < value < 2147483648 else None


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([StudentLoginLimit])
def student_login_api(request):
    data = request.data
    emri = str(data.get("emri", "")).strip()
    mbiemri = str(data.get("mbiemri", "")).strip()
    password = str(data.get("fjalekalimi", ""))
    ident = _student_id(data.get("id_nxenesi"))
    if not all([emri, mbiemri, ident, password]) or len(emri) > 150 or len(mbiemri) > 150:
        return Response({"gabim": "Plotëso emrin, mbiemrin, ID-në dhe fjalëkalimin."}, status=400)
    student = Nxenesi.objects.select_related("perdorues", "klasa").filter(pk=ident).first()
    error = "Ju nuk jeni nxënës i kësaj shkolle ose të dhënat e hyrjes nuk janë të sakta."
    if not student or not student.klasa_id:
        return Response({"gabim": error}, status=401)
    user = student.perdorues
    if (user.roli != "nxenes" or not user.is_active
            or user.first_name.casefold().strip() != emri.casefold()
            or user.last_name.casefold().strip() != mbiemri.casefold()):
        return Response({"gabim": error}, status=401)
    verified = authenticate(request, email=user.email, password=password)
    if verified is None or verified.pk != user.pk:
        return Response({"gabim": error}, status=401)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "redirect": "/nxenesi/klasa/", "id_nxenesi": f"NX-{student.pk:04d}"})


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_me_api(request):
    student = _nxenesi(request)
    if student is None:
        return Response({"gabim": "Nuk keni qasje në panelin e nxënësit."}, status=403)
    guardian = student.klasa.kujdestari
    user = student.perdorues
    foto = getattr(student, "foto", None)
    try:
        photo_url = foto.url if foto else None
    except ValueError:
        photo_url = None
    return Response({
        "id": student.pk, "id_nxenesi": f"NX-{student.pk:04d}",
        "emri": user.first_name, "mbiemri": user.last_name,
        "email": user.email, "foto": photo_url,
        "klasa": {"id": student.klasa_id, "emri": student.klasa.emri},
        "kujdestari": ({"emri": guardian.perdorues.get_full_name().strip() or guardian.perdorues.email,
                        "email": guardian.perdorues.email} if guardian else None),
    })


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_grades_api(request):
    student = _nxenesi(request)
    if student is None:
        return Response({"gabim": "Qasje e ndaluar."}, status=403)
    subjects = defaultdict(list)
    rows = []
    qs = Nota.objects.filter(nxenesi=student).select_related(
        "angazhimi__lenda", "angazhimi__mesimdhenesi__perdorues"
    ).order_by("angazhimi__lenda__emri", "-data", "-id")
    for grade in qs:
        subject = grade.angazhimi.lenda.emri
        subjects[subject].append(grade.vleresimi)
        teacher = grade.angazhimi.mesimdhenesi.perdorues
        rows.append({
            "id": grade.pk, "lenda": subject, "nota": grade.vleresimi,
            "data": grade.data.isoformat(),
            "mesimdhenesi": teacher.get_full_name().strip() or teacher.email,
        })
    by_subject = [{"lenda": name, "notat": len(nums), "mesatarja": _avg(nums)}
                  for name, nums in sorted(subjects.items())]
    overall = _avg([x["mesatarja"] for x in by_subject])
    return Response({"mesatarja": overall, "gjithsej": len(rows), "lendet": by_subject, "notat": rows})


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_absences_api(request):
    student = _nxenesi(request)
    if student is None:
        return Response({"gabim": "Qasje e ndaluar."}, status=403)
    rows = []
    counts = {"e_arsyeshme": 0, "e_paarsyeshme": 0, "ne_shqyrtim": 0}
    qs = Mungesa.objects.filter(nxenesi=student).select_related(
        "angazhimi__lenda", "angazhimi__mesimdhenesi__perdorues"
    ).order_by("-data", "-ora_mesimore", "-id")
    for absence in qs:
        status = getattr(absence, "statusi", "ne_shqyrtim")
        counts[status] = counts.get(status, 0) + 1
        teacher = absence.angazhimi.mesimdhenesi.perdorues
        rows.append({
            "id": absence.pk, "data": absence.data.isoformat(),
            "ora": getattr(absence, "ora_mesimore", None),
            "lenda": absence.angazhimi.lenda.emri,
            "mesimdhenesi": teacher.get_full_name().strip() or teacher.email,
            "statusi": status, "arsyetimi": absence.arsyetimi or "",
        })
    return Response({"gjithsej": len(rows), "statuset": counts, "mungesat": rows})


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def student_notices_api(request):
    student = _nxenesi(request)
    if student is None:
        return Response({"gabim": "Qasje e ndaluar."}, status=403)
    qs = Vendim.objects.filter(
        Q(kategoria="shkolle") | Q(kategoria="nxenes", nxenesi=student)
    ).order_by("-data_vendimit", "-pk")
    teacher_notices = NjoftimMesimdhenesi.objects.filter(nxenesit=student).order_by("-krijuar_me", "-pk")
    return Response({"njoftimet": [{
        "id": d.pk, "titulli": d.titulli, "permbajtja": d.permbajtja,
        "data": d.data_vendimit.isoformat(), "derguesi": "Drejtori",
    } for d in qs], "njoftimet_mesimdhenesit": [njoftim_data(n) for n in teacher_notices]})
