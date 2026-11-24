
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
- Menaxhimi i notave.
- Menaxhimi i mungesave.
- Menaxhimi i klasës kujdestare.
- Pranimi i vendimeve nga drejtori.
- Dërgimi i njoftimeve për nxënësit.
- Dërgimi i kërkesave te drejtori.
- Shqyrtimi i ankesave dhe kërkesave për leje nga nxënësit.

### Nxënësi

- Identifikimi me të dhënat personale, ID dhe fjalëkalim.
- Shfaqja dhe ndryshimi i fotografisë së profilit.
- Shfaqja e të dhënave të klasës dhe kujdestarit.
- Shfaqja e notave sipas lëndëve.
- Llogaritja e mesatares.
- Shfaqja e mungesave dhe statuseve të tyre.
- Pranimi i njoftimeve nga drejtori dhe mësimdhënësi.
- Dërgimi i ankesave te kujdestari.
- Dërgimi i kërkesave për leje.
- Kontrollimi i statusit të kërkesave.
- Sinjalizimi i njoftimeve dhe përgjigjeve të reja.
- Pastrimi i njoftimeve nga pamja personale në shfletues.

## Autentikimi dhe siguria

- Autentikimi me token.
- Ndarja e përdoruesve sipas roleve.
- Kufizimi i qasjes sipas autorizimeve.
- Validimi i të dhënave.
- Mbrojtja e fjalëkalimeve.
- Kontrollimi i fotografive gjatë ngarkimit.
- Përjashtimi i databazës, fotografive private dhe skedarëve sekretë nga Git.

## Dizajni i sistemit

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
- Komunikim ndërmjet frontend-it dhe backend-it përmes API-ve.

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

    python manage.py test shkolla.test_teacher_notices

Tri testet automatike të njoftimeve kanë kaluar me sukses.

## Fazat e zhvillimit

### Faza 1 – Planifikimi dhe analiza

Përcaktimi i kërkesave, funksionaliteteve dhe arkitekturës së sistemit.

### Faza 2 – Databaza, Backend dhe API

Krijimi i modeleve, relacioneve, migrimeve, autentikimit dhe API-ve.

### Faza 3 – Frontend dhe integrimi

Zhvillimi i ndërfaqes grafike, krijimi i tri paneleve, integrimi me backend-in dhe testimi i funksionaliteteve.

## Statusi i projektit

Funksionalitetet kryesore të tri paneleve janë realizuar dhe sistemi është në fazën e kontrollit përfundimtar dhe dokumentimit teknik.

Dokumentimi i projektit ruhet në dosjen docs/.

## Qëllimi përfundimtar

Qëllimi i School Control është të mundësojë menaxhimin më të organizuar të shkollave fillore dhe të lehtësojë komunikimin ndërmjet drejtorit, mësimdhënësve dhe nxënësve.
