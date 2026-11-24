from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Perdorues, Mesimdhenesi, Nxenesi, Klasa, Angazhimi, Lenda, Vendim, NjoftimMesimdhenesi


class TeacherNoticeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.teacher = Mesimdhenesi.objects.create(perdorues=self.user("teacher", "mesimdhenes"))
        self.other_teacher = Mesimdhenesi.objects.create(perdorues=self.user("other_teacher", "mesimdhenes"))
        self.pending = Mesimdhenesi.objects.create(perdorues=self.user("pending", "mesimdhenes"), miratuar=False)
        self.cls = Klasa.objects.create(emri="1/1", kujdestari=self.teacher)
        self.taught = Klasa.objects.create(emri="2/1")
        self.other = Klasa.objects.create(emri="3/1", kujdestari=self.other_teacher)
        Angazhimi.objects.create(mesimdhenesi=self.teacher, klasa=self.taught, lenda=Lenda.objects.create(emri="Matematikë"))
        self.a = Nxenesi.objects.create(perdorues=self.user("a", "nxenes"), klasa=self.cls)
        self.b = Nxenesi.objects.create(perdorues=self.user("b", "nxenes"), klasa=self.cls)
        self.c = Nxenesi.objects.create(perdorues=self.user("c", "nxenes"), klasa=self.other)
        self.d = Nxenesi.objects.create(perdorues=self.user("d", "nxenes"), klasa=self.taught)
        self.endpoint = "/api/mesimdhenesi/njoftimet/"
        self.student_endpoint = "/api/nxenesi/njoftimet/"

    def user(self, name, role):
        return Perdorues.objects.create_user(email=f"{name}@school.test", roli=role, first_name=name)

    def login(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def send(self, cls, student=None):
        return self.client.post(self.endpoint, {"klasa": cls.pk, "nxenesi": student.pk if student else None,
            "titulli": "Njoftim testues", "permbajtja": "Përmbajtja e njoftimit."}, format="json")

    def notices(self, student):
        self.login(student.perdorues)
        response = self.client.get(self.student_endpoint)
        self.assertEqual(response.status_code, 200)
        return response.data

    def test_single_recipient_and_director_notices(self):
        self.login(self.teacher.perdorues)
        self.assertEqual(self.send(self.cls, self.a).status_code, 201)
        Vendim.objects.create(titulli="Për shkollën", permbajtja="Për të gjithë.", kategoria="shkolle")
        Vendim.objects.create(titulli="Për nxënësin A", permbajtja="Individuale.", kategoria="nxenes", nxenesi=self.a)
        a = self.notices(self.a)
        b = self.notices(self.b)
        self.assertEqual(len(a["njoftimet"]), 2)
        self.assertEqual(len(a["njoftimet_mesimdhenesit"]), 1)
        self.assertEqual(len(b["njoftimet"]), 1)
        self.assertEqual(len(b["njoftimet_mesimdhenesit"]), 0)

    def test_class_recipient_and_history(self):
        self.login(self.teacher.perdorues)
        self.assertEqual(self.send(self.cls).status_code, 201)
        self.assertEqual(len(self.client.get(self.endpoint).data["njoftimet"]), 1)
        self.assertEqual(self.send(self.taught).status_code, 201)
        self.assertEqual(len(self.notices(self.a)["njoftimet_mesimdhenesit"]), 1)
        self.assertEqual(len(self.notices(self.b)["njoftimet_mesimdhenesit"]), 1)
        self.assertEqual(len(self.notices(self.d)["njoftimet_mesimdhenesit"]), 1)
        self.assertEqual(len(self.notices(self.c)["njoftimet_mesimdhenesit"]), 0)
        newcomer = Nxenesi.objects.create(perdorues=self.user("new", "nxenes"), klasa=self.cls)
        self.assertEqual(len(self.notices(newcomer)["njoftimet_mesimdhenesit"]), 0)
        self.login(self.other_teacher.perdorues)
        self.assertEqual(len(self.client.get(self.endpoint).data["njoftimet"]), 0)

    def test_unauthorized_targets_and_roles(self):
        self.login(self.teacher.perdorues)
        ids = {c["id"] for c in self.client.get(self.endpoint).data["klasat"]}
        self.assertEqual(ids, {self.cls.pk, self.taught.pk})
        self.assertEqual(self.send(self.other).status_code, 403)
        self.assertEqual(self.send(self.cls, self.c).status_code, 400)
        self.login(self.a.perdorues)
        self.assertEqual(self.send(self.cls).status_code, 403)
        self.login(self.pending.perdorues)
        self.assertEqual(self.send(self.cls).status_code, 403)
        self.client.credentials()
        self.assertEqual(self.client.get(self.endpoint).status_code, 401)
        self.assertEqual(NjoftimMesimdhenesi.objects.count(), 0)
