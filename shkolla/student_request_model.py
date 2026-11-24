from django.conf import settings
from django.db import models
from .models import Nxenesi

class KerkesaNxenesit(models.Model):
    nxenesi = models.ForeignKey(Nxenesi, on_delete=models.CASCADE)
    marresi = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    lloji = models.CharField(max_length=12)
    titulli = models.CharField(max_length=150)
    pershkrimi = models.TextField()
    statusi = models.CharField(max_length=15, default='ne_shqyrtim')
    pergjigjja = models.TextField(blank=True)
    data = models.DateTimeField(auto_now_add=True)
    class Meta:
        app_label = 'shkolla'

