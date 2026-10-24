from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager


class MenaxheriPerdoruesve(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Emaili eshte i detyrueshem.")

        email = self.normalize_email(email)
        perdoruesi = self.model(email=email, **extra_fields)
        perdoruesi.set_password(password)
        perdoruesi.save(using=self._db)

        return perdoruesi

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("roli", "drejtor")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Administratori duhet te kete is_staff=True.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Administratori duhet te kete is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class Perdorues(AbstractUser):

    ROLET = [
        ("drejtor", "Drejtor"),
        ("mesimdhenes", "Mesimdhenes"),
        ("nxenes", "Nxenes"),
    ]

    username = None
    email = models.EmailField(unique=True)

    roli = models.CharField(
        max_length=20,
        choices=ROLET,
        default="nxenes"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = MenaxheriPerdoruesve()

    def __str__(self):
        return self.email

class Klasa(models.Model):
    emri = models.CharField(max_length=30, unique=True)

    kujdestari = models.ForeignKey(
        "Mesimdhenesi",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="klasat_kujdestare"
    )

    def __str__(self):
        return self.emri


class Mesimdhenesi(models.Model):
    perdorues = models.OneToOneField(
        Perdorues,
        on_delete=models.CASCADE,
        related_name="profili_mesimdhenesit"
    )

    def __str__(self):
        return self.perdorues.email

class Nxenesi(models.Model):
    perdorues = models.OneToOneField(
        Perdorues,
        on_delete=models.CASCADE,
        related_name="profili_nxenesit"
    )

    klasa = models.ForeignKey(
        Klasa,
        on_delete=models.PROTECT,
        related_name="nxenesit"
    )

    def __str__(self):
        return f"{self.perdorues.first_name} {self.perdorues.last_name}"

class Lenda(models.Model):
    emri = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.emri

class Angazhimi(models.Model):
    mesimdhenesi = models.ForeignKey(
        Mesimdhenesi,
        on_delete=models.PROTECT,
        related_name="angazhimet"
    )

    klasa = models.ForeignKey(
        Klasa,
        on_delete=models.PROTECT,
        related_name="angazhimet"
    )

    lenda = models.ForeignKey(
        Lenda,
        on_delete=models.PROTECT,
        related_name="angazhimet"
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["mesimdhenesi", "klasa", "lenda"],
                name="angazhimi_unik"
            )
        ]

    def __str__(self):
        return f"{self.mesimdhenesi} - {self.lenda} - {self.klasa}"

class Nota(models.Model):
    nxenesi = models.ForeignKey(
        Nxenesi,
        on_delete=models.PROTECT,
        related_name="notat"
    )

    angazhimi = models.ForeignKey(
        Angazhimi,
        on_delete=models.PROTECT,
        related_name="notat"
    )

    vleresimi = models.PositiveSmallIntegerField(
    validators=[
        MinValueValidator(1),
        MaxValueValidator(5)
    ]
)
    data = models.DateField()
    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(
                    vleresimi__gte=1,
                    vleresimi__lte=5
                ),
                name="nota_vleresimi_nga_1_ne_5"
            )
        ]
    def clean(self):
        super().clean()

        if self.nxenesi_id and self.angazhimi_id:
            if self.nxenesi.klasa_id != self.angazhimi.klasa_id:
                raise ValidationError(
                    "Nxenesi nuk i perket klases se ketij angazhimi."
                )

    def __str__(self):
        return f"{self.nxenesi} - {self.vleresimi} - {self.angazhimi.lenda}"
        
class Mungesa(models.Model):
    nxenesi = models.ForeignKey(
        Nxenesi,
        on_delete=models.PROTECT,
        related_name="mungesat"
    )

    angazhimi = models.ForeignKey(
        Angazhimi,
        on_delete=models.PROTECT,
        related_name="mungesat"
    )

    data = models.DateField()

    arsyetimi = models.TextField(
        blank=True
    )

    def clean(self):
        super().clean()

        if self.nxenesi_id and self.angazhimi_id:
            if self.nxenesi.klasa_id != self.angazhimi.klasa_id:
                raise ValidationError(
                    "Nxenesi nuk i perket klases se ketij angazhimi."
                )

    def __str__(self):
        return f"{self.nxenesi} - {self.angazhimi.lenda} - {self.data}"