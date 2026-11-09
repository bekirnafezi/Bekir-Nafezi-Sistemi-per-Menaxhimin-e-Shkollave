from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Perdorues,
    Mesimdhenesi,
    Klasa,
    Angazhimi,
)

from .permissions import EshteDrejtor
from .serializers import MesimdhenesiSerializer


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([EshteDrejtor])
def menaxho_mesimdhenesin_api(request, mesimdhenesi_id):

    mesimdhenesi = get_object_or_404(
        Mesimdhenesi.objects.select_related("perdorues"),
        id=mesimdhenesi_id
    )

    if request.method == "GET":

        serializer = MesimdhenesiSerializer(mesimdhenesi)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    if request.method == "PATCH":

        fushat_lejuara = {
            "emri",
            "mbiemri",
            "email"
        }

        if (
            not isinstance(request.data, dict)
            or not request.data
            or any(
                fusha not in fushat_lejuara
                for fusha in request.data.keys()
            )
        ):
            return Response(
                {
                    "gabim": "Te dhenat per ndryshim nuk jane te vlefshme."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        ndryshimet = {}

        for fusha in fushat_lejuara:

            if fusha in request.data:

                vlera = request.data[fusha]

                if not isinstance(vlera, str) or not vlera.strip():

                    return Response(
                        {
                            "gabim": "Fushat nuk mund te jene bosh."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                ndryshimet[fusha] = vlera.strip()

        if (
            len(ndryshimet.get("emri", "")) > 150
            or len(ndryshimet.get("mbiemri", "")) > 150
        ):
            return Response(
                {
                    "gabim": "Emri ose mbiemri eshte shume i gjate."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            with transaction.atomic():

                perdoruesi = Perdorues.objects.select_for_update().get(
                    id=mesimdhenesi.perdorues_id
                )

                if "email" in ndryshimet:

                    emaili = ndryshimet["email"].lower()

                    ekziston = Perdorues.objects.filter(
                        email__iexact=emaili
                    ).exclude(
                        id=perdoruesi.id
                    ).exists()

                    if ekziston:

                        return Response(
                            {
                                "gabim": "Ky email perdoret nga nje perdorues tjeter."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    perdoruesi.email = emaili

                if "emri" in ndryshimet:

                    perdoruesi.first_name = ndryshimet["emri"]

                if "mbiemri" in ndryshimet:

                    perdoruesi.last_name = ndryshimet["mbiemri"]

                perdoruesi.full_clean(
                    exclude=["password"]
                )

                perdoruesi.save()

        except ValidationError as error:

            return Response(
                {
                    "gabim": " ".join(error.messages)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except IntegrityError:

            return Response(
                {
                    "gabim": "Ndryshimi nuk u realizua. Kontrolloni te dhenat."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        mesimdhenesi.refresh_from_db()

        serializer = MesimdhenesiSerializer(mesimdhenesi)

        return Response(
            {
                "mesazhi": "Te dhenat u ndryshuan me sukses.",
                "mesimdhenesi": serializer.data
            },
            status=status.HTTP_200_OK
        )

    if request.method == "DELETE":

        try:

            with transaction.atomic():

                ka_klasa = Klasa.objects.filter(
                    kujdestari=mesimdhenesi
                ).exists()

                ka_angazhime = Angazhimi.objects.filter(
                    mesimdhenesi=mesimdhenesi
                ).exists()

                if ka_klasa or ka_angazhime:

                    return Response(
                        {
                            "gabim": (
                                "Mesimdhenesi nuk mund te fshihet "
                                "sepse eshte kujdestar i nje klase "
                                "ose ka angazhime te regjistruara."
                            )
                        },
                        status=status.HTTP_409_CONFLICT
                    )

                perdoruesi = mesimdhenesi.perdorues

                if (
                    perdoruesi.roli != "mesimdhenes"
                    or perdoruesi.is_superuser
                ):

                    return Response(
                        {
                            "gabim": "Llogaria nuk mund te fshihet."
                        },
                        status=status.HTTP_409_CONFLICT
                    )

                mesimdhenesi.delete()

                perdoruesi.delete()

        except (ProtectedError, IntegrityError):

            return Response(
                {
                    "gabim": (
                        "Mesimdhenesi ka te dhena te tjera "
                        "te lidhura dhe nuk mund te fshihet."
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )