from django.db.models import Q

from .models import Angazhimi, Nota, Mungesa, Mesimdhenesi


def eshte_drejtor(perdorues):
    return (
        perdorues.is_authenticated
        and perdorues.roli == "drejtor"
    )


def eshte_mesimdhenes(perdorues):
    return (
        perdorues.is_authenticated
        and perdorues.roli == "mesimdhenes"
        and Mesimdhenesi.objects.filter(perdorues=perdorues, miratuar=True).exists()
    )


def eshte_nxenes(perdorues):
    return (
        perdorues.is_authenticated
        and perdorues.roli == "nxenes"
    )


def angazhimet_e_mesimdhenesit(perdorues):
    if not eshte_mesimdhenes(perdorues):
        return Angazhimi.objects.none()

    return Angazhimi.objects.filter(
        mesimdhenesi__perdorues_id=perdorues.pk
    )


def notat_e_dukshme(perdorues):
    if eshte_drejtor(perdorues):
        return Nota.objects.all()

    if eshte_mesimdhenes(perdorues):
        return Nota.objects.filter(
            Q(angazhimi__mesimdhenesi__perdorues_id=perdorues.pk)
            | Q(nxenesi__klasa__kujdestari__perdorues_id=perdorues.pk)
        ).distinct()

    if eshte_nxenes(perdorues):
        return Nota.objects.filter(
            nxenesi__perdorues_id=perdorues.pk
        )

    return Nota.objects.none()


def mungesat_e_dukshme(perdorues):
    if eshte_drejtor(perdorues):
        return Mungesa.objects.all()

    if eshte_mesimdhenes(perdorues):
        return Mungesa.objects.filter(
            Q(
                angazhimi__mesimdhenesi__perdorues_id=perdorues.pk
            )
            |
            Q(
                nxenesi__klasa__kujdestari__perdorues_id=perdorues.pk
            )
        ).distinct()

    if eshte_nxenes(perdorues):
        return Mungesa.objects.filter(
            nxenesi__perdorues_id=perdorues.pk
        )

    return Mungesa.objects.none()


def mund_te_regjistroje_note(perdorues, angazhimi):
    if not eshte_mesimdhenes(perdorues):
        return False

    return angazhimi.mesimdhenesi.perdorues_id == perdorues.pk


def mund_te_regjistroje_mungese(perdorues, angazhimi):
    if not eshte_mesimdhenes(perdorues):
        return False

    return angazhimi.mesimdhenesi.perdorues_id == perdorues.pk


def eshte_kujdestar_i_klases(perdorues, klasa):
    if not eshte_mesimdhenes(perdorues):
        return False

    if klasa.kujdestari_id is None:
        return False

    return klasa.kujdestari.perdorues_id == perdorues.pk


def mund_te_arsyetoje_mungese(perdorues, mungesa):
    if eshte_drejtor(perdorues):
        return True

    return eshte_kujdestar_i_klases(
        perdorues,
        mungesa.nxenesi.klasa
    )


def nxenesi_i_perket_angazhimit(nxenesi, angazhimi):
    return nxenesi.klasa_id == angazhimi.klasa_id


def mund_te_ndryshoje_noter(perdorues, nota):
    if eshte_drejtor(perdorues):
        return True

    return mund_te_regjistroje_note(
        perdorues,
        nota.angazhimi
    )


def mund_te_ndryshoje_mungese(perdorues, mungesa):
    if eshte_drejtor(perdorues):
        return True

    return mund_te_regjistroje_mungese(
        perdorues,
        mungesa.angazhimi
    )
