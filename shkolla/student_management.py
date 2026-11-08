from django.db import transaction
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import Nxenesi
from .permissions import EshteDrejtor
from .serializers import NxenesiSerializer


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([EshteDrejtor])
def menaxho_nxenesin_api(request, nxenesi_id):

    nxenesi = get_object_or_404(
        Nxenesi.objects.select_related("perdorues", "klasa"),
        id=nxenesi_id
    )

    if request.method == "GET":

        serializer = NxenesiSerializer(nxenesi)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    if request.method == "PATCH":

        if "klasa" not in request.data:
            return Response(
                {
                    "gabim": "Zgjidhni klasen e nxenesit."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if any(
            fusha != "klasa"
            for fusha in request.data.keys()
        ):
            return Response(
                {
                    "gabim": "Lejohet vetem ndryshimi i klases."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = NxenesiSerializer(
            nxenesi,
            data={
                "klasa": request.data["klasa"]
            },
            partial=True
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        klasa_e_re = serializer.validated_data["klasa"]

        if klasa_e_re.id != nxenesi.klasa_id:

            if (
                nxenesi.notat.exists()
                or nxenesi.mungesat.exists()
            ):
                return Response(
                    {
                        "gabim": (
                            "Klasa nuk mund te ndryshohet "
                            "sepse nxenesi ka nota ose "
                            "mungesa te regjistruara."
                        )
                    },
                    status=status.HTTP_409_CONFLICT
                )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    if request.method == "DELETE":

        if (
            nxenesi.notat.exists()
            or nxenesi.mungesat.exists()
        ):
            return Response(
                {
                    "gabim": (
                        "Nxenesi nuk mund te fshihet "
                        "sepse ka nota ose mungesa "
                        "te regjistruara."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        perdoruesi = nxenesi.perdorues

        if perdoruesi.roli != "nxenes":
            return Response(
                {
                    "gabim": (
                        "Llogaria nuk ka rolin nxenes."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        try:
            with transaction.atomic():
                perdoruesi.delete()

        except ProtectedError:
            return Response(
                {
                    "gabim": (
                        "Nxenesi ka te dhena te lidhura "
                        "dhe nuk mund te fshihet."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )