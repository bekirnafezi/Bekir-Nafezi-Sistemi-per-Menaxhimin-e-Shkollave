"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from shkolla.views import (
    login_api,
    profili_api,
    statistikat_api,
    klasat_api,
    klasa_detaje_api,
    nxenesit_api,
    nxenesi_detaje_api,
    mesimdhenesit_api,
    mesimdhenesi_detaje_api,
    lendet_api,
    lenda_detaje_api,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', login_api, name='login_api'),
    path('api/me/', profili_api, name='profili_api'),
    path('api/statistikat/', statistikat_api, name='statistikat_api'),
    path('api/klasat/', klasat_api, name='klasat_api'),
    path('api/klasat/<int:klasa_id>/', klasa_detaje_api, name='klasa_detaje_api'), 
    path('api/nxenesit/', nxenesit_api, name='nxenesit_api'),
    path(
    'api/nxenesit/<int:nxenesi_id>/',
    nxenesi_detaje_api,
    name='nxenesi_detaje_api'
),
    path(
    'api/mesimdhenesit/',
    mesimdhenesit_api,
    name='mesimdhenesit_api'
),
    path(
    'api/mesimdhenesit/<int:mesimdhenesi_id>/',
    mesimdhenesi_detaje_api,
    name='mesimdhenesi_detaje_api'
),
    path(
    'api/lendet/',
    lendet_api,
    name='lendet_api'
),
    path(
    'api/lendet/<int:lenda_id>/',
    lenda_detaje_api,
    name='lenda_detaje_api'
),
]