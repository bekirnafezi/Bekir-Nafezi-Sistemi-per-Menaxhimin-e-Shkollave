
from django.db.models import Avg, Count
from django.utils.dateparse import parse_date

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Klasa, Nxenesi, Nota, Mungesa
from .evidenca_permissions import eshte_drejtor


def merr_filtrat(request, perfshi_lenden=False):
    filtrat = {}

    parametrat = ["klasa", "nxenesi"]

    if perfshi_lenden:
        parametrat.append("lenda")

    for emri in parametrat:
        vlera = request.query_params.get(emri)

        if not vlera:
            continue

        if not vlera.isascii() or not vlera.isdigit():
            return None, f"Parametri {emri} duhet te jete numer."

        filtrat[emri] = int(vlera)

    for emri in ["data_nga", "data_deri"]:
        vlera = request.query_params.get(emri)

        if not vlera:
            continue

        data = parse_date(vlera)

        if data is None or data.isoformat() != vlera:
            return None, f"Data {emri} duhet te jete YYYY-MM-DD."

        filtrat[emri] = data

    fillimi = filtrat.get("data_nga")
    fundi = filtrat.get("data_deri")

    if fillimi and fundi and fillimi > fundi:
        return None, "Data e fillimit nuk mund te jete pas dates se fundit."

    return filtrat, None


def merr_nxenesit_dhe_klasat(filtrat):
    nxenesit = Nxenesi.objects.select_related(
        "perdorues", "klasa"
    ).order_by("klasa__emri", "id")

    klasat = Klasa.objects.order_by("emri")

    if "klasa" in filtrat:
        nxenesit = nxenesit.filter(
            klasa_id=filtrat["klasa"]
        )
        klasat = klasat.filter(
            id=filtrat["klasa"]
        )

    if "nxenesi" in filtrat:
        nxenesit = nxenesit.filter(
            id=filtrat["nxenesi"]
        )

        klasat = klasat.filter(
            id__in=nxenesit.values("klasa_id")
        )

    return list(nxenesit), list(klasat)


def emri_i_nxenesit(nxenesi):
    emri = " ".join(
        filter(
            None,
            [
                nxenesi.perdorues.first_name,
                nxenesi.perdorues.last_name
            ]
        )
    ).strip()

    return emri or nxenesi.perdorues.email


def mesatarja(vlerat):
    if not vlerat:
        return None

    return round(sum(vlerat) / len(vlerat), 2)


def zbato_datat(queryset, filtrat):
    if "data_nga" in filtrat:
        queryset = queryset.filter(
            data__gte=filtrat["data_nga"]
        )

    if "data_deri" in filtrat:
        queryset = queryset.filter(
            data__lte=filtrat["data_deri"]
        )

    return queryset


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def statistikat_notave(request):
    if not eshte_drejtor(request.user):
        return Response(
            {"gabim": "Vetem drejtori mund t'i shikoje statistikat."},
            status=403
        )

    filtrat, gabimi = merr_filtrat(
        request,
        perfshi_lenden=True
    )

    if gabimi:
        return Response({"gabim": gabimi}, status=400)

    nxenesit, klasat = merr_nxenesit_dhe_klasat(filtrat)
    ids = [nxenesi.id for nxenesi in nxenesit]

    notat = Nota.objects.filter(
        nxenesi_id__in=ids
    )

    notat = zbato_datat(notat, filtrat)

    if "lenda" in filtrat:
        notat = notat.filter(
            angazhimi__lenda_id=filtrat["lenda"]
        )

    rezultatet = notat.values(
        "nxenesi_id"
    ).annotate(
        numri=Count("id"),
        mesatarja=Avg("vleresimi")
    )

    rezultatet_sipas_nxenesit = {
        r["nxenesi_id"]: r
        for r in rezultatet
    }

    nxenesit_rezultat = []
    klasat_rezultat = []

    mesataret_e_shkolles = []
    numri_total_i_notave = 0

    for klasa in klasat:
        mesataret_e_klases = []
        numri_i_notave_te_klases = 0
        nxenes_me_nota = 0

        nxenesit_e_klases = [
            nxenesi
            for nxenesi in nxenesit
            if nxenesi.klasa_id == klasa.id
        ]

        for nxenesi in nxenesit_e_klases:
            rezultati = rezultatet_sipas_nxenesit.get(
                nxenesi.id
            )

            numri = rezultati["numri"] if rezultati else 0

            mes = (
                round(float(rezultati["mesatarja"]), 2)
                if rezultati and rezultati["mesatarja"] is not None
                else None
            )

            if mes is not None:
                mesataret_e_klases.append(
                    float(rezultati["mesatarja"])
                )
                mesataret_e_shkolles.append(
                    float(rezultati["mesatarja"])
                )
                nxenes_me_nota += 1

            numri_i_notave_te_klases += numri

            nxenesit_rezultat.append({
                "nxenesi_id": nxenesi.id,
                "nxenesi": emri_i_nxenesit(nxenesi),
                "klasa_id": klasa.id,
                "klasa": klasa.emri,
                "nota_gjithsej": numri,
                "mesatarja": mes
            })

        numri_total_i_notave += numri_i_notave_te_klases

        klasat_rezultat.append({
            "klasa_id": klasa.id,
            "klasa": klasa.emri,
            "nxenes_gjithsej": len(nxenesit_e_klases),
            "nxenes_me_nota": nxenes_me_nota,
            "nota_gjithsej": numri_i_notave_te_klases,
            "mesatarja": mesatarja(mesataret_e_klases)
        })

    return Response({
        "shkolla": {
            "klasa_gjithsej": len(klasat),
            "nxenes_gjithsej": len(nxenesit),
            "nxenes_me_nota": len(mesataret_e_shkolles),
            "nota_gjithsej": numri_total_i_notave,
            "mesatarja": mesatarja(mesataret_e_shkolles)
        },
        "klasat": klasat_rezultat,
        "nxenesit": nxenesit_rezultat
    })


