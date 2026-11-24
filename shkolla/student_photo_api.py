from io import BytesIO
from pathlib import Path
from tempfile import NamedTemporaryFile

from django.conf import settings
from django.http import FileResponse
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .student_portal import _nxenesi


def photo_path(student):
    return Path(settings.BASE_DIR) / 'private_student_photos' / f'nxenesi_{student.pk}.jpg'


def prepare_photo(upload):
    from PIL import Image, ImageOps, UnidentifiedImageError

    if upload.size > 3 * 1024 * 1024:
        raise ValueError('Fotografia duhet të jetë maksimumi 3 MB.')
    try:
        with Image.open(upload) as img:
            if img.format not in ('JPEG', 'PNG', 'WEBP') or min(img.size) < 16 or max(img.size) > 6000 or img.width * img.height > 20_000_000:
                raise ValueError('Zgjidh një fotografi të vlefshme JPG, PNG ose WebP.')
            img = ImageOps.exif_transpose(img)
            img.thumbnail((800, 800))
            img = img.convert('RGB')
            result = BytesIO()
            img.save(result, format='JPEG', quality=88)
            return result.getvalue()
    except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as exc:
        raise ValueError('Fotografia nuk është e vlefshme.') from exc


@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def student_photo_api(request):
    student = _nxenesi(request)
    if student is None:
        return Response({'gabim': 'Qasje e ndaluar.'}, status=403)
    path = photo_path(student)
    if request.method == 'GET':
        try:
            response = FileResponse(path.open('rb'), content_type='image/jpeg')
        except FileNotFoundError:
            return Response({'gabim': 'Nuk ka fotografi.'}, status=404)
        response['Cache-Control'] = 'private, no-store'
        response['X-Content-Type-Options'] = 'nosniff'
        return response
    upload = request.FILES.get('foto')
    if upload is None:
        return Response({'gabim': 'Zgjidh një fotografi.'}, status=400)
    try:
        content = prepare_photo(upload)
    except ImportError:
        return Response({'gabim': 'Instalo Pillow për të ruajtur fotografinë.'}, status=503)
    except ValueError as exc:
        return Response({'gabim': str(exc)}, status=400)
    tmp = None
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(dir=path.parent, delete=False) as file:
            tmp = Path(file.name)
            file.write(content)
        tmp.replace(path)
    except OSError:
        return Response({'gabim': 'Fotografia nuk u ruajt. Provo përsëri.'}, status=500)
    finally:
        if tmp is not None:
            tmp.unlink(missing_ok=True)
    return Response({'mesazhi': 'Fotografia u ruajt me sukses.'})
