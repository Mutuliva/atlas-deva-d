# Deva · Atlas local

Un atlas interactiv în limba română, construit cu React, TypeScript și Vite. Harta folosește geometrie geografică reală și relief local, fără chei API sau solicitări către un furnizor de hărți la rulare.

## Funcționalități

- **Ghiduri locale**: opt fișe documentate despre satele Devei, minerit, cariera romană de la Uroi, situl Micia, parcuri și primar. Fișele au filtre, căutare, referințe per capitol, fotografii atribuite, listă privată de lecturi și tipărire. Reperele regionale nu sunt plasate artificial pe planșa urbană.
- **Arhivă cartografică**: planșa 183 a ridicării iosefine a Transilvaniei (1769–1773), Österreichisches Staatsarchiv, Kriegsarchiv, B IX 715, domeniu public. Reproducerea locală, cu zoom și deplasare, se deschide opțional din Ghiduri sau din Straturi. Nu este o suprapunere georeferențiată. Originalul și metadatele sunt indicate în cititor.
- Directorul include zece magazine suplimentare, cu referințe la obiectele OSM și imagini cartografice centrate pe pozițiile lor. Datele consemnate nu reprezintă statut de funcționare în timp real.
- Portalul **Atlas Deva** extinde aceeași aplicație, fără înlocuirea hărții. Navigație adaptivă, temă luminoasă/întunecată, fotografii autentice, căutare globală și linkuri individuale pentru locuri și afaceri.
- **Explorează**, **Deva Business**, **Deva Live** și **Vocea comunității** folosesc catalogul comun. Vremea are actualizare Open-Meteo și stare explicită la indisponibilitate; agenda și anunțurile prezintă sursa și data.
- **Trasee personalizate** calculate local pe o rețea pietonală OSM, cu reordonarea opririlor, lungime, durată estimativă și afișare pe hartă. Geolocalizare opțională, solicitată numai după acord.
- **Administrare și moderare** prin handlerul server-side `api/atlas.mjs`, sesiuni revocabile, autorizare, validare de date și fotografii. Cerințele de activare, sursele și limitările sunt documentate în `CONFIGURARE.md` și `.env.example`. În lipsa stocării și a contului configurat, aplicația nu pretinde că a primit sau publicat contribuții.
- Hartă deplasabilă, zoom la cursor, gesturi cu două degete și comenzi din tastatură.
- Repere turistice, naturale și comerciale, cu fotografii sau extrase cartografice locale. Denumirile „Dealul 1000” și „La 700” sunt indexate fără coordonate neconfirmate.
- Cartiere selectabile; conturul roșu reproduce numai perimetrul documentat în planșa PUZ citată. Nodurile OSM de cartier nu sunt transformate în limite fictive.
- Populație și dotări cu surse; estimările de proiect sunt distincte de datele de recensământ. Nu se atribuie reputații fără dovezi.
- Zoom continuu până la 10×, încadrare automată a selecției, scară metrică și numere de clădiri la detaliu.
- Căutare tolerantă la diacritice și categorii pentru patrimoniu, natură, comerț, gastronomie, cazare, servicii și instituții.
- Colecție de locuri salvate în `localStorage`.
- Stil topografic sau stradal, denumiri opționale și legendă.
- Interfață adaptată telefonului, ferestre de detalii accesibile și suport pentru mișcare redusă.

## Verificare și compilare

```sh
npm install
npm run lint
npm run build
```

`dist/` păstrează formatul static Vite și `index.html`; secțiunile principale au metadate SEO proprii. Pe Vercel, API-ul de publicare se implementează alături de fișierele statice. `npm run test:api`, `python scripts/check_app.py` și `python scripts/check_platform.py` verifică fluxurile în date temporare izolate. Niciun test nu scrie în producție.

## Organizare

- `src/lib/places.ts`: repere, coordonate, descrieri și categorii.
- `src/lib/field-guides.ts`: texte editoriale, surse, date de documentare și credite fotografice; `scripts/check_field_guides.py` verifică noile fluxuri pe buildul de producție.
- `src/components/AtlasMap.tsx`: camera, gesturile, straturile și marcajele.
- `src/components/Dialogs.tsx`: fișele reperelor, ghidul de utilizare și creditele.
- `public/map/`: straturile cartografice SVG și texturile locale.
- `public/images/`: fotografii WebP și miniaturi optimizate.
- `scripts/build_atlas.py`: prelucrarea datelor cartografice sursă. Nu este necesară la compilare; straturile generate sunt incluse.

## Surse

Datele geografice provin de la contribuitorii OpenStreetMap (ODbL), prin OpenFreeMap. Relieful și curbele de nivel sunt calculate din AWS Terrain Tiles, format Terrarium. Harta este o planșă Web Mercator de 5120 × 5120 unități, cu originea în dala 9232/5834 la nivelul 14.

Fotografiile provin din Wikimedia Commons. Autorii, licențele și fișierele originale sunt indicate în **Despre ghid → Surse și credite**. Fonturile DM Sans și Lora sunt servite local; licențele SIL Open Font License sunt incluse în `public/fonts/licenses/`.

Atlasul este destinat explorării turistice, nu navigației în timp real.
