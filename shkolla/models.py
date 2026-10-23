from django.db import models
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

    def __str__(self):
        return self.emri