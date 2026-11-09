# School Control

## Sistemi për Menaxhimin e Shkollave Fillore

**School Control** është një aplikacion për menaxhimin digjital të shkollave fillore.

Qëllimi i projektit është të lehtësojë menaxhimin e të dhënave të shkollës, duke përfshirë klasat, nxënësit, mësimdhënësit, lëndët, angazhimet, notat dhe mungesat.

Projekti zhvillohet në kuadër të lëndës **Projekt – Praktikë Profesionale**.

## Informacionet e projektit

- **Studenti:** Bekir Nafezi
- **Profesori:** Prof. Ass. Dr. Endrit Fetahi
- **Universiteti:** Universiteti "Ukshin Hoti" – Prizren
- **Viti akademik:** 2026/2027
- **Emri i projektit:** School Control

## Teknologjitë e përdorura

Për zhvillimin e projektit janë përdorur këto teknologji:

- **Python** – Gjuha programuese për zhvillimin e sistemit.
- **Django** – Framework për ndërtimin e backend-it.
- **Django REST Framework** – Për krijimin dhe menaxhimin e API-ve REST.
- **SQLite** – Databaza për ruajtjen e të dhënave.
- **Django Token Authentication** – Për autentikimin e përdoruesve.
- **HTML** – Për ndërtimin e strukturës së faqeve.
- **CSS** – Për dizajnin dhe paraqitjen vizuale.
- **JavaScript** – Për funksionalitetet interaktive dhe komunikimin me API.
- **Git** – Për menaxhimin e versioneve të projektit.
- **GitHub** – Për ruajtjen e kodit dhe dokumentimin e progresit.
- **Visual Studio Code** – Mjedisi i zhvillimit të projektit.
- **DB Browser for SQLite** – Për kontrollimin e databazës dhe relacioneve.

## Funksionalitetet e realizuara

Projekti është zhvilluar në disa faza, duke filluar nga planifikimi, krijimi i databazës dhe backend-it, deri te ndërtimi i ndërfaqes grafike.

### 1. Backend dhe databaza

Janë krijuar 8 modele kryesore:

1. Perdorues
2. Klasa
3. Mesimdhenesi
4. Nxenesi
5. Lenda
6. Angazhimi
7. Nota
8. Mungesa

Janë realizuar:

- Krijimi i modeleve dhe relacioneve ndërmjet tyre.
- Krijimi dhe zbatimi i migrimeve të databazës.
- Menaxhimi i klasave (CRUD).
- Menaxhimi i nxënësve (CRUD).
- Menaxhimi i mësimdhënësve (CRUD).
- Menaxhimi i lëndëve (CRUD).
- Menaxhimi i angazhimeve (CRUD).
- Menaxhimi i notave (CRUD).
- Menaxhimi i mungesave (CRUD).
- Implementimi i API-ve REST.
- Validimi dhe filtrimi i të dhënave.
- Krijimi i endpoint-it bazë për statistika.

Gjatë fazës së backend-it janë dokumentuar gjithsej **17 endpoint-e API**.

### 2. Autentikimi dhe autorizimi

Janë implementuar:

- Identifikimi i përdoruesve me email dhe fjalëkalim.
- Autentikimi me token.
- Përcaktimi i tri roleve: drejtor, mësimdhënës dhe nxënës.
- Kufizimi i qasjes në API sipas rolit të përdoruesit.
- Marrja e të dhënave të profilit të përdoruesit.

### 3. Ndërfaqja grafike – Frontend

Në fazën e tretë të zhvillimit ka filluar realizimi i ndërfaqes grafike me HTML, CSS dhe JavaScript.

Deri tani janë krijuar këto faqe:

**Faqja e identifikimit (Login)**

- Formulari për identifikimin e përdoruesit.
- Lidhja me sistemin e autentikimit.
- Përdorimi i token-it për komunikim me API.

**Dashboard**

- Paneli kryesor i sistemit.
- Paraqitja e informacioneve dhe statistikave kryesore.
- Menuja anësore për navigim ndërmjet moduleve.

**Menaxhimi i Klasave**

- Shfaqja e klasave.
- Regjistrimi i klasave të reja.
- Ndryshimi i të dhënave të klasave.
- Fshirja e klasave sipas kufizimeve të sistemit.

