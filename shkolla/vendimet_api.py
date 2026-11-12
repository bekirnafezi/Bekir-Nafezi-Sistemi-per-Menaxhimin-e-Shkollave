from rest_framework import serializers, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Vendim, Mesimdhenesi, Nxenesi


class VendimSerializer(serializers.ModelSerializer):

    mesimdhenesi_etiketa = serializers.SerializerMethodField()
    nxenesi_etiketa = serializers.SerializerMethodField()

    class Meta:
        model = Vendim

        fields = [
            "id",
            "titulli",
            "permbajtja",
            "kategoria",
            "mesimdhenesi",
            "nxenesi",
            "mesimdhenesi_etiketa",
            "nxenesi_etiketa",
            "data_vendimit",
            "krijuar_me",
        ]

        read_only_fields = [
            "id",
            "mesimdhenesi_etiketa",
            "nxenesi_etiketa",
            "krijuar_me",
        ]

    def get_mesimdhenesi_etiketa(self, obj):
        if obj.mesimdhenesi:
            return emri_personit(obj.mesimdhenesi)

        return None

    def get_nxenesi_etiketa(self, obj):
        if obj.nxenesi:
            return emri_personit(obj.nxenesi)

        return None

    def validate_titulli(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Titulli duhet t\u00eb ket\u00eb t\u00eb pakt\u00ebn 3 karaktere."
            )

        return value

    def validate_permbajtja(self, value):
        value = value.strip()

        if len(value) < 5:
            raise serializers.ValidationError(
                "P\u00ebrmbajtja duhet t\u00eb ket\u00eb t\u00eb pakt\u00ebn 5 karaktere."
            )

        return value

    def validate(self, attrs):
        kategoria = attrs.get("kategoria")
        mesimdhenesi = attrs.get("mesimdhenesi")
        nxenesi = attrs.get("nxenesi")

        if kategoria == "shkolle":
            if mesimdhenesi or nxenesi:
                raise serializers.ValidationError(
                    "Vendimi p\u00ebr shkoll\u00ebn nuk duhet "
                    "t\u00eb lidhet me nj\u00eb person."
                )

        elif kategoria == "mesimdhenes":
            if not mesimdhenesi or nxenesi:
                raise serializers.ValidationError(
                    "Zgjidhni vet\u00ebm m\u00ebsimdh\u00ebn\u00ebsin p\u00ebrkat\u00ebs."
                )

        elif kategoria == "nxenes":
            if not nxenesi or mesimdhenesi:
                raise serializers.ValidationError(
                    "Zgjidhni vet\u00ebm nx\u00ebn\u00ebsin p\u00ebrkat\u00ebs."
                )

        return attrs


def emri_personit(obj):
    personi = obj

    for fusha in ("perdorues", "user"):
        try:
            kandidati = getattr(obj, fusha, None)
        except Exception:
            kandidati = None

        if kandidati is not None:
            personi = kandidati
            break

    emri = str(getattr(personi, "emri", "") or "").strip()
    mbiemri = str(getattr(personi, "mbiemri", "") or "").strip()

    emri_plote = (emri + " " + mbiemri).strip()

    return emri_plote or str(personi)


def eshte_drejtor(request):
    return getattr(request.user, "roli", None) == "drejtor"


@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def vendimet_api(request):

    if not eshte_drejtor(request):
        return Response(
            {"gabim": "Vet\u00ebm drejtori mund t\u00eb menaxhoj\u00eb vendimet."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if request.method == "GET":

        kategoria = request.query_params.get(
            "kategoria",
            "shkolle"
        )

        if kategoria not in [
            "shkolle",
            "mesimdhenes",
            "nxenes",
            "te_gjitha",
        ]:
            return Response(
                {"gabim": "Kategoria nuk \u00ebsht\u00eb e vlefshme."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vendimet = Vendim.objects.all()

        if kategoria != "te_gjitha":
            vendimet = vendimet.filter(
                kategoria=kategoria
            )

        if kategoria == "mesimdhenes":
            person_id = request.query_params.get("mesimdhenesi")

            if not person_id or not person_id.isdecimal():
                return Response(
                    {"gabim": "Zgjidhni m\u00ebsimdh\u00ebn\u00ebsin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            vendimet = vendimet.filter(
                mesimdhenesi_id=int(person_id)
            )

        if kategoria == "nxenes":
            person_id = request.query_params.get("nxenesi")

            if not person_id or not person_id.isdecimal():
                return Response(
                    {"gabim": "Zgjidhni nx\u00ebn\u00ebsin."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            vendimet = vendimet.filter(
                nxenesi_id=int(person_id)
            )

        serializer = VendimSerializer(
            vendimet.order_by("-data_vendimit", "-id"),
            many=True,
        )

        return Response(serializer.data)

    serializer = VendimSerializer(data=request.data)

    serializer.is_valid(raise_exception=True)

    serializer.save()

    return Response(
        serializer.data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def vendimet_personat_api(request):

    if not eshte_drejtor(request):
        return Response(
            {"gabim": "Nuk keni leje p\u00ebr k\u00ebt\u00eb veprim."},
            status=status.HTTP_403_FORBIDDEN,
        )

    kategoria = request.query_params.get("kategoria")

    if kategoria == "mesimdhenes":
        personat = Mesimdhenesi.objects.all().order_by("pk")

    elif kategoria == "nxenes":
        personat = Nxenesi.objects.all().order_by("pk")

    else:
        return Response(
            {"gabim": "Zgjidhni m\u00ebsimdh\u00ebn\u00ebs ose nx\u00ebn\u00ebs."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    rezultati = [
        {
            "id": personi.pk,
            "emri": emri_personit(personi),
        }
        for personi in personat
    ]

    return Response(rezultati)


@api_view(["DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def vendim_detaje_api(request, vendim_id):

    if not eshte_drejtor(request):
        return Response(
            {"gabim": "Vet\u00ebm drejtori mund t\u00eb fshij\u00eb vendime."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        vendim = Vendim.objects.get(pk=vendim_id)

    except Vendim.DoesNotExist:
        return Response(
            {"gabim": "Vendimi nuk u gjet."},
            status=status.HTTP_404_NOT_FOUND,
        )

    vendim.delete()

    return Response(
        {"mesazh": "Vendimi u fshi me sukses."},
        status=status.HTTP_200_OK,
    )

