
# School Control

## Sistemi për Menaxhimin e Shkollave Fillore

School Control është një aplikacion web për menaxhimin digjital të shkollave fillore. Sistemi mundëson organizimin e të dhënave të shkollës dhe komunikimin ndërmjet drejtorit, mësimdhënësve dhe nxënësve.

## Informacionet e projektit

- Studenti: Bekir Nafezi
- Profesori: Prof. Ass. Dr. Endrit Fetahi
- Universiteti: Universiteti "Ukshin Hoti" – Prizren
- Lënda: Projekt – Praktikë Profesionale
- Viti akademik: 2026/2027
- Emri i projektit: School Control

## Teknologjitë e përdorura

- Python
- Django
- Django REST Framework
- SQLite
- HTML
- CSS
- JavaScript
- Pillow
- Git dhe GitHub
- Visual Studio Code
- DB Browser for SQLite

## Databaza dhe backend-i

Sistemi përdor databazën SQLite dhe përmban 14 modele:

1. Perdorues
2. Klasa
3. Mesimdhenesi
4. Nxenesi
5. Lenda
6. Angazhimi
7. Nota
8. Mungesa
9. NdryshimEvidence
10. Aktivitet
11. Vendim
12. KerkeseMesimdhenesi
13. KerkesaNxenesit
14. NjoftimMesimdhenesi

Janë realizuar API-të REST, relacionet ndërmjet modeleve, migrimet, validimi dhe filtrimi i të dhënave.

## Rolet dhe funksionalitetet

### Drejtori

- Regjistrimi dhe identifikimi në sistem.
- Menaxhimi i profilit.
- Shfaqja e statistikave në panelin kryesor.
- Menaxhimi i klasave.
- Menaxhimi i nxënësve.
- Menaxhimi i mësimdhënësve.
- Menaxhimi i lëndëve.
- Caktimi i angazhimeve dhe kujdestarëve.
- Kontrollimi i notave dhe mungesave.
- Menaxhimi i aktiviteteve.
- Publikimi i vendimeve dhe njoftimeve.
- Shqyrtimi i kërkesave të mësimdhënësve.
- Shfaqja e raporteve dhe statistikave.

### Mësimdhënësi

- Identifikimi dhe menaxhimi i profilit.
- Shfaqja e klasave dhe lëndëve të caktuara.
- Regjistrimi i notave për angazhimet përkatëse.
- Menaxhimi i mungesave.
- Menaxhimi i klasës kujdestare.
- Pranimi i vendimeve nga drejtori.
- Dërgimi i njoftimeve për nxënësit.
- Dërgimi i kërkesave te drejtori.
- Shqyrtimi i ankesave dhe kërkesave për leje nga nxënësit.

### Nxënësi

- Identifikimi me emër, mbiemër, ID dhe fjalëkalim.
- Shfaqja dhe ndryshimi i fotografisë së profilit.
- Shfaqja e të dhënave të klasës dhe kujdestarit.
- Shfaqja e notave sipas lëndëve.
- Shfaqja e mesatares.
- Shfaqja e mungesave dhe statuseve të tyre.
- Pranimi i njoftimeve nga drejtori dhe mësimdhënësi.
- Dërgimi i ankesave te kujdestari.
- Dërgimi i kërkesave për leje.
- Kontrollimi i statusit të kërkesave.
- Sinjalizimi i njoftimeve dhe përgjigjeve të reja.
- Largimi i njoftimeve nga pamja personale në shfletues, pa fshirjen e tyre nga databaza.

## Autentikimi dhe siguria

- Autentikimi me token.
- Ndarja e përdoruesve sipas roleve.
- Kufizimi i qasjes sipas autorizimeve.
- Validimi i të dhënave.
- Mbrojtja e fjalëkalimeve.
- Kontrollimi i fotografive gjatë ngarkimit.
- Ruajtja e historikut të ndryshimeve të evidencës.
- Përjashtimi i databazës, fotografive private dhe skedarëve sekretë nga Git.

## Dizajni dhe organizimi i frontend-it

Ndërfaqja grafike është zhvilluar me HTML, CSS dhe JavaScript.

Është përdorur një dizajn i përbashkët me ngjyrë të kaltër të errët dhe të artë.

Sistemi përmban:

- Panele të veçanta për secilin rol.
- Menu navigimi.
- Formularë për regjistrim dhe ndryshim.
- Tabela dhe statistika.
- Dritare për shfaqjen e të dhënave.
- Fotografitë e profileve.
- Numërues për njoftimet e reja.

Skedarët HTML, CSS dhe JavaScript janë organizuar veçmas, duke mundësuar mirëmbajtjen dhe zhvillimin më të lehtë të ndërfaqes.

## Integrimi i frontend-it me backend-in

Frontend-i komunikon me backend-in përmes API-ve REST.

Të dhënat e dërguara nga formularët kontrollohen në backend, përpunohen dhe ruhen në databazën SQLite.

Pas përpunimit të kërkesës, ndërfaqja përditësohet me të dhënat përkatëse.

### Rrjedha e regjistrimit të notës

