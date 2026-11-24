from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import Angazhimi, Klasa, Lenda, Mesimdhenesi
from .permissions import EshteDrejtor


def _id_pozitiv(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value if value > 0 else None
    if isinstance(value, str) and value.isdecimal():
        number = int(value)
        return number if number > 0 else None
    return None


@api_view(["POST"])
@permission_classes([EshteDrejtor])
def angazhimet_bulk_api(request):
    mesimdhenesi_id = _id_pozitiv(request.data.get("mesimdhenesi"))
    lenda_id = _id_pozitiv(request.data.get("lenda"))
    klasat_raw = request.data.get("klasat")
    kujdestar_raw = request.data.get("kujdestar_klase")
    kujdestar_id = None if kujdestar_raw in (None, "") else _id_pozitiv(kujdestar_raw)

    if not mesimdhenesi_id or not lenda_id:
        return Response({"gabim": "Zgjidh mësimdhënësin dhe lëndën."}, status=400)
    if not isinstance(klasat_raw, list) or not (1 <= len(klasat_raw) <= 50):
        return Response({"gabim": "Zgjidh nga 1 deri në 50 klasa."}, status=400)

    klasat_ids = [_id_pozitiv(value) for value in klasat_raw]
    if any(value is None for value in klasat_ids) or len(set(klasat_ids)) != len(klasat_ids):
        return Response({"gabim": "Zgjedhja e klasave është e pavlefshme ose ka përsëritje."}, status=400)
    if kujdestar_raw not in (None, "") and (not kujdestar_id or kujdestar_id not in klasat_ids):
        return Response({"gabim": "Klasa e kujdestarisë duhet të jetë një nga klasat e zgjedhura."}, status=400)

    with transaction.atomic():
        mesimdhenesi = Mesimdhenesi.objects.filter(pk=mesimdhenesi_id).first()
        lenda = Lenda.objects.filter(pk=lenda_id).first()
        if mesimdhenesi is None or lenda is None:
            return Response({"gabim": "Mësimdhënësi ose lënda nuk ekziston."}, status=400)

        klasat = list(Klasa.objects.select_for_update().filter(pk__in=klasat_ids).order_by("id"))
        if len(klasat) != len(klasat_ids):
            return Response({"gabim": "Njëra nga klasat e zgjedhura nuk ekziston."}, status=400)

        if kujdestar_id:
            kujdestar_klasa = next(klasa for klasa in klasat if klasa.id == kujdestar_id)
            if kujdestar_klasa.kujdestari_id not in (None, mesimdhenesi_id):
                return Response(
                    {"gabim": f"Klasa {kujdestar_klasa.emri} ka tashmë kujdestar. Ndrysho kujdestarin nga menaxhimi i klasave."},
                    status=status.HTTP_409_CONFLICT,
                )

        ekzistuese = set(
            Angazhimi.objects.filter(
                mesimdhenesi_id=mesimdhenesi_id,
                lenda_id=lenda_id,
                klasa_id__in=klasat_ids,
            ).values_list("klasa_id", flat=True)
        )
        te_reja = [
            Angazhimi(mesimdhenesi=mesimdhenesi, lenda=lenda, klasa_id=klasa_id)
            for klasa_id in klasat_ids
            if klasa_id not in ekzistuese
        ]
        Angazhimi.objects.bulk_create(te_reja)

        if kujdestar_id:
            Klasa.objects.filter(pk=kujdestar_id).update(kujdestari_id=mesimdhenesi_id)

    count = len(te_reja)
    skipped = len(ekzistuese)
    return Response(
        {
            "mesazhi": f"U ruajtën {count} angazhime të reja. {skipped} ekzistuese nuk u përsëritën.",
            "te_reja": count,
            "ekzistuese": skipped,
            "kujdestar_klase": kujdestar_id,
        },
        status=status.HTTP_201_CREATED if count else status.HTTP_200_OK,
    )
