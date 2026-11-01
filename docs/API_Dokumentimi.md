# SCHOOL CONTROL

## Dokumentimi i API-ve – Raporti Teknik 2

### 1. Menaxhimi i klasave

API-ja për klasat mundëson shfaqjen, regjistrimin, ndryshimin dhe fshirjen e klasave në sistem.

**Endpoint-et:**

`/api/klasat/`

* GET – Shfaq listën e klasave.
* POST – Regjistron një klasë të re.

`/api/klasat/<int:klasa_id>/`

* GET – Shfaq të dhënat e një klase.
* PATCH – Ndryshon të dhënat e klasës.
* DELETE – Fshin një klasë.

### 2. Menaxhimi i nxënësve

API-ja për nxënësit mundëson menaxhimin e të dhënave të nxënësve dhe lidhjen e tyre me klasat përkatëse.

**Endpoint-et:**

`/api/nxenesit/`

* GET – Shfaq listën e nxënësve.
* POST – Regjistron një nxënës të ri.

`/api/nxenesit/<int:nxenesi_id>/`

* GET – Shfaq të dhënat e një nxënësi.
* PATCH – Ndryshon të dhënat e nxënësit.
* DELETE – Fshin një nxënës.

### 3. Menaxhimi i mësimdhënësve

API-ja për mësimdhënësit mundëson regjistrimin dhe menaxhimin e të dhënave të mësimdhënësve.

**Endpoint-et:**

`/api/mesimdhenesit/`

* GET – Shfaq listën e mësimdhënësve.
* POST – Regjistron një mësimdhënës të ri.

`/api/mesimdhenesit/<int:mesimdhenesi_id>/`

* GET – Shfaq të dhënat e një mësimdhënësi.
* PATCH – Ndryshon të dhënat e mësimdhënësit.
* DELETE – Fshin një mësimdhënës.

### 4. Autorizimi

Në implementimin aktual, këto API përdoren nga drejtori i shkollës. Qasja kontrollohet përmes autentikimit me token dhe lejeve të përcaktuara në backend.

Kërkesat e paautorizuara refuzohen nga sistemi.

### 5. Menaxhimi i lëndëve

API-ja për lëndët mundëson regjistrimin dhe menaxhimin e lëndëve mësimore në shkollë.

Përmes kësaj API-je, drejtori mund të shohë listën e lëndëve, të regjistrojë një lëndë të re, të ndryshojë të dhënat e saj ose ta fshijë atë.

**Endpoint-et:**

`/api/lendet/`

* GET – Shfaq listën e të gjitha lëndëve.
* POST – Regjistron një lëndë të re.

`/api/lendet/<int:lenda_id>/`

* GET – Shfaq të dhënat e një lënde sipas ID-së.
* PATCH – Ndryshon të dhënat e një lënde.
* DELETE – Fshin një lëndë nga sistemi.

**Shembull:**

Në sistem kemi regjistruar lëndën Matematikë, e cila përdoret në angazhimet e mësimdhënësve.

Të dhënat e lëndëve ruhen në databazën SQLite.

### 6. Menaxhimi i angazhimeve

API-ja për angazhimet mundëson lidhjen e mësimdhënësve me klasat dhe lëndët përkatëse.

Çdo angazhim përmban mësimdhënësin, klasën dhe lëndën që ai zhvillon.

Kjo lidhje është e rëndësishme sepse përdoret edhe gjatë regjistrimit të notave dhe mungesave të nxënësve.

**Endpoint-et:**

`/api/angazhimet/`

* GET – Shfaq listën e angazhimeve.
* POST – Regjistron një angazhim të ri.

`/api/angazhimet/<int:angazhimi_id>/`

* GET – Shfaq të dhënat e një angazhimi.
* PATCH – Ndryshon të dhënat e angazhimit.
* DELETE – Fshin një angazhim, nëse nuk pengohet nga lidhjet ekzistuese në databazë.

**Shembull:**

Në databazën testuese kemi krijuar një angazhim ku mësimdhënësi Arben Krasniqi zhvillon lëndën Matematikë në klasën 1/1.

