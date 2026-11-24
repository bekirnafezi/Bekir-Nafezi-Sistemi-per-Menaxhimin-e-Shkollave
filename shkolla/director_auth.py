import hmac
import os

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.shortcuts import render
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import Perdorues


class DirectorRegistrationThrottle(AnonRateThrottle):
    rate = "10/hour"


def director_register_page(request):
    return render(request, "shkolla/director_register.html")


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([DirectorRegistrationThrottle])
def director_register_api(request):
    data = request.data
    keys = ("emri", "mbiemri", "email", "kodi", "fjalekalimi", "perserit_fjalekalimin")
    if any(not isinstance(data.get(key), str) or not data.get(key).strip() for key in keys):
        return Response({"gabim": "Plotëso të gjitha fushat."}, status=400)

    code = os.environ.get("SCHOOL_DIRECTOR_SIGNUP_CODE", "")
    if len(code) < 20 or not hmac.compare_digest(data["kodi"], code):
        return Response({"gabim": "Kodi i regjistrimit nuk është i saktë."}, status=403)

    first_name = data["emri"].strip()
    last_name = data["mbiemri"].strip()
    email = data["email"].strip().lower()
    password = data["fjalekalimi"]

    if len(first_name) > 150 or len(last_name) > 150 or len(email) > 254:
        return Response({"gabim": "Kontrollo gjatësinë e fushave."}, status=400)
    if password != data["perserit_fjalekalimin"]:
        return Response({"gabim": "Fjalëkalimet nuk përputhen."}, status=400)

    try:
        validate_email(email)
    except ValidationError:
        return Response({"gabim": "Emaili nuk është i vlefshëm."}, status=400)

    if Perdorues.objects.filter(email__iexact=email).exists():
        return Response({"gabim": "Ky email është i regjistruar."}, status=400)

    candidate = Perdorues(email=email, first_name=first_name, last_name=last_name, roli="drejtor")
    try:
        validate_password(password, user=candidate)
        with transaction.atomic():
            user = Perdorues.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                roli="drejtor",
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )
            token, _ = Token.objects.get_or_create(user=user)
    except ValidationError as error:
        return Response({"gabim": " ".join(error.messages)}, status=400)
    except IntegrityError:
        return Response({"gabim": "Ky email është i regjistruar."}, status=400)

    return Response({
        "mesazhi": "Llogaria e Drejtorit u krijua pa miratim.",
        "token": token.key,
        "perdoruesi": {"id": user.pk, "email": user.email, "roli": user.roli},
    }, status=201)
