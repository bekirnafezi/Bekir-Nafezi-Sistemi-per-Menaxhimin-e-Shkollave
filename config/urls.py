from django.contrib import admin
from django.urls import path

from shkolla.frontend_views import (
    login_page,
    dashboard_page,
    klasat_page,
    nxenesit_page,
    mesimdhenesit_page,
)

from shkolla.student_registration import regjistro_nxenesin_api
from shkolla.student_management import menaxho_nxenesin_api

from shkolla.teacher_registration import regjistro_mesimdhenesin_api
from shkolla.teacher_management import menaxho_mesimdhenesin_api

from shkolla.views import (
    login_api,
    profili_api,
    statistikat_api,
    klasat_api,
    klasa_detaje_api,
    nxenesit_api,
    mesimdhenesit_api,
    lendet_api,
    lenda_detaje_api,
    angazhimet_api,
    angazhimi_detaje_api,
    notat_api,
    nota_detaje_api,
    mungesat_api,
    mungesa_detaje_api,
)


from shkolla.frontend_views import lendet_page

urlpatterns = [
    path('lendet/', lendet_page, name='lendet'),

    path('', login_page, name='home'),
    path('login/', login_page, name='login'),
    path('dashboard/', dashboard_page, name='dashboard'),
    path('klasat/', klasat_page, name='klasat'),
    path('nxenesit/', nxenesit_page, name='nxenesit'),
    path('mesimdhenesit/', mesimdhenesit_page, name='mesimdhenesit'),

    path('admin/', admin.site.urls),

    path(
        'api/auth/login/',
        login_api,
        name='login_api'
    ),

    path(
        'api/me/',
        profili_api,
        name='profili_api'
    ),

    path(
        'api/statistikat/',
        statistikat_api,
        name='statistikat_api'
    ),

    path(
        'api/klasat/',
        klasat_api,
        name='klasat_api'
    ),

    path(
        'api/klasat/<int:klasa_id>/',
        klasa_detaje_api,
        name='klasa_detaje_api'
    ),

    path(
        'api/nxenesit/',
        nxenesit_api,
        name='nxenesit_api'
    ),

    path(
        'api/nxenesit/regjistro/',
        regjistro_nxenesin_api,
        name='regjistro_nxenesin_api'
    ),

    path(
        'api/nxenesit/<int:nxenesi_id>/',
        menaxho_nxenesin_api,
        name='nxenesi_detaje_api'
    ),

    path(
        'api/mesimdhenesit/',
        mesimdhenesit_api,
        name='mesimdhenesit_api'
    ),

    path(
        'api/mesimdhenesit/regjistro/',
        regjistro_mesimdhenesin_api,
        name='regjistro_mesimdhenesin_api'
    ),

    path(
        'api/mesimdhenesit/<int:mesimdhenesi_id>/',
        menaxho_mesimdhenesin_api,
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

    path(
        'api/angazhimet/',
        angazhimet_api,
        name='angazhimet_api'
    ),

    path(
        'api/angazhimet/<int:angazhimi_id>/',
        angazhimi_detaje_api,
        name='angazhimi_detaje_api'
    ),

    path(
        'api/notat/',
        notat_api,
        name='notat_api'
    ),

    path(
        'api/notat/<int:nota_id>/',
        nota_detaje_api,
        name='nota_detaje_api'
    ),

    path(
        'api/mungesat/',
        mungesat_api,
        name='mungesat_api'
    ),

    path(
        'api/mungesat/<int:mungesa_id>/',
        mungesa_detaje_api,
        name='mungesa_detaje_api'
    ),
]