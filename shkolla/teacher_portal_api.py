from datetime import date
from pathlib import Path

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Angazhimi, KerkeseMesimdhenesi, Klasa, Lenda, Mesimdhenesi, Mungesa, Nota, Nxenesi, Perdorues, Vendim


def problem(message, code=400):
    return Response({"gabim": message}, status=code)


def is_director(user):
    return user.is_authenticated and user.roli == "drejtor"


def approved_teacher(user):
    if not user.is_authenticated or user.roli != "mesimdhenes":
        return None
    return Mesimdhenesi.objects.filter(perdorues=user, miratuar=True).select_related("lenda_preferuar", "perdorues").first()


def teacher_name(teacher):
    return teacher.perdorues.get_full_name().strip() or teacher.perdorues.email


def validate_image(upload):
    if not upload:
        return None
    if upload.size > 3 * 1024 * 1024:
        return "Fotografia duhet te jete nen 3 MB."
    ext = Path(upload.name).suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp"):
        return "Lejohen vetem JPG, PNG ose WebP."
    signature = upload.read(16)
    upload.seek(0)
    valid = (signature.startswith(b"\xff\xd8\xff") or signature.startswith(b"\x89PNG\r\n\x1a\n") or (signature[:4] == b"RIFF" and signature[8:12] == b"WEBP"))
    if not valid:
        return "Fotografia nuk ka format te vlefshem."
    return None


@api_view(["POST"])
@permission_classes([AllowAny])
def secure_login_api(request):
    email, password = request.data.get("email"), request.data.get("password")
    role = request.data.get("role")
    if not isinstance(email, str) or not isinstance(password, str) or not email.strip() or not password:
        return problem("Shkruaj emailin dhe fjalekalimin.")
    user = authenticate(request, email=email.strip(), password=password)
    if user is None:
        return problem("Emaili ose fjalekalimi nuk eshte i sakte.", 401)
    if role and user.roli != role:
        return problem("Kjo llogari nuk i perket rolit te zgjedhur.", 403)
    if user.roli == "mesimdhenes" and approved_teacher(user) is None:
        return problem("Llogaria po pret miratimin e Drejtorit.", 403)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "perdoruesi": {"id": user.pk, "email": user.email, "roli": user.roli}})


