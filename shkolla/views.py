from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from shkolla.permissions import EshteDrejtor
from shkolla.models import Klasa, Nxenesi, Mesimdhenesi, Nota, Mungesa


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):

    email = request.data.get('email')
    password = request.data.get('password')

    # Kontrollojme fushat e detyrueshme
    if not isinstance(email, str) or not email.strip() or not isinstance(password, str) or not password:
        return Response(
            {'gabim': 'Emaili dhe fjalekalimi jane te detyrueshem.'},
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
            {'gabim': 'Emaili ose fjalekalimi eshte i pasakte.'},
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profili_api(request):

    perdorues = request.user

    return Response({
        'id': perdorues.id,
        'email': perdorues.email,
        'emri': perdorues.first_name,
        'mbiemri': perdorues.last_name,
        'roli': perdorues.roli
    })

@api_view(['GET'])
@permission_classes([EshteDrejtor])
def statistikat_api(request):

    return Response({
        'shkolla': 'Samidin Emini',
        'numri_klasave': Klasa.objects.count(),
        'numri_nxenesve': Nxenesi.objects.count(),
        'numri_mesimdhenesve': Mesimdhenesi.objects.count(),
        'numri_notave': Nota.objects.count(),
        'numri_mungesave': Mungesa.objects.count()
    })