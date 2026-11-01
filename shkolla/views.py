from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models.deletion import ProtectedError
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from shkolla.permissions import EshteDrejtor
from shkolla.models import Klasa, Nxenesi, Mesimdhenesi, Nota, Mungesa, Lenda,  Angazhimi
from shkolla.serializers import (
    KlasaSerializer,
    NxenesiSerializer,
    MesimdhenesiSerializer,
    LendaSerializer,
    AngazhimiSerializer,
    NotaSerializer,
    MungesaSerializer,
)


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
# ==========================================
# API 7 - Detajet dhe menaxhimi i nxenesit
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def nxenesi_detaje_api(request, nxenesi_id):

    nxenesi = get_object_or_404(
        Nxenesi,
        id=nxenesi_id
    )

    # GET - Shfaqja e nje nxenesi
    if request.method == 'GET':

        serializer = NxenesiSerializer(nxenesi)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i klases se nxenesit
    if request.method == 'PATCH':

        serializer = NxenesiSerializer(
            nxenesi,
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

    # DELETE - Fshirja e nxenesit
    if request.method == 'DELETE':

        try:
            nxenesi.delete()

        except ProtectedError:

            return Response(
                {
                    'gabim': 'Nxenesi nuk mund te fshihet sepse ka nota ose mungesa te lidhura.'
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ==========================================
# API 8 - Lista dhe regjistrimi i mesimdhenesve
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def mesimdhenesit_api(request):

    # GET - Shfaqja e mesimdhenesve
    if request.method == 'GET':

        mesimdhenesit = Mesimdhenesi.objects.select_related(
            'perdorues'
        ).order_by('id')

        serializer = MesimdhenesiSerializer(
            mesimdhenesit,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # POST - Regjistrimi i profilit te mesimdhenesit
    if request.method == 'POST':

        serializer = MesimdhenesiSerializer(
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
# API 9 - Detajet dhe menaxhimi i mesimdhenesit
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def mesimdhenesi_detaje_api(request, mesimdhenesi_id):

    mesimdhenesi = get_object_or_404(
        Mesimdhenesi,
        id=mesimdhenesi_id
    )

    # GET - Shfaqja e nje mesimdhenesi
    if request.method == 'GET':

        serializer = MesimdhenesiSerializer(mesimdhenesi)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i profilit te mesimdhenesit
    if request.method == 'PATCH':

        serializer = MesimdhenesiSerializer(
            mesimdhenesi,
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

    # DELETE - Fshirja e profilit te mesimdhenesit
    if request.method == 'DELETE':

        try:
            mesimdhenesi.delete()

        except ProtectedError:

            return Response(
                {
                    'gabim': 'Mesimdhenesi nuk mund te fshihet sepse ka angazhime te lidhura.'
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ==========================================
# API 10 - Lista dhe regjistrimi i lendeve
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def lendet_api(request):

    # GET - Shfaqja e te gjitha lendeve
    if request.method == 'GET':

        lendet = Lenda.objects.all().order_by('id')

        serializer = LendaSerializer(
            lendet,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # POST - Regjistrimi i nje lende te re
    if request.method == 'POST':

        serializer = LendaSerializer(
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
# API 11 - Detajet dhe menaxhimi i lendeve
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def lenda_detaje_api(request, lenda_id):

    lenda = get_object_or_404(
        Lenda,
        id=lenda_id
    )

    # GET - Shfaqja e nje lende
    if request.method == 'GET':

        serializer = LendaSerializer(lenda)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i emrit te lendes
    if request.method == 'PATCH':

        serializer = LendaSerializer(
            lenda,
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

    # DELETE - Fshirja e lendes
    if request.method == 'DELETE':

        try:
            lenda.delete()

        except ProtectedError:

            return Response(
                {
                    'gabim': 'Lenda nuk mund te fshihet sepse ka angazhime te lidhura.'
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ==========================================
# API 12 - Lista dhe regjistrimi i angazhimeve
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def angazhimet_api(request):

    # GET - Shfaqja e te gjitha angazhimeve
    if request.method == 'GET':

        angazhimet = Angazhimi.objects.all().order_by('id')

        serializer = AngazhimiSerializer(
            angazhimet,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # POST - Regjistrimi i nje angazhimi te ri
    if request.method == 'POST':

        serializer = AngazhimiSerializer(
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
# API 13 - Detajet dhe menaxhimi i angazhimeve
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def angazhimi_detaje_api(request, angazhimi_id):

    angazhimi = get_object_or_404(
        Angazhimi,
        id=angazhimi_id
    )

    # GET - Shfaqja e nje angazhimi
    if request.method == 'GET':

        serializer = AngazhimiSerializer(angazhimi)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i nje angazhimi
    if request.method == 'PATCH':

        serializer = AngazhimiSerializer(
            angazhimi,
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

    # DELETE - Fshirja e nje angazhimi
    if request.method == 'DELETE':

        try:
            angazhimi.delete()

        except ProtectedError:

            return Response(
                {
                    'gabim': 'Angazhimi nuk mund te fshihet sepse ka nota ose mungesa te lidhura.'
                },
                status=status.HTTP_409_CONFLICT
            )

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

   # ==========================================
# API 14 - Lista dhe regjistrimi i notave
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def notat_api(request):

        # GET - Shfaqja dhe filtrimi i notave
    if request.method == 'GET':

        notat = Nota.objects.all().order_by('id')

        # Marrim ID-ne e nxenesit nga URL-ja
        nxenesi_id = request.query_params.get('nxenesi')

        # Filtrojme notat nese eshte dhene nxenesi
        if nxenesi_id is not None:

            if not nxenesi_id.isdigit():
                return Response(
                    {'gabim': 'ID e nxenesit duhet te jete numer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            notat = notat.filter(nxenesi_id=int(nxenesi_id))

        serializer = NotaSerializer(
            notat,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
    

    # POST - Regjistrimi i nje note te re
    if request.method == 'POST':

        serializer = NotaSerializer(
            data=request.data
        )

        if serializer.is_valid():

            # Ruajme noten me daten aktuale
            serializer.save(data=timezone.now())

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # ==========================================
# API 15 - Detajet dhe menaxhimi i notave
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def nota_detaje_api(request, nota_id):

    nota = get_object_or_404(
        Nota,
        id=nota_id
    )

    # GET - Shfaqja e nje note
    if request.method == 'GET':

        serializer = NotaSerializer(nota)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i nje note
    if request.method == 'PATCH':

        serializer = NotaSerializer(
            nota,
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

    # DELETE - Fshirja e nje note
    if request.method == 'DELETE':

        nota.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    # ==========================================
# API - Lista dhe regjistrimi i mungesave
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def mungesat_api(request):

       # GET - Shfaqja dhe filtrimi i mungesave
    if request.method == 'GET':

        mungesat = Mungesa.objects.all().order_by('id')

        # Marrim ID-ne e nxenesit nga URL-ja
        nxenesi_id = request.query_params.get('nxenesi')

        # Filtrojme mungesat sipas nxenesit
        if nxenesi_id is not None:

            if not nxenesi_id.isdigit():
                return Response(
                    {'gabim': 'ID e nxenesit duhet te jete numer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            mungesat = mungesat.filter(
                nxenesi_id=int(nxenesi_id)
            )

        serializer = MungesaSerializer(
            mungesat,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # POST - Regjistrimi i nje mungese
    if request.method == 'POST':

        serializer = MungesaSerializer(
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
# API - Detajet, ndryshimi dhe fshirja e mungeses
# ==========================================

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([EshteDrejtor])
def mungesa_detaje_api(request, mungesa_id):

    # Gjejme mungesen sipas ID-se
    mungesa = get_object_or_404(
        Mungesa,
        id=mungesa_id
    )

    # GET - Shfaqja e nje mungese
    if request.method == 'GET':

        serializer = MungesaSerializer(mungesa)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # PATCH - Ndryshimi i mungeses
    if request.method == 'PATCH':

        serializer = MungesaSerializer(
            mungesa,
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

    # DELETE - Fshirja e mungeses
    if request.method == 'DELETE':

        mungesa.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )