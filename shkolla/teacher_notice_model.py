from django.db import models


class NjoftimMesimdhenesi(models.Model):
    mesimdhenesi = models.ForeignKey(
        "shkolla.Mesimdhenesi", on_delete=models.SET_NULL, null=True,
        related_name="njoftimet_e_derguara"
    )
    klasa = models.ForeignKey(
        "shkolla.Klasa", on_delete=models.SET_NULL, null=True,
        related_name="njoftimet_e_mesimdhenesve"
    )
    nxenesit = models.ManyToManyField(
        "shkolla.Nxenesi", related_name="njoftimet_e_mesimdhenesve"
    )
    titulli = models.CharField(max_length=200)
    permbajtja = models.TextField(max_length=3000)
    derguesi = models.CharField(max_length=320)
    marresi = models.CharField(max_length=320)
    krijuar_me = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-krijuar_me", "-pk"]

    def __str__(self):
        return self.titulli
