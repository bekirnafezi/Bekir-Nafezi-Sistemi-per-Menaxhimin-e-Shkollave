from django.db import models


class Aktivitet(models.Model):

    STATUS_CHOICES = [
        ("planifikuar", "Planifikuar"),
        ("mbajtur", "I mbajtur"),
        ("anuluar", "I anuluar"),
    ]

    emri = models.CharField(max_length=160)

    data = models.DateField(db_index=True)

    statusi = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default="planifikuar",
        db_index=True
    )

    arsye_anulimi = models.TextField(
        blank=True,
        default=""
    )

    krijuar_me = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["data", "id"]

    def __str__(self):
        return self.emri