1. Mësimdhënësi përzgjedh nxënësin dhe angazhimin.
2. Plotëson formularin me notën përkatëse.
3. Frontend-i dërgon kërkesën POST në API.
4. Backend-i kontrollon validimin e të dhënave dhe autorizimin.
5. Nota ruhet në databazën SQLite.
6. Regjistrohet historiku i veprimit.
7. API kthen përgjigjen HTTP 201 Created.
8. Ndërfaqja përditësohet me notën e regjistruar.
9. Nxënësi shikon notën dhe mesataren e përditësuar.
10. Drejtori kontrollon notat dhe statistikat.

Kjo rrjedhë është testuar dhe dokumentuar me fotografi reale në Raportin Teknik 3.

## Gjendjet e ndërfaqes

Gjatë zhvillimit janë trajtuar gjendjet:

- Loading State – gjatë ngarkimit të të dhënave.
- Empty State – kur nuk ka të dhëna për shfaqje.
- Error State – kur ndodh një gabim gjatë përpunimit të kërkesës.
- Success State – kur një veprim përfundon me sukses.

Këto gjendje informojnë përdoruesin për rezultatin e veprimeve të tij.

## Analiza e kodit – Code Review

Në Raportin Teknik 3 janë analizuar pjesët kryesore të kodit:

- models.py – struktura e modelit Nota.
- serializers.py – validimi i notës dhe klasës së nxënësit.
- evidenca_api.py – përpunimi i kërkesave dhe ruajtja e notave.
- evidenca_permissions.py – kontrolli i autorizimeve.
- evidenca_statistika.py – llogaritja e mesatareve dhe statistikave.

## Instalimi i projektit

Krijimi i mjedisit virtual:

    python -m venv .venv

Aktivizimi në Windows:

    .\.venv\Scripts\Activate.ps1

Instalimi i bibliotekave:

    python -m pip install -r requirements.txt

Konfiguroni variablat e nevojshme të mjedisit, përfshirë SECRET_KEY dhe kodin e sigurt të regjistrimit të drejtorit.

Kodi i regjistrimit konfigurohet përmes variablës SCHOOL_DIRECTOR_SIGNUP_CODE.

Zbatimi i migrimeve:

    python manage.py migrate

Kontrollimi i sistemit:

    python manage.py check

Nisja e serverit:

    python manage.py runserver

Sistemi hapet në adresën:

http://127.0.0.1:8000/

## Testimi

Gjatë zhvillimit janë realizuar testime manuale dhe automatike për:

- Autentikimin dhe autorizimin.
- Operacionet CRUD.
- Regjistrimin e përdoruesve.
- Menaxhimin e klasave dhe lëndëve.
- Regjistrimin e notave dhe mungesave.
- Komunikimin ndërmjet roleve.
- Dërgimin dhe pranimin e njoftimeve.
- Kërkesat për leje dhe ankesat.
- Ndryshimin e fotografive të profileve.
- Navigimin ndërmjet faqeve.

Ekzekutimi i testeve automatike:

    python manage.py test

Kontrollimi i migrimeve:

    python manage.py makemigrations --check --dry-run

### Rezultatet e testimeve për Raportin Teknik 3

| Kontrolli | Rezultati |
| --- | --- |
| Testimet manuale | 21/21 me sukses |
| Testimet automatike | 3/3 me sukses |
| Django System Check | 0 probleme |
| Kontrolli i migrimeve | Nuk ka ndryshime të pambuluara |

## Fazat e zhvillimit

### Faza 1 – Planifikimi dhe analiza

Përcaktimi i kërkesave, funksionaliteteve dhe arkitekturës së sistemit.

### Faza 2 – Databaza, Backend dhe API

Krijimi i modeleve, relacioneve, migrimeve, autentikimit dhe API-ve.

### Faza 3 – Frontend dhe integrimi

Zhvillimi i ndërfaqes grafike, krijimi i tri paneleve, integrimi me backend-in, testimi i funksionaliteteve, dokumentimi i rrjedhës dhe analiza e kodit.

### Faza 4 – Versioni beta dhe përfundimi

Testimi më i plotë i sistemit, përmirësimi i sigurisë, korrigjimi i problemeve të mundshme dhe përgatitja për publikim.

## Dokumentacioni teknik

Dokumentacioni i projektit përmban:

- Raportin Teknik 1 – Planifikimi dhe analiza.
- Raportin Teknik 2 – Databaza, backend-i dhe API-të.
- Raportin Teknik 3 – Frontend-i dhe integrimi i sistemit.

Të tre raportet janë bashkuar në një dokument.

[School Control – Raporti Teknik 1, 2 dhe 3](docs/School_Control_Raporti_Teknik.docx)

## Versionimi i projektit

Projekti është zhvilluar gradualisht dhe ndryshimet janë dokumentuar përmes commit-eve në GitHub.

Repository:

https://github.com/bekirnafezi/Bekir-Nafezi-Sistemi-per-Menaxhimin-e-Shkollave

## Statusi i projektit

Raporti Teknik 3 është përfunduar.

Funksionalitetet kryesore të tri paneleve janë realizuar, frontend-i është integruar me backend-in dhe rrjedhat kryesore janë testuar.

Projekti është i gatshëm për demonstrimin e funksionaliteteve të Raportit Teknik 3 dhe vazhdimin drejt fazës beta.

## Qëllimi përfundimtar

Qëllimi i School Control është të mundësojë menaxhimin më të organizuar të shkollave fillore dhe të lehtësojë komunikimin ndërmjet drejtorit, mësimdhënësve dhe nxënësve.
