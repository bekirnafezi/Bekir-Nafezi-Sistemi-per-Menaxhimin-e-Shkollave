from django.db import models
from django.utils import timezone

class KerkeseMesimdhenesi(models.Model):
    LLOJET = [
        ("perjashtim", "Propozim mase disiplinore"),
        ("leje", "Kerkese per leje"),
        ("sqarim", "Kerkese per sqarim"),
    ]
    STATUS = [
        ("ne_shqyrtim", "Ne shqyrtim"),
        ("miratuar", "Miratuar"),
        ("refuzuar", "Refuzuar"),
    ]
    mesimdhenesi = models.ForeignKey(
        "shkolla.Mesimdhenesi", on_delete=models.PROTECT,
        related_name="kerkesat"
    )
    lloji = models.CharField(max_length=20, choices=LLOJET)
    titulli = models.CharField(max_length=180)
    pershkrimi = models.TextField()
    nxenesi = models.ForeignKey(
        "shkolla.Nxenesi", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="kerkesat_per_masa"
    )
    data_nga = models.DateField(null=True, blank=True)
    data_deri = models.DateField(null=True, blank=True)
    statusi = models.CharField(max_length=20, choices=STATUS, default="ne_shqyrtim")
    pergjigja = models.TextField(blank=True)
    vendosur_nga = models.ForeignKey(
        "shkolla.Perdorues", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="kerkesat_e_shqyrtuara"
    )
    krijuar_me = models.DateTimeField(auto_now_add=True)
    vendosur_me = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-krijuar_me", "-pk"]

    def __str__(self):
        return self.titulli