Përmes këtij angazhimi, sistemi mund të lidhë notat dhe mungesat me lëndën dhe klasën përkatëse.

### 7. Kontrollimi i qasjes

Në versionin aktual të projektit, menaxhimi i lëndëve dhe angazhimeve lejohet për drejtorin.

Sistemi përdor autentikimin me token dhe kontrollimin e roleve për të kufizuar qasjen në këto API.


### 8. Menaxhimi i notave

API-ja për notat mundëson regjistrimin, shfaqjen, ndryshimin dhe fshirjen e notave të nxënësve.

Çdo notë lidhet me një nxënës dhe një angazhim të mësimdhënësit. Përmes angazhimit përcaktohet lënda dhe klasa përkatëse.

**Endpoint-et:**

`/api/notat/`

* GET – Shfaq listën e notave.
* POST – Regjistron një notë të re.

`/api/notat/<int:nota_id>/`

* GET – Shfaq një notë sipas ID-së.
* PATCH – Ndryshon të dhënat e një note.
* DELETE – Fshin një notë.

**Filtrimi i notave:**

API-ja mundëson edhe filtrimin e notave sipas nxënësit.

`/api/notat/?nxenesi=1`

Kjo adresë shfaq vetëm notat e nxënësit me ID 1.

Nëse parametri `nxenesi` nuk është numër, API-ja kthen gabimin HTTP 400.

**Validimi i notave:**

Sistemi kontrollon që nota të jetë nga 1 deri në 5.

Gjithashtu, kontrollon nëse nxënësi i përket klasës së angazhimit përkatës.

Nëse të dhënat nuk janë të sakta, kërkesa refuzohet.

Gjatë regjistrimit të notës, data vendoset automatikisht nga backend-i.

**Testimi:**

Gjatë zhvillimit kemi testuar regjistrimin e notës 4 për nxënësen Arta Gashi. Më pas kemi testuar ndryshimin e saj në notën 3 dhe fshirjen e regjistrimit testues.

Kemi testuar gjithashtu regjistrimin e notës 6, të cilën sistemi e ka refuzuar me HTTP 400.

### 9. Menaxhimi i mungesave

API-ja për mungesat mundëson regjistrimin dhe menaxhimin e mungesave të nxënësve.

Çdo mungesë lidhet me nxënësin, angazhimin dhe datën kur ka ndodhur mungesa.

Sistemi përmban edhe fushën `arsyetimi`, e cila mund të lihet bosh.

**Endpoint-et:**

`/api/mungesat/`

* GET – Shfaq listën e mungesave.
* POST – Regjistron një mungesë të re.

`/api/mungesat/<int:mungesa_id>/`

* GET – Shfaq një mungesë sipas ID-së.
* PATCH – Ndryshon të dhënat e mungesës.
* DELETE – Fshin një mungesë.

**Filtrimi i mungesave:**

API-ja mundëson filtrimin e mungesave sipas nxënësit.

`/api/mungesat/?nxenesi=1`

Kjo adresë shfaq vetëm mungesat e nxënësit me ID 1.

Nëse parametri `nxenesi` nuk është numër, API-ja kthen HTTP 400.

**Validimi i mungesave:**

Gjatë regjistrimit kërkohet një datë e vlefshme në formatin `YYYY-MM-DD`.

Sistemi kontrollon gjithashtu nëse nxënësi i përket klasës së angazhimit.

Nëse nxënësi dhe angazhimi u përkasin klasave të ndryshme, mungesa refuzohet.

**Testimi:**

Gjatë zhvillimit kemi regjistruar një mungesë testuese për nxënësen Arta Gashi, me datën 31 tetor 2026.

Më pas kemi testuar ndryshimin e arsyetimit dhe fshirjen e mungesës.

Gjithashtu, kemi provuar regjistrimin e një mungese me datën e pavlefshme `2026-02-30`, të cilën sistemi e ka refuzuar me HTTP 400.

### 10. Rezultatet e operacioneve CRUD

Për API-të e notave dhe mungesave kemi testuar metodat kryesore HTTP.

