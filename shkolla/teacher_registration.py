from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import Mesimdhenesi, Perdorues
from .permissions import EshteDrejtor
from .serializers import MesimdhenesiSerializer


@api_view(["POST"])
@permission_classes([EshteDrejtor])
def regjistro_mesimdhenesin_api(request):

    emri = request.data.get("emri", "")
    mbiemri = request.data.get("mbiemri", "")
    email = request.data.get("email", "")
    fjalekalimi = request.data.get("fjalekalimi", "")

    if not all(
        isinstance(value, str)
        for value in [emri, mbiemri, email, fjalekalimi]
    ):
        return Response(
            {
                "gabim": "Te dhenat e mesimdhenesit nuk jane te vlefshme."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    emri = emri.strip()
    mbiemri = mbiemri.strip()
    email = email.strip().lower()

    if not emri or not mbiemri or not email or not fjalekalimi:
        return Response(
            {
                "gabim": "Plotesoni te gjitha fushat."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(emri) > 150 or len(mbiemri) > 150:
        return Response(
            {
                "gabim": "Emri ose mbiemri eshte shume i gjate."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if Perdorues.objects.filter(email__iexact=email).exists():
        return Response(
            {
                "gabim": "Ky email eshte i regjistruar ne sistem."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    perdorues_prove = Perdorues(
        email=email,
        first_name=emri,
        last_name=mbiemri,
        roli="mesimdhenes"
    )

    try:
        perdorues_prove.full_clean(exclude=["password"])

        validate_password(
            fjalekalimi,
            user=perdorues_prove
        )

    except ValidationError as error:
        return Response(
            {
                "gabim": " ".join(error.messages)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():

            perdorues = Perdorues.objects.create_user(
                email=email,
                password=fjalekalimi,
                first_name=emri,
                last_name=mbiemri,
                roli="mesimdhenes"
            )

            mesimdhenesi = Mesimdhenesi.objects.create(
                perdorues=perdorues
            )

    except IntegrityError:
        return Response(
            {
                "gabim": "Regjistrimi nuk u realizua. Kontrolloni te dhenat."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = MesimdhenesiSerializer(mesimdhenesi)

    return Response(
        {
            "mesazhi": "Mesimdhenesi u regjistrua me sukses.",
            "mesimdhenesi": serializer.data
        },
        status=status.HTTP_201_CREATED
    )