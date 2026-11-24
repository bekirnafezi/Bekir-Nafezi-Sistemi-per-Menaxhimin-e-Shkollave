from django.db import IntegrityError, transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Angazhimi, Klasa, Lenda, Mesimdhenesi
from .permissions import EshteDrejtor


def emri_i_mesimdhenesit(m):
    return m.perdorues.get_full_name().strip() or m.perdorues.email


def id_e_sakte(value):
    if isinstance(value, bool):
        return None
    text = str(value or '').strip()
    return int(text) if text.isdecimal() and int(text) > 0 else None


@api_view(['GET', 'POST'])
@permission_classes([EshteDrejtor])
def lendet_ligjeruesit_api(request):
    if request.method == 'GET':
        mesimdhenesit = list(
            Mesimdhenesi.objects.filter(
                miratuar=True,
                perdorues__is_active=True,
                perdorues__roli='mesimdhenes'
            ).select_related('perdorues', 'lenda_preferuar').order_by('perdorues__first_name', 'id')
        )
        klasat = list(Klasa.objects.order_by('emri'))
        lendet = list(Lenda.objects.order_by('emri'))
        angazhimet = list(
            Angazhimi.objects.select_related(
                'mesimdhenesi__perdorues', 'klasa', 'lenda'
            ).order_by('lenda__emri', 'klasa__emri')
        )
        return Response({
            'mesimdhenesit': [
                {
                    'id': m.pk,
                    'emri': emri_i_mesimdhenesit(m),
                    'lenda_preferuar_id': m.lenda_preferuar_id,
                    'lenda_preferuar': m.lenda_preferuar.emri if m.lenda_preferuar else None
                } for m in mesimdhenesit
            ],
            'klasat': [{'id': k.pk, 'emri': k.emri} for k in klasat],
            'lendet': [{'id': l.pk, 'emri': l.emri} for l in lendet],
            'angazhimet': [
                {
                    'id': a.pk,
                    'lenda_id': a.lenda_id,
                    'mesimdhenesi_id': a.mesimdhenesi_id,
                    'mesimdhenesi': emri_i_mesimdhenesit(a.mesimdhenesi),
                    'klasa_id': a.klasa_id,
                    'klasa': a.klasa.emri
                } for a in angazhimet
            ]
        })

    action = str(request.data.get('veprimi', '')).strip()
    if action not in ('krijo_lende', 'cakto_ligjerues'):
        return Response({'gabim': 'Veprimi nuk eshte i vlefshem.'}, status=400)

    teacher_raw = request.data.get('mesimdhenesi')
    class_raw = request.data.get('klasa')
    teacher_id = id_e_sakte(teacher_raw)
    class_id = id_e_sakte(class_raw)

    if action == 'krijo_lende' and not teacher_raw and not class_raw:
        mesimdhenesi = None
        klasa = None
    else:
        if not teacher_id or not class_id:
            return Response({'gabim': 'Zgjidh mesimdhenesin dhe klasen se bashku.'}, status=400)
        mesimdhenesi = Mesimdhenesi.objects.select_related('perdorues').filter(
            pk=teacher_id, miratuar=True, perdorues__is_active=True,
            perdorues__roli='mesimdhenes'
        ).first()
        klasa = Klasa.objects.filter(pk=class_id).first()
        if mesimdhenesi is None or klasa is None:
            return Response({'gabim': 'Mesimdhenesi i miratuar ose klasa nuk u gjet.'}, status=400)

    if action == 'krijo_lende':
        name = str(request.data.get('emri') or '').strip()
        if not name or len(name) > 100:
            return Response({'gabim': 'Shkruaj emrin e lendes (maksimum 100 karaktere).'}, status=400)
        if Lenda.objects.filter(emri__iexact=name).exists():
            return Response({'gabim': 'Lenda ekziston. Perdore Cakto ligjerues per lende ekzistuese.'}, status=400)
        try:
            with transaction.atomic():
                lenda = Lenda.objects.create(emri=name)
                if mesimdhenesi:
                    Angazhimi.objects.create(
                        mesimdhenesi=mesimdhenesi, klasa=klasa, lenda=lenda
                    )
        except IntegrityError:
            return Response({'gabim': 'Kjo lende ose ky angazhim ekziston tashme.'}, status=400)
        return Response({
            'mesazhi': 'Lenda u krijua dhe u lidh me klasen.' if mesimdhenesi else 'Lenda u krijua me sukses.',
            'lenda_id': lenda.pk
        }, status=201)

    lenda_id = id_e_sakte(request.data.get('lenda'))
    lenda = Lenda.objects.filter(pk=lenda_id).first() if lenda_id else None
    if lenda is None:
        return Response({'gabim': 'Zgjidh lenden ekzistuese.'}, status=400)
    if Angazhimi.objects.filter(lenda=lenda, mesimdhenesi=mesimdhenesi, klasa=klasa).exists():
        return Response({'gabim': 'Ky mesimdhenes eshte caktuar tashme ne kete klase dhe lende.'}, status=400)
    try:
        with transaction.atomic():
            angazhimi = Angazhimi.objects.create(
                lenda=lenda, mesimdhenesi=mesimdhenesi, klasa=klasa
            )
    except IntegrityError:
        return Response({'gabim': 'Ky angazhim ekziston tashme.'}, status=400)
    return Response({'mesazhi': 'Ligjeruesi u caktua me sukses.', 'angazhimi_id': angazhimi.pk}, status=201)