* GET – HTTP 200, kur kërkesa kryhet me sukses.
* POST – HTTP 201, kur regjistrohen të dhëna të reja.
* PATCH – HTTP 200, kur ndryshohen të dhënat.
* DELETE – HTTP 204, kur fshirja kryhet me sukses.

Kemi kontrolluar edhe trajtimin e gabimeve:

* HTTP 400 – Të dhëna të pavlefshme.
* HTTP 401 – Përdoruesi nuk është identifikuar.
* HTTP 403 – Përdoruesi nuk ka leje.
* HTTP 404 – Regjistrimi i kërkuar nuk ekziston.

Në versionin aktual të projektit, menaxhimi i notave dhe mungesave përmes këtyre API-ve lejohet për drejtorin e shkollës.

### 11. Autentikimi i përdoruesve

Në projektin School Control është implementuar autentikimi i përdoruesve përmes Django REST Framework.

Për identifikim përdoret adresa e email-it dhe fjalëkalimi i përdoruesit.

**Endpoint-i për identifikim:**

`/api/auth/login/`

* POST – Pranon të dhënat e identifikimit.
* Nëse të dhënat janë të sakta, sistemi kthen një token.
* Token-i përdoret për të realizuar kërkesa në API-të e mbrojtura.

Në këtë mënyrë, sistemi mund të kontrollojë nëse përdoruesi është identifikuar përpara se t'i lejojë qasje në funksionalitetet përkatëse.

**Endpoint-i i profilit:**

`/api/me/`

Ky endpoint është krijuar për pjesën e profilit të përdoruesit.

### 12. Rolet dhe autorizimi

Në sistem kemi përcaktuar tri role kryesore:

**Drejtori**

Drejtori ka qasje në funksionet e menaxhimit të të dhënave të shkollës.

Në versionin aktual të backend-it, drejtori mund të përdorë API-të CRUD për klasat, nxënësit, mësimdhënësit, lëndët, angazhimet, notat dhe mungesat.

**Mësimdhënësi**

Mësimdhënësi është një nga rolet e përcaktuara në sistem.

Gjatë kësaj faze kemi testuar kufizimin e qasjes së mësimdhënësit në API-të administrative.

**Nxënësi**

Nxënësi është roli i tretë i përcaktuar në sistem.

Të dhënat e nxënësit lidhen me klasën përkatëse, ndërsa notat dhe mungesat lidhen me angazhimet.

### 13. Kontrollimi i sigurisë së API-ve

Për kontrollimin e qasjes kemi përdorur autentikimin me token dhe kontrollimin e roleve.

Gjatë zhvillimit kemi realizuar disa testime.

**HTTP 401 – Përdoruesi nuk është identifikuar**

Kemi provuar qasjen në API-të e notave dhe mungesave pa token.

Sistemi i ka refuzuar këto kërkesa me HTTP 401.

**HTTP 403 – Përdoruesi nuk ka leje**

Kemi testuar qasjen e mësimdhënësit Arben Krasniqi në API-të e mbrojtura.

Sistemi e ka refuzuar qasjen me HTTP 403, sepse këto API janë të kufizuara për drejtorin.

**HTTP 200 – Qasja e lejuar**

Kemi testuar qasjen e drejtorit në API-të e notave dhe mungesave.

Sistemi i ka pranuar kërkesat dhe ka kthyer HTTP 200.

Këto testime tregojnë se kontrollimi i autentikimit dhe autorizimit funksionon për API-të e testuara.

Në këtë fazë kemi realizuar sigurinë bazë të backend-it, ndërsa ndërfaqja grafike do të zhvillohet në fazën e ardhshme të projektit.

### 14. Shembuj të kërkesave dhe përgjigjeve JSON

Në projektin School Control kemi përdorur formatin JSON për shkëmbimin e të dhënave ndërmjet klientit dhe backend-it.

Më poshtë janë disa shembuj të kërkesave dhe përgjigjeve të API-ve që kemi zhvilluar.

#### 14.1. Identifikimi i përdoruesit

**Endpoint:** `/api/auth/login/`

