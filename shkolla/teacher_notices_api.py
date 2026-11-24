from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Klasa, Nxenesi, NjoftimMesimdhenesi
from .teacher_portal_api import approved_teacher


class NjoftimSerializer(serializers.Serializer):
    klasa = serializers.IntegerField(min_value=1, max_value=2147483647)
    nxenesi = serializers.IntegerField(min_value=1, max_value=2147483647, required=False, allow_null=True)
    titulli = serializers.CharField(min_length=3, max_length=200)
    permbajtja = serializers.CharField(min_length=5, max_length=3000)


def emri(user):
    return user.get_full_name().strip() or user.email


def njoftim_data(n):
    return {
        "id": n.pk, "titulli": n.titulli, "permbajtja": n.permbajtja,
        "derguesi": n.derguesi, "marresi": n.marresi,
        "data": (timezone.localtime(n.krijuar_me) if timezone.is_aware(n.krijuar_me) else n.krijuar_me).date().isoformat(),
    }


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def teacher_notices_api(request):
    teacher = approved_teacher(request.user)
    if not teacher or not request.user.is_active:
        return Response({"gabim": "Qasje e ndaluar."}, status=403)

    classes = Klasa.objects.filter(
        Q(kujdestari=teacher) | Q(angazhimet__mesimdhenesi=teacher)
    ).distinct().order_by("emri", "pk")

    if request.method == "GET":
        students = Nxenesi.objects.filter(
            klasa__in=classes, perdorues__is_active=True, perdorues__roli="nxenes"
        ).select_related("perdorues").order_by("perdorues__first_name", "perdorues__last_name", "pk")
        grouped = {}
        for student in students:
            grouped.setdefault(student.klasa_id, []).append({
                "id": student.pk, "emri": emri(student.perdorues),
                "identifikuesi": f"NX-{student.pk:04d}",
            })
        return Response({
            "klasat": [{"id": c.pk, "emri": c.emri, "nxenesit": grouped.get(c.pk, [])} for c in classes],
            "njoftimet": [njoftim_data(n) for n in teacher.njoftimet_e_derguara.all()[:150]],
        })

    serializer = NjoftimSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"gabim": "Kontrollo klasën, titullin dhe përmbajtjen.", "gabimet": serializer.errors}, status=400)
    data = serializer.validated_data
    with transaction.atomic():
        klasa = classes.filter(pk=data["klasa"]).first()
        if not klasa:
            return Response({"gabim": "Nuk ke qasje në këtë klasë."}, status=403)
        recipients = Nxenesi.objects.filter(
            klasa=klasa, perdorues__is_active=True, perdorues__roli="nxenes"
        ).select_related("perdorues")
        student_id = data.get("nxenesi")
        if student_id is not None:
            recipients = recipients.filter(pk=student_id)
        recipients = list(recipients)
        if not recipients:
            return Response({"gabim": "Nuk u gjet asnjë nxënës i vlefshëm në këtë klasë."}, status=400)
        target = f"{emri(recipients[0].perdorues)} (NX-{recipients[0].pk:04d})" if student_id is not None else f"{klasa.emri} – të gjithë nxënësit"
        notice = NjoftimMesimdhenesi.objects.create(
            mesimdhenesi=teacher, klasa=klasa, titulli=data["titulli"],
            permbajtja=data["permbajtja"], derguesi=emri(request.user), marresi=target,
        )
        notice.nxenesit.set(recipients)
    return Response(njoftim_data(notice), status=201)