def statistika_bosh():
    return {
        "gjithsej": 0,
        "e_arsyeshme": 0,
        "e_paarsyeshme": 0,
        "ne_shqyrtim": 0,
        "pa_ore": 0,
        "sipas_ores": {}
    }


def shto_mungesen(statistika, mungesa):
    statistika["gjithsej"] += 1

    statusi = mungesa["statusi"]

    if statusi in [
        "e_arsyeshme",
        "e_paarsyeshme",
        "ne_shqyrtim"
    ]:
        statistika[statusi] += 1

    ora = mungesa["ora_mesimore"]

    if ora is None:
        statistika["pa_ore"] += 1
    else:
        ora = str(ora)

        statistika["sipas_ores"][ora] = (
            statistika["sipas_ores"].get(ora, 0) + 1
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def statistikat_mungesave(request):
    if not eshte_drejtor(request.user):
        return Response(
            {"gabim": "Vetem drejtori mund t'i shikoje statistikat."},
            status=403
        )

    filtrat, gabimi = merr_filtrat(request)

    if gabimi:
        return Response({"gabim": gabimi}, status=400)

    nxenesit, klasat = merr_nxenesit_dhe_klasat(filtrat)
    ids = [nxenesi.id for nxenesi in nxenesit]

    mungesat = Mungesa.objects.filter(
        nxenesi_id__in=ids
    )

    mungesat = zbato_datat(mungesat, filtrat)

    statistikat_e_nxenesve = {
        nxenesi.id: statistika_bosh()
        for nxenesi in nxenesit
    }

    statistikat_e_klasave = {
        klasa.id: statistika_bosh()
        for klasa in klasat
    }

    nxenesi_ne_klase = {
        nxenesi.id: nxenesi.klasa_id
        for nxenesi in nxenesit
    }

    statistikat_e_shkolles = statistika_bosh()

    for mungesa in mungesat.values(
        "nxenesi_id",
        "statusi",
        "ora_mesimore"
    ):
        nxenesi_id = mungesa["nxenesi_id"]
        klasa_id = nxenesi_ne_klase.get(nxenesi_id)

        shto_mungesen(
            statistikat_e_nxenesve[nxenesi_id],
            mungesa
        )

        if klasa_id in statistikat_e_klasave:
            shto_mungesen(
                statistikat_e_klasave[klasa_id],
                mungesa
            )

        shto_mungesen(
            statistikat_e_shkolles,
            mungesa
        )

    nxenesit_rezultat = []

    for nxenesi in nxenesit:
        nxenesit_rezultat.append({
            "nxenesi_id": nxenesi.id,
            "nxenesi": emri_i_nxenesit(nxenesi),
            "klasa_id": nxenesi.klasa_id,
            "klasa": nxenesi.klasa.emri,
            **statistikat_e_nxenesve[nxenesi.id]
        })

    klasat_rezultat = []

    for klasa in klasat:
        klasat_rezultat.append({
            "klasa_id": klasa.id,
            "klasa": klasa.emri,
            **statistikat_e_klasave[klasa.id]
        })

    return Response({
        "shkolla": {
            "nxenes_gjithsej": len(nxenesit),
            "klasa_gjithsej": len(klasat),
            **statistikat_e_shkolles
        },
        "klasat": klasat_rezultat,
        "nxenesit": nxenesit_rezultat
    })