**Metoda:** POST

Shembull i kërkesës JSON:

```json
{
    "email": "drejtori.prove@schoolcontrol.test",
    "password": "FJALEKALIM_SHEMBULL"
}
```

Nëse të dhënat janë të sakta, API-ja kthen një token për identifikim.

Shembull i përgjigjes JSON:

```json
{
    "token": "TOKEN_SHEMBULL"
}
```

Token-i përdoret në kërkesat e mbrojtura përmes header-it:

```text
Authorization: Token TOKEN_SHEMBULL
```

Vlerat e fjalëkalimit dhe token-it janë vetëm shembuj dhe nuk përfaqësojnë kredenciale reale.

#### 14.2. Regjistrimi i një note

**Endpoint:** `/api/notat/`

**Metoda:** POST

Shembull i kërkesës JSON:

```json
{
    "nxenesi": 2,
    "angazhimi": 1,
    "vleresimi": 4
}
```

Në këtë shembull regjistrohet nota 4 për nxënësen me ID 2, në angazhimin me ID 1.

Data e regjistrimit vendoset automatikisht nga backend-i.

Shembull i përgjigjes JSON:

```json
{
    "id": 2,
    "nxenesi": 2,
    "angazhimi": 1,
    "vleresimi": 4
}
```

Kur regjistrimi kryhet me sukses, API-ja kthen statusin **HTTP 201 Created**.

#### 14.3. Regjistrimi i një mungese

**Endpoint:** `/api/mungesat/`

**Metoda:** POST

Shembull i kërkesës JSON:

```json
{
    "nxenesi": 2,
    "angazhimi": 1,
    "data": "2026-10-31",
    "arsyetimi": "Mungese testuese"
}
```

Shembull i përgjigjes JSON:

```json
{
    "id": 2,
    "nxenesi": 2,
    "angazhimi": 1,
    "data": "2026-10-31",
    "arsyetimi": "Mungese testuese"
}
```

Nëse të dhënat janë të vlefshme, API-ja kthen **HTTP 201 Created**.

Nëse mungon data ose ajo është e pavlefshme, sistemi e refuzon kërkesën me **HTTP 400 Bad Request**.

#### 14.4. Filtrimi i notave sipas nxënësit

**Endpoint:** `/api/notat/?nxenesi=1`

**Metoda:** GET

Ky endpoint shfaq vetëm notat e nxënësit me ID 1.

Shembull i përgjigjes JSON:

```json
[
    {
        "id": 1,
        "nxenesi": 1,
        "angazhimi": 1,
        "vleresimi": 5
    }
]
```

Nëse kërkesa kryhet me sukses, API-ja kthen **HTTP 200 OK**.

Nëse parametri `nxenesi` nuk është numër, për shembull `nxenesi=abc`, sistemi kthen **HTTP 400 Bad Request**.

#### 14.5. Përfundimi

Këta shembuj tregojnë mënyrën se si backend-i i School Control pranon dhe kthen të dhëna në formatin JSON.

Gjatë zhvillimit kemi testuar këto operacione për të kontrolluar funksionimin e API-ve, validimin e të dhënave dhe autorizimin e përdoruesve.

Shembujt e mësipërm janë ilustrues. ID-të dhe përgjigjet mund të ndryshojnë sipas të dhënave të databazës.
### 15. Testimi i backend-it dhe API-ve

Gjatë zhvillimit të projektit School Control kemi realizuar testime për të kontrolluar funksionimin e backend-it dhe komunikimin me databazën.

Testimet janë realizuar në mjedisin lokal të zhvillimit, duke përdorur Django, Django REST Framework, PowerShell dhe APIClient.

#### 15.1. Testimi i operacioneve CRUD

Kemi testuar operacionet kryesore të API-ve për menaxhimin e të dhënave.

Rezultatet e testimeve për notat dhe mungesat kanë qenë:

