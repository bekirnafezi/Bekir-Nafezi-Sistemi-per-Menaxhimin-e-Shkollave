from shkolla.login_role_redirect import zgjedh_rolin_nese_mungon
from django.contrib import admin
from django.urls import path
from shkolla.director_grades import director_grades_page, director_grades_data_api

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


from shkolla.frontend_views import lendet_page, angazhimet_page, zgjedh_rolin_page

from shkolla.director_absences import director_absences_page, director_absences_data_api

urlpatterns = [
    path('lendet/', lendet_page, name='lendet'),
    path('angazhimet/', angazhimet_page, name='angazhimet'),

    path('', zgjedh_rolin_page, name='home'),
    path("login/", zgjedh_rolin_nese_mungon(login_page), name="login"),
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

from shkolla.aktivitetet_api import aktivitetet_api

urlpatterns += [
    path("api/aktivitetet/", aktivitetet_api, name="aktivitetet_api"),
]


from shkolla.aktivitetet_api import (
    aktivitet_detaje_api,
    aktivitetet_raportet_api,
)

urlpatterns += [
    path(
        "api/aktivitetet/raportet/",
        aktivitetet_raportet_api,
        name="aktivitetet_raportet_api",
    ),
    path(
        "api/aktivitetet/<int:aktivitet_id>/",
        aktivitet_detaje_api,
        name="aktivitet_detaje_api",
    ),
]

from shkolla.vendimet_api import (
    vendimet_api,
    vendimet_personat_api,
)

urlpatterns += [
    path(
        "api/vendimet/",
        vendimet_api,
        name="vendimet_api",
    ),
    path(
        "api/vendimet/personat/",
        vendimet_personat_api,
        name="vendimet_personat_api",
    ),
]


from shkolla.vendimet_api import vendim_detaje_api

urlpatterns += [
    path(
        "api/vendimet/<int:vendim_id>/",
        vendim_detaje_api,
        name="vendim_detaje_api",
    ),
]


from shkolla.frontend_views import notat_page, mungesat_page

urlpatterns += [
    path("notat/", director_grades_page, name="notat"),
    path("mungesat/", director_absences_page, name="mungesat"),
]
from shkolla.evidenca_statistika import statistikat_notave, statistikat_mungesave

urlpatterns += [
    path("api/statistika/notat/", statistikat_notave, name="statistikat_notave"),
]
urlpatterns += [
    path("api/statistika/mungesat/", statistikat_mungesave, name="statistikat_mungesave"),
]
from shkolla.frontend_views import teacher_register_page, teacher_dashboard_page, director_requests_page
from shkolla.teacher_portal_api import (
    secure_login_api, teacher_public_subjects, teacher_signup_api,
    teacher_dashboard_api, teacher_photo_api, teacher_requests_api,
    director_teacher_requests_api, director_teacher_approval_api,
)

urlpatterns += [
    path("mesimdhenesi/regjistrohu/", teacher_register_page, name="teacher_register"),
    path("mesimdhenesi/panel/", teacher_dashboard_page, name="teacher_dashboard"),
    path("drejtori/kerkesat/", director_requests_page, name="director_requests"),
    path("api/mesimdhenesi/lendet/", teacher_public_subjects),
    path("api/mesimdhenesi/regjistrohu/", teacher_signup_api),
    path("api/mesimdhenesi/panel/", teacher_dashboard_api),
    path("api/mesimdhenesi/foto/", teacher_photo_api),
    path("api/mesimdhenesi/kerkesat/", teacher_requests_api),
    path("api/drejtori/kerkesat/", director_teacher_requests_api),
    path("api/drejtori/mesimdhenesit/<int:pk>/mirato/", director_teacher_approval_api),
]

urlpatterns.insert(0, path("api/auth/login/", secure_login_api, name="secure_login_api"))


from shkolla.teacher_portal_pages import (
    teacher_classes_page,
    teacher_grades_page,
    teacher_tutor_page,
    teacher_decisions_page,
    teacher_requests_page,
)

urlpatterns += [
    path("mesimdhenesi/klasat/", teacher_classes_page, name="teacher_classes"),
    path("mesimdhenesi/notat/", teacher_grades_page, name="teacher_grades"),
    path("mesimdhenesi/klasa-ime/", teacher_tutor_page, name="teacher_tutor"),
    path("mesimdhenesi/vendimet/", teacher_decisions_page, name="teacher_decisions"),
    path("mesimdhenesi/kerkesat/", teacher_requests_page, name="teacher_requests"),
]

from shkolla.lendet_ligjeruesit_api import lendet_ligjeruesit_api

urlpatterns += [
    path("api/lendet/ligjeruesit/", lendet_ligjeruesit_api, name="lendet_ligjeruesit_api"),
]

from shkolla.teacher_profile_api import teacher_profile_api

urlpatterns += [
    path("api/mesimdhenesi/profili/", teacher_profile_api, name="teacher_profile_api"),
]

from shkolla.director_auth import director_register_page, director_register_api

urlpatterns += [
    path("drejtori/regjistrohu/", director_register_page, name="director_register"),
    path("api/drejtori/regjistrohu/", director_register_api, name="director_register_api"),
]

from shkolla.director_login_entry import director_login_entry

urlpatterns += [
    path("drejtori/hyrje/", director_login_entry, name="director_login_entry"),
]

from shkolla.angazhimet_bulk_api import angazhimet_bulk_api

urlpatterns += [
    path("api/angazhimet/ne-grup/", angazhimet_bulk_api, name="angazhimet_bulk_api"),
]



urlpatterns += [
    path("api/drejtori/notat-pasqyra/", director_grades_data_api, name="director_grades_data_api"),
]

urlpatterns += [
    path("api/drejtori/mungesat-pasqyra/", director_absences_data_api, name="director_absences_data_api"),
]

from shkolla.director_profile_api import director_profile_api, director_photo_api

urlpatterns += [
    path("api/drejtori/profili/", director_profile_api, name="director_profile_api"),
    path("api/drejtori/foto/", director_photo_api, name="director_photo_api"),
]

from shkolla.student_portal import (
    student_panel_page, student_login_api, student_me_api,
    student_grades_api, student_absences_api, student_notices_api,
)

urlpatterns += [
    path("nxenesi/klasa/", student_panel_page, {"section": "klasa"}, name="student_class"),
    path("nxenesi/notat/", student_panel_page, {"section": "notat"}, name="student_grades"),
    path("nxenesi/mungesat/", student_panel_page, {"section": "mungesat"}, name="student_absences"),
    path("nxenesi/njoftimet/", student_panel_page, {"section": "njoftimet"}, name="student_notifications"),
    path("nxenesi/aktivitetet/", student_panel_page, {"section": "aktivitetet"}, name="student_activities"),
    path("api/nxenesi/hyr/", student_login_api, name="student_login_api"),
    path("api/nxenesi/profili/", student_me_api, name="student_me_api"),
    path("api/nxenesi/notat/", student_grades_api, name="student_grades_api"),
    path("api/nxenesi/mungesat/", student_absences_api, name="student_absences_api"),
    path("api/nxenesi/njoftimet/", student_notices_api, name="student_notices_api"),
]

from shkolla.student_requests import requests_api, inbox_page
urlpatterns += [path("api/komunikimi-nxenesit/", requests_api), path("kerkesat-e-nxenesve/", inbox_page)]

from shkolla.teacher_notices_api import teacher_notices_api

urlpatterns += [
    path("api/mesimdhenesi/njoftimet/", teacher_notices_api, name="teacher_notices_api"),
]

from shkolla.student_photo_api import student_photo_api
urlpatterns += [path("api/nxenesi/foto/", student_photo_api, name="student_photo_api")]
