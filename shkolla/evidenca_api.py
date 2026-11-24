
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Nota, Mungesa, NdryshimEvidence
from .serializers import NotaSerializer, MungesaSerializer
from .evidenca_permissions import (
    eshte_drejtor,
    eshte_mesimdhenes,
    notat_e_dukshme,
    mungesat_e_dukshme,
    mund_te_regjistroje_note,
    mund_te_regjistroje_mungese,
    eshte_kujdestar_i_klases
)


class NotaEvidencaSerializer(NotaSerializer):
    class Meta(NotaSerializer.Meta):
        fields = [
            "id",
            "nxenesi",
            "angazhimi",
            "vleresimi",
            "data",
            "regjistruar_nga"
        ]
        read_only_fields = ["id", "regjistruar_nga"]
        extra_kwargs = {
            "data": {"required": False}
        }


class MungesaEvidencaSerializer(MungesaSerializer):
    class Meta(MungesaSerializer.Meta):
        fields = [
            "id",
            "nxenesi",
            "angazhimi",
            "data",
            "ora_mesimore",
            "statusi",
            "arsyetimi",
            "regjistruar_nga",
            "arsyetuar_nga",
            "data_arsyetimit"
        ]
        read_only_fields = [
            "id",
            "regjistruar_nga",
            "arsyetuar_nga",
            "data_arsyetimit"
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        ora = attrs.get(
            "ora_mesimore",
            getattr(self.instance, "ora_mesimore", None)
        )

        if (ora is None and (self.instance is None or "ora_mesimore" in attrs)) or (ora is not None and not 1 <= ora <= 10):
            raise serializers.ValidationError({
                "ora_mesimore": "Zgjidh oren mesimore nga 1 deri ne 10."
            })

        statusi = attrs.get(
            "statusi",
            getattr(self.instance, "statusi", "ne_shqyrtim")
        )

        arsyetimi = attrs.get(
            "arsyetimi",
            getattr(self.instance, "arsyetimi", "")
        )

        if statusi == "e_arsyeshme" and not arsyetimi.strip():
            raise serializers.ValidationError({
                "arsyetimi": "Mungesa e arsyeshme kerkon arsyetim."
            })

        return attrs


from rest_framework import serializers


def gabim(mesazhi, kodi=status.HTTP_400_BAD_REQUEST):
    return Response({"gabim": mesazhi}, status=kodi)


def arsyeja_e_drejtorit(request):
    arsyeja = request.data.get("arsye_nderhyrjeje", "")

    if not isinstance(arsyeja, str):
        return ""

    return arsyeja.strip()


def ndryshoi(te_dhenat, fusha, vlera_aktuale):
    if fusha not in te_dhenat:
        return False

    e_re = te_dhenat[fusha]

    if e_re is None and vlera_aktuale is None:
        return False

    return str(e_re) != str(vlera_aktuale)


def regjistro_historikun(
    lloji,
    objekti_id,
    veprimi,
    perdoruesi,
    para=None,
    pas=None,
    arsyeja=""
):
    NdryshimEvidence.objects.create(
        lloji=lloji,
        rekordi_id=objekti_id,
        veprimi=veprimi,
        perdoruesi=perdoruesi,
        arsyeja=arsyeja,
        para=dict(para or {}),
        pas=dict(pas or {})
    )


def filtro_sipas_id(qs, request, fushat):
    for parametri, fusha_db in fushat.items():
        vlera = request.query_params.get(parametri)

        if vlera is None:
            continue

        if not vlera.isascii() or not vlera.isdigit():
            return None, gabim(
                f"Parametri {parametri} duhet te jete ID numerike."
            )

        qs = qs.filter(**{fusha_db: int(vlera)})

    return qs, None


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def notat_api(request):
    if request.method == "GET":
        notat = notat_e_dukshme(request.user).order_by("id")

        notat, error = filtro_sipas_id(
            notat,
            request,
            {
                "nxenesi": "nxenesi_id",
                "klasa": "nxenesi__klasa_id",
                "angazhimi": "angazhimi_id"
            }
        )

        if error is not None:
            return error

        serializer = NotaEvidencaSerializer(notat, many=True)
        return Response(serializer.data)

    if not eshte_mesimdhenes(request.user):
        return gabim(
            "Vetem mesimdhenesi i angazhuar regjistron nota.",
            status.HTTP_403_FORBIDDEN
        )

    serializer = NotaEvidencaSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    angazhimi = serializer.validated_data["angazhimi"]

    if not mund_te_regjistroje_note(request.user, angazhimi):
        return gabim(
            "Nuk je i autorizuar per kete angazhim.",
            status.HTTP_403_FORBIDDEN
        )

    with transaction.atomic():
        nota = serializer.save(
            data=timezone.localdate(),
            regjistruar_nga=request.user
        )

        regjistro_historikun(
            "nota",
            nota.pk,
            "krijim",
            request.user,
            pas=NotaEvidencaSerializer(nota).data
        )

    return Response(
        NotaEvidencaSerializer(nota).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def nota_detaje_api(request, nota_id):
    if getattr(request.user, "roli", None) == "drejtor" and request.method != "GET":
        return Response({"gabim": "Drejtori mund vetem t'i shikoje notat."}, status=403)

    nota = get_object_or_404(
        notat_e_dukshme(request.user),
        pk=nota_id
    )

    if request.method == "GET":
        return Response(NotaEvidencaSerializer(nota).data)

    drejtor = eshte_drejtor(request.user)

    mesimdhenes = (
        eshte_mesimdhenes(request.user)
        and mund_te_regjistroje_note(
            request.user,
            nota.angazhimi
        )
    )

    if request.method == "DELETE":
        if not drejtor:
            return gabim(
                "Fshirja kerkon autorizimin e drejtorit.",
                status.HTTP_403_FORBIDDEN
            )

        arsyeja = arsyeja_e_drejtorit(request)

        if len(arsyeja) < 8:
            return gabim(
                "Shkruaj arsyen e fshirjes, te pakten 8 karaktere."
            )

        para = NotaEvidencaSerializer(nota).data

        with transaction.atomic():
            regjistro_historikun(
                "nota",
                nota.pk,
                "fshirje",
                request.user,
                para=para,
                arsyeja=arsyeja
            )
            nota.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    if not drejtor and not mesimdhenes:
        return gabim(
            "Nuk ke leje te ndryshosh kete note.",
            status.HTTP_403_FORBIDDEN
        )

    arsyeja = ""

    if drejtor:
        arsyeja = arsyeja_e_drejtorit(request)

        if len(arsyeja) < 8:
            return gabim(
                "Drejtori duhet te shkruaje arsyen e korrigjimit."
            )
    else:
        for fusha, vlera in {
            "nxenesi": nota.nxenesi_id,
            "angazhimi": nota.angazhimi_id,
            "data": nota.data
        }.items():
            if ndryshoi(request.data, fusha, vlera):
                return gabim(
                    "Mesimdhenesi mund te korrigjoje vetem vleresimin.",
                    status.HTTP_403_FORBIDDEN
                )

    serializer = NotaEvidencaSerializer(
        nota,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    angazhimi_i_ri = serializer.validated_data.get(
        "angazhimi",
        nota.angazhimi
    )

    if mesimdhenes and not drejtor:
        if not mund_te_regjistroje_note(
            request.user,
            angazhimi_i_ri
        ):
            return gabim(
                "Angazhimi nuk eshte i autorizuar.",
                status.HTTP_403_FORBIDDEN
            )

    para = NotaEvidencaSerializer(nota).data

    with transaction.atomic():
        nota = serializer.save()

        regjistro_historikun(
            "nota",
            nota.pk,
            "ndryshim",
            request.user,
            para=para,
            pas=NotaEvidencaSerializer(nota).data,
            arsyeja=arsyeja
        )

    return Response(NotaEvidencaSerializer(nota).data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def mungesat_api(request):
    if getattr(request.user, 'roli', None) == 'drejtor' and request.method != 'GET':
        return Response({'gabim': "Drejtori mund vetem t'i shikoje mungesat. mungesat_api"}, status=403)

    if request.method == "GET":
        mungesat = mungesat_e_dukshme(
            request.user
        ).order_by("id")

        mungesat, error = filtro_sipas_id(
            mungesat,
            request,
            {
                "nxenesi": "nxenesi_id",
                "klasa": "nxenesi__klasa_id",
                "angazhimi": "angazhimi_id"
            }
        )

        if error is not None:
            return error

        statusi_kerkuar = request.query_params.get("statusi")

        if statusi_kerkuar:
            statuset = {
                "ne_shqyrtim",
                "e_arsyeshme",
                "e_paarsyeshme"
            }

            if statusi_kerkuar not in statuset:
                return gabim("Statusi i mungeses nuk eshte i sakte.")

            mungesat = mungesat.filter(statusi=statusi_kerkuar)

        serializer = MungesaEvidencaSerializer(
            mungesat,
            many=True
        )
        return Response(serializer.data)

    if not eshte_mesimdhenes(request.user):
        return gabim(
            "Vetem mesimdhenesi i angazhuar regjistron mungesa.",
            status.HTTP_403_FORBIDDEN
        )

    if request.data.get("statusi", "ne_shqyrtim") != "ne_shqyrtim":
        return gabim(
            "Mungesa e re regjistrohet fillimisht ne shqyrtim."
        )

    if str(request.data.get("arsyetimi", "")).strip():
        return gabim(
            "Arsyetimi behet nga kujdestari pas regjistrimit."
        )

    serializer = MungesaEvidencaSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    angazhimi = serializer.validated_data["angazhimi"]

    if not mund_te_regjistroje_mungese(
        request.user,
        angazhimi
    ):
        return gabim(
            "Nuk je i autorizuar per kete angazhim.",
            status.HTTP_403_FORBIDDEN
        )

    try:
        with transaction.atomic():
            mungesa = serializer.save(
                statusi="ne_shqyrtim",
                arsyetimi="",
                regjistruar_nga=request.user
            )

            regjistro_historikun(
                "mungesa",
                mungesa.pk,
                "krijim",
                request.user,
                pas=MungesaEvidencaSerializer(mungesa).data
            )
    except IntegrityError:
        return gabim(
            "Ky nxenes ka mungese per kete date dhe ore mesimore."
        )

    return Response(
        MungesaEvidencaSerializer(mungesa).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def mungesa_detaje_api(request, mungesa_id):
    if getattr(request.user, 'roli', None) == 'drejtor' and request.method != 'GET':
        return Response({'gabim': "Drejtori mund vetem t'i shikoje mungesat. mungesa_detaje_api"}, status=403)

    mungesa = get_object_or_404(
        mungesat_e_dukshme(request.user),
        pk=mungesa_id
    )

    if request.method == "GET":
        return Response(MungesaEvidencaSerializer(mungesa).data)

    drejtor = eshte_drejtor(request.user)

    mesimdhenes = (
        eshte_mesimdhenes(request.user)
        and mund_te_regjistroje_mungese(
            request.user,
            mungesa.angazhimi
        )
    )

    kujdestar = (
        eshte_mesimdhenes(request.user)
        and eshte_kujdestar_i_klases(
            request.user,
            mungesa.nxenesi.klasa
        )
    )

    if request.method == "DELETE":
        if not drejtor:
            return gabim(
                "Fshirja kerkon autorizimin e drejtorit.",
                status.HTTP_403_FORBIDDEN
            )

        arsyeja = arsyeja_e_drejtorit(request)

        if len(arsyeja) < 8:
            return gabim(
                "Shkruaj arsyen e fshirjes, te pakten 8 karaktere."
            )

        para = MungesaEvidencaSerializer(mungesa).data

        with transaction.atomic():
            regjistro_historikun(
                "mungesa",
                mungesa.pk,
                "fshirje",
                request.user,
                para=para,
                arsyeja=arsyeja
            )
            mungesa.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    if not drejtor and not mesimdhenes and not kujdestar:
        return gabim(
            "Nuk ke leje te ndryshosh kete mungese.",
            status.HTTP_403_FORBIDDEN
        )

    arsyeja = ""

    if drejtor:
        arsyeja = arsyeja_e_drejtorit(request)

        if len(arsyeja) < 8:
            return gabim(
                "Drejtori duhet te shkruaje arsyen e korrigjimit."
            )
    else:
        identiteti = {
            "nxenesi": mungesa.nxenesi_id,
            "angazhimi": mungesa.angazhimi_id
        }

        for fusha, vlera in identiteti.items():
            if ndryshoi(request.data, fusha, vlera):
                return gabim(
                    "Nxenesi dhe angazhimi nuk mund te nderrohen.",
                    status.HTTP_403_FORBIDDEN
                )

        if not mesimdhenes:
            for fusha, vlera in {
                "data": mungesa.data,
                "ora_mesimore": mungesa.ora_mesimore
            }.items():
                if ndryshoi(request.data, fusha, vlera):
                    return gabim(
                        "Vetem mesimdhenesi perkates ndryshon oren dhe daten.",
                        status.HTTP_403_FORBIDDEN
                    )

        if not kujdestar:
            for fusha, vlera in {
                "statusi": mungesa.statusi,
                "arsyetimi": mungesa.arsyetimi
            }.items():
                if ndryshoi(request.data, fusha, vlera):
                    return gabim(
                        "Vetem kujdestari i klases mund te arsyetoje mungesen.",
                        status.HTTP_403_FORBIDDEN
                    )

    serializer = MungesaEvidencaSerializer(
        mungesa,
        data=request.data,
        partial=True
    )

    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    para = MungesaEvidencaSerializer(mungesa).data

    ndryshim_arsyetimi = (
        ndryshoi(request.data, "statusi", mungesa.statusi)
        or ndryshoi(request.data, "arsyetimi", mungesa.arsyetimi)
    )

    try:
        with transaction.atomic():
            mungesa = serializer.save()

            if ndryshim_arsyetimi:
                if mungesa.statusi == "ne_shqyrtim":
                    mungesa.arsyetuar_nga = None
                    mungesa.data_arsyetimit = None
                else:
                    mungesa.arsyetuar_nga = request.user
                    mungesa.data_arsyetimit = timezone.now()

                mungesa.save(
                    update_fields=[
                        "arsyetuar_nga",
                        "data_arsyetimit"
                    ]
                )

            regjistro_historikun(
                "mungesa",
                mungesa.pk,
                "ndryshim",
                request.user,
                para=para,
                pas=MungesaEvidencaSerializer(mungesa).data,
                arsyeja=arsyeja
            )
    except IntegrityError:
        return gabim(
            "Ekziston tashme nje mungese per kete nxenes, date dhe ore."
        )

    return Response(MungesaEvidencaSerializer(mungesa).data)
