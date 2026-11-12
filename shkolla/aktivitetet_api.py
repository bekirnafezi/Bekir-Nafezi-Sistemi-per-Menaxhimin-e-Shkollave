from datetime import date

from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from .models import Aktivitet


class AktivitetSerializer(ModelSerializer):

    class Meta:
        model = Aktivitet
        fields = [
            "id",
            "emri",
            "data",
            "statusi",
            "arsye_anulimi",
        ]

        read_only_fields = [
            "id",
            "statusi",
            "arsye_anulimi",
        ]

    def validate_emri(self, value):
        value = value.strip()

        if len(value) < 3:
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                "Emri duhet të ketë të paktën 3 karaktere."
            )

        return value


def kontrollo_drejtorin(request):
    return getattr(request.user, "roli", None) == "drejtor"


def lexo_daten(request):
    data_kerkuar = request.query_params.get("data")

    if not data_kerkuar:
        return None

    try:
        if len(data_kerkuar) != 10:
            raise ValueError

        return date.fromisoformat(data_kerkuar)

    except (ValueError, TypeError):
        raise ValueError("Data nuk është e vlefshme.")


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def aktivitetet_api(request):

    if not kontrollo_drejtorin(request):
        return Response(
            {"gabim": "Vetëm drejtori mund të menaxhojë aktivitetet."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":

        try:
            data = lexo_daten(request)

        except ValueError as error:
            return Response(
                {"gabim": str(error)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if data is None:
            data = timezone.localdate()

        aktivitetet = Aktivitet.objects.filter(
            data=data,
            statusi="planifikuar",
        ).order_by("id")

        serializer = AktivitetSerializer(
            aktivitetet,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    serializer = AktivitetSerializer(
        data=request.data
    )

    if serializer.is_valid():
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST,
    )


@api_view(["PATCH"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def aktivitet_detaje_api(request, aktivitet_id):

    if not kontrollo_drejtorin(request):
        return Response(
            {"gabim": "Nuk keni leje për këtë veprim."},
            status=status.HTTP_403_FORBIDDEN,
        )

    aktivitet = get_object_or_404(
        Aktivitet,
        id=aktivitet_id,
    )

    if aktivitet.statusi != "planifikuar":
        return Response(
            {
                "gabim": (
                    "Ky aktivitet është përfunduar ose anuluar më parë."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    statusi_ri = request.data.get("statusi")

    if statusi_ri not in ["mbajtur", "anuluar"]:
        return Response(
            {
                "gabim": (
                    "Statusi duhet të jetë mbajtur ose anuluar."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if statusi_ri == "anuluar":

        arsye = request.data.get(
            "arsye_anulimi",
            ""
        )

        if not isinstance(arsye, str):
            return Response(
                {"gabim": "Arsyeja e anulimit nuk është e vlefshme."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        arsye = arsye.strip()

        if len(arsye) < 3:
            return Response(
                {
                    "gabim": (
                        "Shkruani arsyen e anulimit "
                        "me të paktën 3 karaktere."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(arsye) > 500:
            return Response(
                {
                    "gabim": (
                        "Arsyeja e anulimit nuk mund "
                        "të ketë më shumë se 500 karaktere."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        aktivitet.statusi = "anuluar"
        aktivitet.arsye_anulimi = arsye

    else:
        aktivitet.statusi = "mbajtur"
        aktivitet.arsye_anulimi = ""

    aktivitet.save(
        update_fields=[
            "statusi",
            "arsye_anulimi",
        ]
    )

    serializer = AktivitetSerializer(aktivitet)

    return Response(
        serializer.data,
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def aktivitetet_raportet_api(request):

    if not kontrollo_drejtorin(request):
        return Response(
            {"gabim": "Nuk keni leje për të parë raportet."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        data = lexo_daten(request)

    except ValueError as error:
        return Response(
            {"gabim": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )

    raportet = Aktivitet.objects.filter(
        statusi__in=[
            "mbajtur",
            "anuluar",
        ]
    )

    if data is not None:
        raportet = raportet.filter(data=data)

    raportet = raportet.order_by(
        "-data",
        "-id",
    )

    serializer = AktivitetSerializer(
        raportet,
        many=True,
    )

    return Response(
        serializer.data,
        status=status.HTTP_200_OK,
    )