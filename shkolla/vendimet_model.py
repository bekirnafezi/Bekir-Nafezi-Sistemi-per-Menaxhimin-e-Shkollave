from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class Vendim(models.Model):

    KATEGORITE = [
        ("shkolle", "Shkolla"),
        ("mesimdhenes", "M\u00ebsimdh\u00ebn\u00ebsi"),
        ("nxenes", "Nx\u00ebn\u00ebsi"),
    ]

    titulli = models.CharField(max_length=200)

    permbajtja = models.TextField()

    kategoria = models.CharField(
        max_length=20,
        choices=KATEGORITE
    )

    mesimdhenesi = models.ForeignKey(
        "shkolla.Mesimdhenesi",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendimet_e_drejtorit"
    )

    nxenesi = models.ForeignKey(
        "shkolla.Nxenesi",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vendimet_e_drejtorit"
    )

    data_vendimit = models.DateField(
        default=timezone.localdate
    )

    krijuar_me = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-data_vendimit", "-id"]

    def clean(self):
        errors = {}

        if self.kategoria == "shkolle":
            if self.mesimdhenesi_id or self.nxenesi_id:
                errors["kategoria"] = (
                    "Vendimi per shkollen nuk duhet "
                    "te kete nje person te caktuar."
                )

        elif self.kategoria == "mesimdhenes":
            if not self.mesimdhenesi_id or self.nxenesi_id:
                errors["mesimdhenesi"] = (
                    "Zgjidhni nje mesimdhenes."
                )

        elif self.kategoria == "nxenes":
            if not self.nxenesi_id or self.mesimdhenesi_id:
                errors["nxenesi"] = (
                    "Zgjidhni nje nxenes."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.titulli
