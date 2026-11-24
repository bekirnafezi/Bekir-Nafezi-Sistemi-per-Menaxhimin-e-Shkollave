from django.shortcuts import render
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Nxenesi

from .student_request_model import KerkesaNxenesit


def inbox_page(request):
    return render(request, 'shkolla/student_requests_inbox.html')


def recipients(student):
    from django.contrib.auth import get_user_model
    guardian = student.klasa.kujdestari
    return get_user_model().objects.filter(
        pk=guardian.perdorues_id if guardian else None,
        roli='mesimdhenes',
        is_active=True,
    )


def name(user):
    return user.get_full_name() or user.email


def row(r):
    return dict(id=r.pk, nxenesi=name(r.nxenesi.perdorues), klasa=r.nxenesi.klasa.emri, marresi=name(r.marresi), lloji=r.lloji, titulli=r.titulli, pershkrimi=r.pershkrimi, statusi=r.statusi, pergjigjja=r.pergjigjja, data=r.data.strftime('%d.%m.%Y'))


@api_view(['GET','POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def requests_api(request):
    u=request.user
    if not u.is_active:
        return Response(status=403)
    if u.roli == 'nxenes':
        s=Nxenesi.objects.filter(perdorues=u, klasa__isnull=False).first()
        if not s:
            return Response(status=403)
        allowed=recipients(s)
        if request.method=='POST':
            d=request.data
            title=str(d.get('titulli','')).strip(); body=str(d.get('pershkrimi','')).strip(); kind=d.get('lloji')
            target=allowed.first()
            if not target:
                return Response({'gabim':'Klasa nuk ka kujdestar aktiv. Kontakto shkollën.'},status=400)
            if 'marresi' in d and str(d.get('marresi')) != str(target.pk):
                return Response({'gabim':'Kërkesat mund t’i dërgohen vetëm kujdestarit të klasës.'},status=403)
            if kind not in ('ankese','leje') or not title or len(title)>150 or not body or len(body)>3000:
                return Response({'gabim':'Plotëso të gjitha fushat me të dhëna të vlefshme.'},status=400)
            r=KerkesaNxenesit.objects.create(nxenesi=s,marresi=target,lloji=kind,titulli=title,pershkrimi=body)
            return Response(row(r),status=201)
        return Response({'marresit':[dict(id=x.pk,emri=name(x),roli=x.roli) for x in allowed], 'kerkesat':[row(r) for r in KerkesaNxenesit.objects.filter(nxenesi=s).order_by('-pk')]})
    if u.roli != 'mesimdhenes':
        return Response({'gabim':'Vetëm mësimdhënësit kanë qasje në kërkesat e nxënësve.'},status=403)
    qs=KerkesaNxenesit.objects.filter(marresi=u)
    if request.method=='POST':
        d=request.data; status=d.get('statusi'); answer=str(d.get('pergjigjja','')).strip()
        if status not in ('miratuar','refuzuar') or not answer or len(answer)>3000:
            return Response({'gabim':'Shkruaj përgjigjen dhe zgjidh statusin.'},status=400)
        try:
            changed=qs.filter(pk=int(d.get('id')),statusi='ne_shqyrtim').update(statusi=status,pergjigjja=answer)
        except (ValueError,TypeError,OverflowError):
            changed=0
        if not changed:
            return Response({'gabim':'Kërkesa nuk është e disponueshme.'},status=404)
    return Response({'kerkesat':[row(r) for r in qs.order_by('-pk')]})