**Menaxhimi i Nxënësve**

- Regjistrimi i nxënësve të rinj.
- Shfaqja e nxënësve të regjistruar.
- Kërkimi i shpejtë.
- Lista e plotë me ndarje në faqe.
- Ndryshimi i klasës së nxënësit.
- Fshirja e nxënësve.

**Menaxhimi i Mësimdhënësve**

- Regjistrimi i mësimdhënësve.
- Shfaqja dhe kërkimi i mësimdhënësve.
- Lista e plotë me ndarje në faqe.
- Ndryshimi i të dhënave të mësimdhënësve.
- Fshirja me kontroll të lidhjeve ekzistuese.

**Menaxhimi i Lëndëve**

- Regjistrimi i lëndëve të reja.
- Shfaqja e lëndëve nga databaza.
- Kërkimi i shpejtë.
- Lista e plotë me ndarje në faqe.
- Ndryshimi i emrit të lëndës.
- Fshirja e lëndëve.
- Mbrojtja nga fshirja e lëndëve që kanë angazhime të lidhura.

### 4. Dizajni dhe navigimi

Ndërfaqja grafike është krijuar me një dizajn të përbashkët për modulet e sistemit.

Janë realizuar:

- Menuja anësore e navigimit.
- Përdorimi i ngjyrave dhe elementeve të njëjta në faqe.
- Tabelat për shfaqjen e të dhënave.
- Formularët për regjistrim dhe ndryshim.
- Dritaret për shfaqjen e listave të plota.
- Kërkimi i të dhënave pa rifreskim të faqes.
- Lidhja e faqeve kryesore me njëra-tjetrën.

## Testimi dhe dokumentimi

Gjatë zhvillimit janë kryer testime për të kontrolluar funksionimin e sistemit.

Deri tani janë realizuar:

- Testimi i operacioneve GET, POST, PATCH dhe DELETE.
- Testimi i autentikimit dhe autorizimit.
- Testimi i validimeve të të dhënave.
- Kontrollimi i migrimeve të databazës.
- Testimi i regjistrimit dhe ndryshimit të të dhënave.
- Testimi i kërkimit dhe shfaqjes së listave.
- Testimi i fshirjes dhe i kufizimeve për të dhënat e lidhura.
- Kontrollimi i navigimit ndërmjet faqeve.
- Dokumentimi teknik në dosjen `docs/`.

## Funksionalitetet në zhvillim

Në vazhdim të fazës së tretë planifikohet:

- Ndërtimi i ndërfaqes për menaxhimin e angazhimeve.
- Ndërtimi i ndërfaqes për menaxhimin e notave.
- Ndërtimi i ndërfaqes për menaxhimin e mungesave.
- Zhvillimi i faqeve të përshtatura për mësimdhënësit dhe nxënësit.
- Përmirësimi i statistikave dhe raporteve.
- Testimi i plotë i sistemit përmes ndërfaqes grafike.
- Përmirësimi i dizajnit dhe funksionaliteteve sipas nevojës.

## Statusi i projektit

Projekti **School Control – Sistemi për Menaxhimin e Shkollave Fillore** është aktualisht në **fazën e tretë të zhvillimit**.

**Faza 1 – Planifikimi dhe analiza**

Janë përcaktuar kërkesat, funksionalitetet dhe struktura e përgjithshme e sistemit.

**Faza 2 – Databaza, Backend dhe API**

Janë zhvilluar modelet, databaza, autentikimi, autorizimi dhe API-të kryesore të sistemit.

**Faza 3 – Frontend dhe integrimi**

Është krijuar ndërfaqja grafike dhe ka filluar lidhja e faqeve me API-të ekzistuese.

Deri tani janë realizuar faqet Login, Dashboard, Klasat, Nxënësit, Mësimdhënësit dhe Lëndët.

Zhvillimi vazhdon me modulet e tjera të sistemit.

## Qëllimi përfundimtar

Qëllimi është krijimi i një sistemi funksional dhe të lehtë për përdorim, i cili mundëson menaxhimin më të organizuar të informacioneve të shkollës.

Projekti zhvillohet gradualisht, me testime dhe përditësime të rregullta në GitHub.