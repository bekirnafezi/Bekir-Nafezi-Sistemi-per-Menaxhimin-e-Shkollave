from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Lenda, Mesimdhenesi, Perdorues
from .teacher_portal_api import approved_teacher, validate_image


def profile_data(teacher):
    user = teacher.perdorues
    subject = teacher.lenda_preferuar
    return {
        "emri": user.first_name,
        "mbiemri": user.last_name,
        "email": user.email,
        "telefoni": teacher.telefoni,
        "identifikuesi": teacher.identifikuesi or "",
        "lenda_preferuar": subject.pk if subject else None,
        "lenda": subject.emri if subject else "",
        "ka_foto": bool(teacher.foto),
    }


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def teacher_profile_api(request):
    teacher = approved_teacher(request.user)
    if teacher is None:
        return Response({"gabim": "Vetem mesimdhenesi i miratuar ka qasje."}, status=403)

    if request.method == "GET":
        return Response(profile_data(teacher))

    user = teacher.perdorues
    first_name = str(request.data.get("emri", user.first_name)).strip()
    last_name = str(request.data.get("mbiemri", user.last_name)).strip()
    email = str(request.data.get("email", user.email)).strip().lower()
    phone = str(request.data.get("telefoni", teacher.telefoni)).strip()

    if not first_name or not last_name or not email:
        return Response({"gabim": "Emri, mbiemri dhe emaili jane te detyrueshem."}, status=400)
    if len(first_name) > 150 or len(last_name) > 150 or len(phone) > 30 or len(email) > 254:
        return Response({"gabim": "Kontrollo gjatesine e te dhenave."}, status=400)
    try:
        validate_email(email)
    except ValidationError:
        return Response({"gabim": "Shkruaj nje email te vlefshem."}, status=400)

    if Perdorues.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return Response({"gabim": "Ky email perdoret nga nje llogari tjeter."}, status=400)
    if email != user.email.lower():
        current_password = str(request.data.get("fjalekalimi_aktual", ""))
        if not current_password or not user.check_password(current_password):
            return Response({"gabim": "Per te ndryshuar emailin, shkruaj fjalekalimin aktual."}, status=400)

    new_subject = teacher.lenda_preferuar
    if "lenda_preferuar" in request.data:
        subject_id = str(request.data.get("lenda_preferuar", "")).strip()
        if subject_id:
            if not subject_id.isdecimal():
                return Response({"gabim": "Zgjidh nje lende te vlefshme."}, status=400)
            new_subject = Lenda.objects.filter(pk=int(subject_id)).first()
            if new_subject is None:
                return Response({"gabim": "Lenda e zgjedhur nuk ekziston."}, status=400)
        else:
            new_subject = None

    new_photo = request.FILES.get("foto")
    remove_photo = str(request.data.get("hiq_foton", "")).lower() in ("true", "1", "po")
    if new_photo and remove_photo:
        return Response({"gabim": "Zgjidh nje fotografi te re ose hiqe ate ekzistuese."}, status=400)
    photo_error = validate_image(new_photo)
    if photo_error:
        return Response({"gabim": photo_error}, status=400)

    previous_photo = teacher.foto.name if teacher.foto else None
    photo_storage = teacher._meta.get_field("foto").storage

    try:
        with transaction.atomic():
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.save(update_fields=["first_name", "last_name", "email"])

            teacher.telefoni = phone
            teacher.lenda_preferuar = new_subject
            update_fields = ["telefoni", "lenda_preferuar"]
            if new_photo:
                teacher.foto = new_photo
                update_fields.append("foto")
            elif remove_photo:
                teacher.foto = None
                update_fields.append("foto")
            teacher.save(update_fields=update_fields)

            if previous_photo and (new_photo or remove_photo):
                transaction.on_commit(
                    lambda photo=previous_photo: photo_storage.delete(photo)
                )
    except (IntegrityError, ValidationError):
        return Response({"gabim": "Ndryshimet nuk u ruajten. Kontrollo te dhenat."}, status=400)

    teacher.refresh_from_db()
    return Response({"mesazhi": "Profili u perditesua me sukses.", "profili": profile_data(teacher)})
