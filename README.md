# School Control

## Sistemi per Menaxhimin e Shkollave Fillore

School Control eshte nje aplikacion per menaxhimin
digjital te shkollave fillore.

Projekti zhvillohet ne kuader te lendes
Projekt - Praktike Profesionale.

## Informacionet e projektit

Studenti: Bekir Nafezi

Profesori: Prof. Ass. Dr. Endrit Fetahi

Universiteti: Ukshin Hoti - Prizren

Viti akademik: 2026/2027

## Teknologjitë e përdorura

Për zhvillimin e projektit **School Control** janë përdorur këto teknologji:

* **Python** – Gjuha programuese për zhvillimin e sistemit.
* **Django** – Framework për ndërtimin e backend-it.
* **Django REST Framework** – Për krijimin dhe menaxhimin e API-ve REST.
* **SQLite** – Databaza për ruajtjen e të dhënave.
* **Django Token Authentication** – Për autentikimin e përdoruesve.
* **Git** – Për menaxhimin e versioneve të projektit.
* **GitHub** – Për ruajtjen e kodit dhe dokumentimin e progresit.
* **Visual Studio Code** – Mjedisi i përdorur për zhvillimin e projektit.
* **DB Browser for SQLite** – Për kontrollimin e tabelave dhe relacioneve të databazës.

### Teknologjitë e planifikuara

Në fazën e ardhshme të zhvillimit planifikohet përdorimi i:

* HTML
* CSS
* JavaScript

Këto teknologji do të përdoren për krijimin e ndërfaqes grafike të sistemit.


## Funksionalitetet e realizuara

Gjatë fazës së dytë të zhvillimit të projektit **School Control** janë realizuar funksionalitetet kryesore të backend-it.

### Menaxhimi i të dhënave

* Menaxhimi i klasave (CRUD).
* Menaxhimi i nxënësve (CRUD).
* Menaxhimi i mësimdhënësve (CRUD).
* Menaxhimi i lëndëve (CRUD).
* Menaxhimi i angazhimeve të mësimdhënësve (CRUD).
* Menaxhimi i notave të nxënësve (CRUD).
* Menaxhimi i mungesave të nxënësve (CRUD).

### Autentikimi dhe autorizimi

* Identifikimi i përdoruesve me email dhe fjalëkalim.
* Autentikimi me token.
* Përcaktimi i tri roleve: drejtor, mësimdhënës dhe nxënës.
* Kufizimi i qasjes në API-të administrative sipas rolit.
* Endpoint për marrjen e të dhënave të profilit.

### API dhe databaza

* Krijimi i 8 modeleve kryesore në Django.
* Krijimi i relacioneve ndërmjet modeleve.
* Përdorimi i databazës SQLite.
* Implementimi i 17 endpoint-eve API.
* Endpoint bazë për statistika.
* Filtrimi i notave dhe mungesave sipas nxënësit.
* Validimi i të dhënave gjatë regjistrimit dhe ndryshimit.

### Testimi dhe dokumentimi

* Testimi i operacioneve GET, POST, PATCH dhe DELETE.
* Testimi i autentikimit dhe autorizimit.
* Testimi i validimeve dhe filtrimeve.
* Kontrollimi i migrimeve të databazës.
* Dokumentimi i API-ve në dosjen `docs/`.
* Përgatitja e fotografive të databazës dhe testimeve.

## Funksionalitetet e planifikuara

Në fazën e ardhshme të projektit planifikohet:

* Krijimi i ndërfaqes grafike me HTML, CSS dhe JavaScript.
* Krijimi i faqeve të identifikimit dhe paneleve të përdoruesve.
* Lidhja e frontend-it me API-të ekzistuese.
* Zhvillimi i ndërfaqeve për drejtorin, mësimdhënësin dhe nxënësin.
* Zgjerimi i statistikave dhe paraqitja e raporteve.
* Testimi i sistemit të plotë me ndërfaqe grafike.

Këto funksionalitete do të zhvillohen në fazat e ardhshme të projektit.



## Statusi i projektit

Projekti **School Control – Sistemi për Menaxhimin e Shkollave** është në fazën e dytë të zhvillimit, e cila përfshin databazën, backend-in dhe API-të.

Deri tani janë realizuar:

* Konfigurimi i projektit me Python dhe Django.
* Krijimi i databazës SQLite.
* Krijimi i 8 modeleve kryesore dhe relacioneve ndërmjet tyre.
* Krijimi dhe zbatimi i migrimeve.
* Implementimi i autentikimit me token.
* Përcaktimi i roleve: drejtor, mësimdhënës dhe nxënës.
* Implementimi i API-ve CRUD për klasat, nxënësit, mësimdhënësit, lëndët, angazhimet, notat dhe mungesat.
* Krijimi i gjithsej 17 endpoint-eve API.
* Implementimi i validimeve dhe filtrimit të notave dhe mungesave sipas nxënësit.
* Testimi i funksionaliteteve kryesore dhe kontrollimi i autorizimit.
* Përgatitja e dokumentimit teknik në dosjen `docs/`.

**Faza aktuale:** Backend-i dhe API-të kryesore janë zhvilluar dhe testuar. Po përgatitet Raporti Teknik 2.

**Faza e ardhshme:** Zhvillimi i ndërfaqes grafike (frontend) dhe lidhja e saj me backend-in ekzistues.