@api_view(["GET"])
@permission_classes([AllowAny])
def teacher_public_subjects(request):
    return Response(list(Lenda.objects.order_by("emri").values("id", "emri")))


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([AllowAny])
def teacher_signup_api(request):
    data = request.data
    required = ("emri", "mbiemri", "identifikuesi", "telefoni", "email", "fjalekalimi", "lenda")
    if any(not isinstance(data.get(k), str) or not data.get(k).strip() for k in required):
        return problem("Ploteso te gjitha fushat e detyrueshme.")
    if str(data.get("fjalekalimi")) != str(data.get("perserit_fjalekalimin", "")):
        return problem("Fjalekalimet nuk perputhen.")
    email = data["email"].strip().lower()
    identifikuesi = data["identifikuesi"].strip()
    telefoni = data["telefoni"].strip()
    emri, mbiemri = data["emri"].strip(), data["mbiemri"].strip()
    if len(emri) > 150 or len(mbiemri) > 150 or len(identifikuesi) > 35 or len(telefoni) > 30:
        return problem("Kontrollo gjatesine e te dhenave personale.")
    if not data["lenda"].isdigit():
        return problem("Zgjidh nje lende ekzistuese.")
    lenda = get_object_or_404(Lenda, pk=int(data["lenda"]))
    if Perdorues.objects.filter(email__iexact=email).exists() or Mesimdhenesi.objects.filter(identifikuesi=identifikuesi).exists():
        return problem("Emaili ose ID shkollore eshte e regjistruar.")
    photo = request.FILES.get("foto")
    err = validate_image(photo)
    if err:
        return problem(err)
    trial = Perdorues(email=email, first_name=emri, last_name=mbiemri, roli="mesimdhenes")
    try:
        trial.full_clean(exclude=["password"])
        validate_password(data["fjalekalimi"], user=trial)
    except ValidationError as exc:
        return problem(" ".join(exc.messages))
    try:
        with transaction.atomic():
            user = Perdorues.objects.create_user(email=email, password=data["fjalekalimi"], first_name=emri, last_name=mbiemri, roli="mesimdhenes")
            Mesimdhenesi.objects.create(perdorues=user, identifikuesi=identifikuesi, telefoni=telefoni, lenda_preferuar=lenda, foto=photo, miratuar=False)
    except (ValidationError, IntegrityError):
        return problem("Regjistrimi nuk u realizua. Kontrollo ID-ne dhe emailin.")
    return Response({"mesazhi": "Regjistrimi u dergua. Prit miratimin e Drejtorit."}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def teacher_photo_api(request):
    teacher = approved_teacher(request.user)
    if not teacher:
        return problem("Nuk ke qasje.", 403)
    if not teacher.foto:
        return problem("Nuk ka fotografi.", 404)
    return FileResponse(teacher.foto.open("rb"), content_type={".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}.get(Path(teacher.foto.name).suffix.lower(), "application/octet-stream"))


def avg(values):
    return round(sum(values) / len(values), 2) if values else None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def teacher_dashboard_api(request):
    t = approved_teacher(request.user)
    if t is None:
        return problem("Vetem mesimdhenesi i miratuar mund te hyje.", 403)
    assignments = list(Angazhimi.objects.filter(mesimdhenesi=t).select_related("klasa", "lenda").order_by("klasa__emri", "lenda__emri"))
    tutor_classes = list(Klasa.objects.filter(kujdestari=t).order_by("emri"))
    class_ids = set(a.klasa_id for a in assignments) | set(c.id for c in tutor_classes)
    classes = list(Klasa.objects.filter(id__in=class_ids).order_by("emri"))
    chosen = request.query_params.get("klasa")
    chosen_id = int(chosen) if chosen and chosen.isdigit() and int(chosen) in class_ids else (classes[0].id if classes else None)
    students = list(Nxenesi.objects.filter(klasa_id=chosen_id).select_related("perdorues").order_by("perdorues__first_name", "perdorues__last_name")) if chosen_id else []
    tutor = chosen_id and any(c.pk == chosen_id for c in tutor_classes)
    grades = Nota.objects.filter(nxenesi__klasa_id=chosen_id) if chosen_id else Nota.objects.none()
    absences = Mungesa.objects.filter(nxenesi__klasa_id=chosen_id) if chosen_id else Mungesa.objects.none()
    if not tutor:
        grades = grades.filter(angazhimi__mesimdhenesi=t)
        absences = absences.filter(angazhimi__mesimdhenesi=t)
    grouped_grades = {}
    for x in grades.values("nxenesi_id").annotate(average=Avg("vleresimi"), amount=Count("id")):
        grouped_grades[x["nxenesi_id"]] = x
    grouped_absences = {}
    for x in absences.values("nxenesi_id").annotate(amount=Count("id")):
        grouped_absences[x["nxenesi_id"]] = x["amount"]
    student_rows = []
    for s in students:
        stat = grouped_grades.get(s.pk, {})
        student_rows.append({"id": s.pk, "emri": s.perdorues.get_full_name().strip() or s.perdorues.email,
                             "mesatarja": round(stat["average"], 2) if stat.get("average") is not None else None,
                             "notat": stat.get("amount", 0), "mungesat": grouped_absences.get(s.pk, 0)})
    grades_list = list(grades.select_related("angazhimi__lenda", "nxenesi__perdorues").order_by("-data", "-id"))
    abs_list = list(absences.select_related("angazhimi__lenda", "nxenesi__perdorues").order_by("-data", "-id"))
    decisions = Vendim.objects.filter(Q(kategoria="shkolle") | Q(kategoria="mesimdhenes", mesimdhenesi=t)).order_by("-data_vendimit", "-id")[:15]
    class_avg = avg([float(s["mesatarja"]) for s in student_rows if s["mesatarja"] is not None])
    return Response({
        "profili": {"emri": teacher_name(t), "email": request.user.email, "telefoni": t.telefoni,
                   "identifikuesi": t.identifikuesi, "lenda": t.lenda_preferuar.emri if t.lenda_preferuar else "Lendet e caktuara", "ka_foto": bool(t.foto)},
        "klasat": [{"id": c.id, "emri": c.emri, "nxenes": Nxenesi.objects.filter(klasa=c).count(), "kujdestar": c.kujdestari_id == t.id} for c in classes],
        "angazhimet": [{"id": a.id, "klasa_id": a.klasa_id, "klasa": a.klasa.emri, "lenda": a.lenda.emri} for a in assignments],
        "klasa_e_zgjedhur": chosen_id, "eshte_kujdestar": bool(tutor), "nxenesit": student_rows,
        "mesatarja": class_avg,
        "mungesa_gjithsej": sum(s["mungesat"] for s in student_rows),
        "mungesat_e_arsyeshme": absences.filter(statusi="e_arsyeshme").count(),
        "mungesat_e_paarsyeshme": absences.filter(statusi="e_paarsyeshme").count(),
        "mungesat_ne_shqyrtim": absences.filter(statusi="ne_shqyrtim").count(),
        "notat": [{"id": n.pk, "nxenesi_id": n.nxenesi_id, "nxenesi": n.nxenesi.perdorues.get_full_name().strip(), "vleresimi": n.vleresimi,
                  "lenda": n.angazhimi.lenda.emri, "data": n.data.isoformat()} for n in grades_list],
        "mungesat": [{"id": m.pk, "nxenesi": m.nxenesi.perdorues.get_full_name().strip(), "nxenesi_id": m.nxenesi_id,
                     "ora_mesimore": m.ora_mesimore, "statusi": m.statusi, "arsyetimi": m.arsyetimi,
                     "lenda": m.angazhimi.lenda.emri, "data": m.data.isoformat()} for m in abs_list],
        "vendimet": [{"id": v.pk, "titulli": v.titulli, "permbajtja": v.permbajtja,
                     "data": v.data_vendimit.isoformat()} for v in decisions],
        "kerkesat": [{"id": k.pk, "titulli": k.titulli, "lloji": k.lloji, "statusi": k.statusi,
                     "pergjigja": k.pergjigja} for k in t.kerkesat.all()[:12]],
    })


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def teacher_requests_api(request):
    t = approved_teacher(request.user)
    if not t:
        return problem("Vetem mesimdhenesi i miratuar mund te paraqese kerkesa.", 403)
    if request.method == "GET":
        return Response(list(t.kerkesat.values("id", "lloji", "titulli", "pershkrimi", "statusi", "pergjigja", "krijuar_me")[:80]))
    lloji = request.data.get("lloji")
    titulli = str(request.data.get("titulli", "")).strip()
    pershkrimi = str(request.data.get("pershkrimi", "")).strip()
    if lloji not in dict(KerkeseMesimdhenesi.LLOJET) or len(titulli) < 5 or len(pershkrimi) < 12:
        return problem("Zgjidh llojin, titullin dhe shpjego kerkesen (minimum 12 karaktere).")
    d1 = parse_date(request.data.get("data_nga", "")) if request.data.get("data_nga") else None
    d2 = parse_date(request.data.get("data_deri", "")) if request.data.get("data_deri") else None
    if d1 and d2 and d2 < d1:
        return problem("Data e fundit nuk mund te jete para dates se pare.")
    student = None
    if lloji == "perjashtim":
        sid = str(request.data.get("nxenesi", ""))
        if not sid.isdecimal() or not d1 or not d2:
            return problem("Per propozim mase disiplinore duhen nxenesi dhe periudha.")
        student = Nxenesi.objects.filter(pk=int(sid)).first()
        if not student or not (Angazhimi.objects.filter(mesimdhenesi=t, klasa_id=student.klasa_id).exists() or Klasa.objects.filter(pk=student.klasa_id, kujdestari=t).exists()):
            return problem("Nxenesi nuk i perket klasave te tua.", 403)
    obj = KerkeseMesimdhenesi.objects.create(mesimdhenesi=t, lloji=lloji, titulli=titulli,
                                               pershkrimi=pershkrimi, nxenesi=student,
                                               data_nga=d1, data_deri=d2)
    return Response({"mesazhi": "Kerkesa iu dergua Drejtorit per shqyrtim.", "id": obj.pk}, status=201)


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def director_teacher_requests_api(request):
    if not is_director(request.user):
        return problem("Vetem Drejtori ka qasje.", 403)
    if request.method == "GET":
        pending = Mesimdhenesi.objects.filter(miratuar=False).select_related("perdorues", "lenda_preferuar").order_by("pk")
        requests = KerkeseMesimdhenesi.objects.select_related("mesimdhenesi__perdorues", "nxenesi__perdorues").order_by("-krijuar_me")[:200]
        return Response({
            "ne_pritje": [{"id": t.pk, "emri": teacher_name(t), "email": t.perdorues.email, "identifikuesi": t.identifikuesi,
                           "telefoni": t.telefoni, "lenda": t.lenda_preferuar.emri if t.lenda_preferuar else "—"} for t in pending],
            "kerkesat": [{"id": k.pk, "mesimdhenesi": teacher_name(k.mesimdhenesi), "lloji": k.lloji, "titulli": k.titulli,
                          "pershkrimi": k.pershkrimi, "statusi": k.statusi, "pergjigja": k.pergjigja,
                          "nxenesi": k.nxenesi.perdorues.get_full_name() if k.nxenesi else "",
                          "data_nga": k.data_nga.isoformat() if k.data_nga else None,
                          "data_deri": k.data_deri.isoformat() if k.data_deri else None,
                          "data": timezone.localtime(k.krijuar_me).strftime("%d.%m.%Y %H:%M")} for k in requests]
        })
    ident = request.data.get("id")
    st = request.data.get("statusi")
    msg = str(request.data.get("pergjigja", "")).strip()
    if st not in ("miratuar", "refuzuar") or len(msg) < 5:
        return problem("Zgjidh mirato/refuzo dhe shkruaj pergjigjen e Drejtorit.")
    k = get_object_or_404(KerkeseMesimdhenesi, pk=ident)
    if k.statusi != "ne_shqyrtim":
        return problem("Kerkesa eshte shqyrtuar tashme.")
    k.statusi = st
    k.pergjigja = msg
    k.vendosur_nga = request.user
    k.vendosur_me = timezone.now()
    k.save(update_fields=["statusi", "pergjigja", "vendosur_nga", "vendosur_me"])
    return Response({"mesazhi": "Vendimi u regjistrua."})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def director_teacher_approval_api(request, pk):
    if not is_director(request.user):
        return problem("Vetem Drejtori mund te miratoje llogari.", 403)
    t = get_object_or_404(Mesimdhenesi, pk=pk)
    if t.miratuar:
        return problem("Mesimdhenesi eshte miratuar tashme.")
    t.miratuar = True
    t.save(update_fields=["miratuar"])
    return Response({"mesazhi": "Llogaria u miratua. Mesimdhenesi mund te kyçet."})
