from pathlib import Path

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import FileResponse
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Perdorues


FORMATS = {"JPEG": ("jpg", "image/jpeg"), "PNG": ("png", "image/png"), "WEBP": ("webp", "image/webp")}


def storage_dir():
    base = getattr(settings, "MEDIA_ROOT", None)
    if not base:
        base = Path(settings.BASE_DIR) / "media"
    return Path(base) / "director_profiles"


def photo_paths(user_id):
    folder = storage_dir()
    return [folder / f"drejtori_{int(user_id)}.{ext}" for ext in ("jpg", "png", "webp")]


def current_photo(user_id):
    return next((p for p in photo_paths(user_id) if p.is_file()), None)


def require_director(request):
    return request.user.is_authenticated and request.user.is_active and getattr(request.user, "roli", None) == "drejtor"


def profile_payload(user):
    return {
        "emri": user.first_name or "",
        "mbiemri": user.last_name or "",
        "emri_i_plote": (f"{user.first_name or ''} {user.last_name or ''}").strip() or "Drejtori",
        "email": user.email,
        "ka_foto": current_photo(user.pk) is not None,
    }


def validate_photo(upload):
    if upload is None:
        return None, None
    if upload.size > 3 * 1024 * 1024:
        return None, "Fotografia duhet te jete me e vogel se 3 MB."
    try:
        from PIL import Image, UnidentifiedImageError
    except ImportError:
        return None, "Per fotografite instalo Pillow (python -m pip install Pillow)."
    try:
        with Image.open(upload) as img:
            image_format = img.format
            width, height = img.size
            if image_format not in FORMATS or width < 16 or height < 16 or width > 8000 or height > 8000:
                return None, "Lejohen fotografi JPG, PNG ose WebP me madhesi te vlefshme."
            img.verify()
        upload.seek(0)
    except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError):
        return None, "Fotografia nuk eshte skedar imazhi i vlefshem."
    return FORMATS[image_format][0], None


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def director_profile_api(request):
    if not require_director(request):
        return Response({"gabim": "Vetem Drejtori mund ta perditesoje profilin e vet."}, status=403)

    user = request.user
    if request.method == "GET":
        return Response(profile_payload(user))

    first_name = str(request.data.get("emri", user.first_name or "")).strip()
    last_name = str(request.data.get("mbiemri", user.last_name or "")).strip()
    email = str(request.data.get("email", user.email)).strip().lower()
    if not email or len(email) > 254 or len(first_name) > 150 or len(last_name) > 150:
        return Response({"gabim": "Kontrollo gjatesine dhe plotesimin e fushave."}, status=400)
    try:
        validate_email(email)
    except ValidationError:
        return Response({"gabim": "Shkruaj nje email te vlefshem."}, status=400)
    if Perdorues.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
        return Response({"gabim": "Ky email perdoret nga nje llogari tjeter."}, status=400)
    if email != (user.email or "").lower():
        password = str(request.data.get("fjalekalimi_aktual", ""))
        if not password or not user.check_password(password):
            return Response({"gabim": "Per ndryshimin e emailit duhet fjalekalimi aktual."}, status=400)

    upload = request.FILES.get("foto")
    remove_photo = str(request.data.get("hiq_foton", "")).lower() in ("1", "true", "po")
    if upload and remove_photo:
        return Response({"gabim": "Zgjidh fotografi te re ose hiqe te vjetren."}, status=400)
    extension, image_error = validate_photo(upload)
    if image_error:
        return Response({"gabim": image_error}, status=400)

    try:
        with transaction.atomic():
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            user.save(update_fields=["first_name", "last_name", "email"])
    except (IntegrityError, ValidationError):
        return Response({"gabim": "Nuk u ruajten ndryshimet e profilit."}, status=400)

    if upload or remove_photo:
        folder = storage_dir()
        folder.mkdir(parents=True, exist_ok=True)
        if upload:
            path = folder / f"drejtori_{user.pk}.{extension}"
            tmp = folder / f"drejtori_{user.pk}.{extension}.tmp"
            try:
                with tmp.open("wb") as output:
                    for chunk in upload.chunks():
                        output.write(chunk)
                tmp.replace(path)
            except OSError:
                tmp.unlink(missing_ok=True)
                return Response({"gabim": "Fotografia nuk u ruajt. Provo perseri."}, status=500)
            for old in photo_paths(user.pk):
                if old != path:
                    old.unlink(missing_ok=True)
        else:
            for old in photo_paths(user.pk):
                old.unlink(missing_ok=True)

    return Response({"mesazhi": "Profili u perditesua me sukses.", "profili": profile_payload(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def director_photo_api(request):
    if not require_director(request):
        return Response({"gabim": "Qasje e ndaluar."}, status=403)
    path = current_photo(request.user.pk)
    if not path:
        return Response({"gabim": "Nuk ka fotografi."}, status=404)
    kind = {".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}.get(path.suffix)
    response = FileResponse(path.open("rb"), content_type=kind)
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    return response