| Metoda | Përshkrimi               | Rezultati |
| ------ | ------------------------ | --------- |
| GET    | Shfaqja e të dhënave     | HTTP 200  |
| POST   | Regjistrimi i të dhënave | HTTP 201  |
| PATCH  | Ndryshimi i të dhënave   | HTTP 200  |
| DELETE | Fshirja e të dhënave     | HTTP 204  |

Gjatë testimit kemi krijuar regjistrime testuese për nxënësen Arta Gashi. Kemi provuar regjistrimin, ndryshimin dhe fshirjen e tyre.

Këto testime kanë konfirmuar funksionimin e operacioneve CRUD për notat dhe mungesat.

#### 15.2. Testimi i autentikimit dhe autorizimit

Kemi kontrolluar qasjen në API-të e mbrojtura për tri raste.

| Rasti                          | Rezultati |
| ------------------------------ | --------- |
| Përdorues pa identifikim       | HTTP 401  |
| Mësimdhënës pa lejen përkatëse | HTTP 403  |
| Drejtor i identifikuar         | HTTP 200  |

Testimet kanë treguar se API-të e notave dhe mungesave kontrollojnë identifikimin dhe rolin e përdoruesit.

#### 15.3. Testimi i validimeve

Kemi realizuar testime edhe me të dhëna të pavlefshme.

**Testimi i notës**

Kemi provuar regjistrimin e notës 6. Sistemi e ka refuzuar kërkesën me HTTP 400, sepse notat e lejuara janë nga 1 deri në 5.

**Testimi i datës së mungesës**

Kemi provuar regjistrimin e një mungese me datën `2026-02-30`.

Sistemi e ka refuzuar kërkesën me HTTP 400, sepse kjo datë nuk ekziston.

**Testimi i lidhjes me klasën**

Kemi testuar metodat e validimit për notat dhe mungesat kur nxënësi dhe angazhimi u përkasin klasave të ndryshme.

Serializer-at kanë refuzuar këto raste përmes gabimit të validimit.

**Testimi i regjistrimeve që nuk ekzistojnë**

Kemi provuar kërkimin e notave dhe mungesave me ID që nuk ekzistojnë.

API-të kanë kthyer HTTP 404.

#### 15.4. Testimi i filtrimeve

Në projekt kemi implementuar filtrimin e notave dhe mungesave sipas nxënësit.

Kemi testuar endpoint-et:

`/api/notat/?nxenesi=1`

`/api/mungesat/?nxenesi=1`

Rezultatet kanë treguar se sistemi shfaq vetëm të dhënat e nxënësit të kërkuar.

Gjithashtu, kemi testuar parametrin e pavlefshëm:

`nxenesi=abc`

Të dyja API-të kanë kthyer HTTP 400.

#### 15.5. Kontrollimi i databazës

Kemi kontrolluar strukturën e databazës SQLite dhe modelet e krijuara në Django.

Në sistem janë krijuar tetë modele kryesore:

Perdorues, Klasa, Mesimdhenesi, Nxenesi, Lenda, Angazhimi, Nota dhe Mungesa.

Gjithashtu, kemi kontrolluar relacionet ndërmjet modeleve.

Gjatë kontrollimit të të dhënave ekzistuese nuk kemi gjetur nota ose mungesa të lidhura me angazhime të klasave të gabuara.

#### 15.6. Kontrollimi i migrimeve

Kemi përdorur komandën:

`python manage.py showmigrations shkolla`

Rezultati ka treguar se të pesë migrimet e aplikacionit janë zbatuar.

Gjithashtu, kemi përdorur:

`python manage.py makemigrations --check --dry-run`

Django ka kthyer mesazhin:

`No changes detected`

Kjo tregon se nuk kishte ndryshime të papërfshira në migrime gjatë kontrollit.

#### 15.7. Përfundimi i testimeve

Nga testimet e realizuara kemi konfirmuar funksionimin e operacioneve kryesore të API-ve, filtrimeve, validimeve dhe kontrollimit të qasjes.

Testimet kanë ndihmuar edhe në identifikimin dhe korrigjimin e gabimeve gjatë zhvillimit.

Rezultatet e tyre do të përdoren si dëshmi gjatë përgatitjes së Raportit Teknik 2.
