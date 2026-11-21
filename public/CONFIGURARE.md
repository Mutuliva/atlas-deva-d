# Atlas Deva — activare și operare

Aplicația existentă React 19 + TypeScript + Vite, harta SVG georeferențiată, filtrele, cartierele și colecția de favorite au fost păstrate. Ghidul și directorul folosesc aceleași obiecte și coordonate ca harta. Compilarea produce în continuare `dist/index.html` și resursele Vite.

## Ce funcționează fără conturi externe

Hartă, 12 cartiere, patru perimetre PUZ, căutare globală, pagini individuale, imagini locale, favorite, teme, fișele afacerilor, selecția evenimentelor și rutarea pietonală din rețeaua locală OSM. Favoritelor li s-a păstrat cheia de stocare originală. Localizarea este cerută numai după acord, procesată în memorie și nu ajunge la API-ul Atlas. Linkurile către Google Maps și sursele originale deschid servicii externe.

- **Vreme**: Open-Meteo, coordonatele Devei, fără cheie în configurația publică pentru uz necomercial. Actualizare la deschidere și la 15 minute; ultima valoare cunoscută poartă data sursei, nu ora accesării. Pentru utilizare comercială, verificați condițiile Open-Meteo și contractați serviciul corespunzător. Nu există senzori locali proprii.
- **Live**: evenimentele și comunicatele sunt selecții editoriale reale, cu surse și date. Intervalele expirate nu sunt prezentate drept restricții active. Nu există feed de congestie sau monitorizare a traficului. Eventualele modificări/cancelări se verifică la organizator.
- **Trasee**: algoritm Dijkstra pe un graf local OSM, fără picioare private sau acces explicit interzis. Distanțele folosesc rețeaua. Timpurile de mers sunt estimative, nu includ panta sau opririle. Nu se unesc arbitrar locuri neconectate. Pădurea Bejan are un punct reprezentativ, nu o intrare confirmată. Nu se oferă rutare către acest punct.
- **Fotografii**: documentarea și licențele Commons sunt în „Despre atlas”. Fotografiile de prezentare ale operatorilor au surse proprii în fișe; confirmați drepturile cu operatorul înaintea reutilizării comerciale. Când nu există fotografie verificată se folosește o hartă etichetată, nu o fotografie generică de restaurant.

## Activarea publicării în producție

1. Într-o bază Redis persistentă din Upstash, obțineți URL-ul REST HTTPS și tokenul cu drept de scriere. Nu folosiți un token read-only. Păstrați baza separată de alte aplicații și activați backup conform politicii operatorului.
2. În Project Settings → Environment Variables configurați pe server: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `ATLAS_ADMIN_USER`, `ATLAS_ADMIN_HASH`, și preferabil `ATLAS_ORIGIN` (originea HTTPS efectivă, fără slash final). Nu expuneți secretele prin `VITE_` sau `NEXT_PUBLIC_`.
3. Generează hashul local, fără parolă în istoric sau în cod:

```sh
read -rs -p 'Parolă administrator (minimum 14 caractere): ' ATLAS_PASSWORD; echo
printf '%s' "$ATLAS_PASSWORD" | node scripts/admin-hash.mjs
unset ATLAS_PASSWORD
```

4. Reimplementați proiectul. Vercel rulează `api/atlas.mjs`; `sharp` verifică, micșorează și recodifică imaginile, eliminând metadatele. `vercel.json` păstrează rutele de pagină și nu rescrie cererile API. Folosiți HTTPS.
5. Accesați `/administrare`. Nu există „admin/admin”, cont demonstrativ sau autentificare în localStorage. Introducerea datelor de acces corecte creează o sesiune opacă pe server, de două ore. Cookie `__Host-` Secure + HttpOnly + SameSite=Strict. Fiecare operație privată verifică sesiunea și rolul pe server; scrierile verifică și originea, tipul conținutului și tokenul CSRF. Autentificarea și sesizările au limitare de frecvență.
6. Administratorul poate crea, modifica și retrage orice locație/afacere (inclusiv din catalogul inițial), publica sau retrage evenimente, încărca fotografii și modera sesizări. Datele administrate se suprapun peste catalogul de bază, iar retragerile persistă prin tombstone. Modificările sunt vizibile după salvare în sesiunea administratorului și la reîncărcarea celorlalte browsere.

**În lipsa configurării**, rutele administrative rămân închise; contribuțiile pot fi salvate ca schițe private pe dispozitiv sau exportate. Nu se afișează vreo confirmare falsă de trimitere. Linkul Deva24 trimite la serviciul oficial, independent de Atlas. Contribuțiile primite de Atlas nu constituie petiții oficial înregistrate. Nu solicitați CNP, adrese personale sau imagini cu persoane identificabile. Stabiliți operatorul, politica de retenție și regulile de moderare înainte de deschiderea publică.

## Teste și dezvoltare locală

`npm ci`, `npm run lint`, `npm run build`. Testele funcționale folosesc Chromium/Playwright cu resursele din `dist/`; nu pornesc servicii persistente și nu modifică datele de producție. Testele backend utilizează SQLite temporar și credențiale efemere generate la fiecare execuție, care nu sunt distribuite în aplicație.

```sh
node --test scripts/api.test.mjs
python scripts/check_app.py
python scripts/check_platform.py
```

Pentru un mediu privat self-hosted, handlerul Node acceptă și `ATLAS_SQLITE_PATH`, pe Node >=22.13, cu director persistent și acces restricționat. Această cale este dezactivată pe Vercel: discul efemer nu este prezentat drept stocare durabilă. Vite singur nu rulează funcția Vercel; pentru integrarea locală utilizați un adaptor Node sau Vercel CLI cu backend-ul Redis configurat. Nu copiați fișierele `.env` în `public/`.
