from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models.deletion import ProtectedError

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from shkolla.permissions import EshteDrejtor
from shkolla.models import Klasa, Nxenesi, Mesimdhenesi, Nota, Mungesa
from shkolla.serializers import KlasaSerializer, NxenesiSerializer


# ==========================================
# API 1 - Hyrja ne sistem
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):

    email = request.data.get('email')
    password = request.data.get('password')

    # Kontrollojme fushat e detyrueshme
    if (
        not isinstance(email, str)
        or not email.strip()
        or not isinstance(password, str)
        or not password
    ):
        return Response(
            {
                'gabim': 'Emaili dhe fjalekalimi jane te detyrueshem.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Kontrollojme emailin dhe fjalekalimin
    perdorues = authenticate(
        request,
        email=email.strip(),
        password=password
    )

    if perdorues is None:
        return Response(
            {
                'gabim': 'Emaili ose fjalekalimi eshte i pasakte.'
            },
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Krijojme ose marrim tokenin e perdoruesit
    token, created = Token.objects.get_or_create(user=perdorues)

    return Response(
        {
            'mesazhi': 'Hyrja u realizua me sukses.',
            'token': token.key,
            'perdoruesi': {
                'id': perdorues.id,
                'email': perdorues.email,
                'roli': perdorues.roli
            }
        },
        status=status.HTTP_200_OK
    )


# ==========================================
# API 2 - Profili i perdoruesit
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profili_api(request):

    perdorues = request.user

    return Response(
        {
            'id': perdorues.id,
            'email': perdorues.email,
            'emri': perdorues.first_name,
            'mbiemri': perdorues.last_name,
            'roli': perdorues.roli
        }
    )


# ==========================================
# API 3 - Statistikat e shkolles
# ==========================================

@api_view(['GET'])
@permission_classes([EshteDrejtor])
def statistikat_api(request):

    return Response(
        {
            'shkolla': 'Samidin Emini',
            'numri_klasave': Klasa.objects.count(),
            'numri_nxenesve': Nxenesi.objects.count(),
            'numri_mesimdhenesve': Mesimdhenesi.objects.count(),
            'numri_notave': Nota.objects.count(),
            'numri_mungesave': Mungesa.objects.count()
        }
    )


# ==========================================
# API 4 - Lista dhe regjistrimi i klasave
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def klasat_api(request):

    # Shfaqja e te gjitha klasave
    if request.method == 'GET':

        klasat = Klasa.objects.all().order_by('id')

        serializer = KlasaSerializer(
            klasat,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # Regjistrimi i nje klase te re
    if request.method == 'POST':

        serializer = KlasaSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# ==========================================
# API 5 - Detajet, ndryshimi dhe fshirja
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def klasa_detaje_api(request, klasa_id):

    # Kerkojme klasen sipas ID-se
    klasa = get_object_or_404(
        Klasa,
        id=klasa_id
    )

    # Shfaqja e nje klase
    if request.method == 'GET':

        serializer = KlasaSerializer(klasa)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # Ndryshimi i te dhenave te klases
    if request.method == 'PATCH':

        serializer = KlasaSerializer(
            klasa,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # Fshirja e klases
    if request.method == 'DELETE':

        try:
            klasa.delete()

        except ProtectedError:

            return Response(
                {
                    'gabim': (
                        'Klasa nuk mund te fshihet sepse ka '
                        'nxenes ose angazhime te lidhura.'
                    )
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ==========================================
# API 6 - Lista dhe regjistrimi i nxenesve
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def nxenesit_api(request):

    # Shfaqja e te gjithe nxenesve
    if request.method == 'GET':

        nxenesit = Nxenesi.objects.select_related(
            'perdorues', 'klasa'
        ).order_by('id')

        serializer = NxenesiSerializer(
            nxenesit,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # Regjistrimi i profilit te nje nxenesi
    if request.method == 'POST':

        serializer = NxenesiSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )