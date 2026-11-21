/* Editorial records are deliberately separate from the city map: a regional site is not a city POI. */
export const fieldEdition = '19 noiembrie 2026'
export const archive = {
  id: 'harta-iosefina',
  title: 'Deva pe harta iosefină',
  period: '1769–1773',
  sheet: '183',
  image: '/images/field/old-map.webp',
  preview: '/images/field/old-map-preview.webp',
  institution: 'Österreichisches Staatsarchiv · Kriegsarchiv',
  reference: 'B IX 715',
  source: 'https://commons.wikimedia.org/wiki/File:Josephinische_Landaufnahme_pg183.jpg',
  original: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Josephinische_Landaufnahme_pg183.jpg',
  description:
    'Planșa 183 din prima ridicare militară a Transilvaniei arată Deva la poalele dealului cetății. Urmărește meandrele Mureșului, drumurile și așezările desenate între 1769 și 1773.',
}
export type FieldTopic = 'Sate' | 'Arheologie' | 'Minerit' | 'Cariere' | 'Parcuri' | 'Viață civică'
export interface Reference {
  label: string
  url: string
}
export interface FieldGuide {
  id: string
  title: string
  topics: FieldTopic[]
  region: string
  intro: string
  photo: { src: string; caption: string; author: string; license: string; url: string }
  sections: { title: string; text: string; refs: number[] }[]
  note: string
  sources: Reference[]
  related?: { label: string; to: string }[]
  // Only a representative location, never a verified entrance, access route or exact legal perimeter.
  reference?: { lat: number; lon: number; label: string }
}
const wiki = (page: string) =>
  'https://ro.wikipedia.org/wiki/' + encodeURIComponent(page.replaceAll(' ', '_'))
const commons = (page: string) =>
  'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(page.replaceAll(' ', '_'))
const photo = (id: string, caption: string, author: string, file: string, license = 'CC BY-SA 3.0') => ({
  src: '/images/field/' + id + '.webp',
  caption,
  author,
  license,
  url: commons(file),
})
export const fieldGuides: FieldGuide[] = [
  {
    id: 'micia',
    title: 'Micia, pe frontiera Daciei romane',
    topics: ['Arheologie'],
    region: 'Vețel · valea Mureșului',
    intro:
      'La vest de Deva, lângă Vețel, un castru, terme și un amfiteatru spun povestea unei așezări aflate între viața militară și cea civilă.',
    photo: photo(
      'micia',
      'Vestigii ale sitului Micia, fotografiate în 2014.',
      'Saturnian',
      'Castra Micia 043.jpg',
    ),
    sections: [
      {
        title: 'Un castru și o comunitate',
        text: 'Micia se afla pe malul stâng al Mureșului. În jurul fortificației s-a dezvoltat o așezare civilă cu edificii publice și private. Termenul latin „pagus” descrie statutul ei: amploarea construcțiilor nu însemna automat statut de oraș roman.',
        refs: [1, 2],
      },
      {
        title: 'Cum citești vestigiile',
        text: 'Castrul ține de prezența armatei, termele de viața cotidiană, iar amfiteatrul de întâlnirile și spectacolele comunității. Fișa RAN inventariază aceste componente separat. Identificarea arheologică a unui edificiu nu garantează că zidurile lui sunt vizibile sau accesibile astăzi.',
        refs: [1],
      },
      {
        title: 'Pregătește vizita',
        text: 'Citește mai întâi fișa sitului, cod RAN 91991.01. Pentru interpretarea descoperirilor din ținutul hunedorean, poți completa excursia cu o vizită la Muzeul Civilizației Dacice și Romane din Deva.',
        refs: [1, 3],
      },
    ],
    reference: { lat: 45.9145944, lon: 22.8149056, label: 'Micia · reper general al sitului' },
    note: 'Fișa RAN documentează patrimoniul, nu un program turistic. Confirmă accesul înainte de plecare; nu intra în sectoare de cercetare sau pe proprietăți închise.',
    sources: [
      {
        label: 'Institutul Național al Patrimoniului · RAN 91991.01',
        url: 'https://ran.cimec.ro/sel.asp?codran=91991.01',
      },
      { label: 'Castrul roman Micia · context și coordonate', url: wiki('Castrul roman Micia') },
      { label: 'Muzeul Civilizației Dacice și Romane', url: 'https://mcdr.ro/' },
    ],
    related: [
      { label: 'Palatul Magna Curia', to: '/loc/magna-curia' },
      { label: 'Cariera romană de la Uroi', to: '/ghiduri/magura-uroiului' },
    ],
  },
  {
    id: 'satele-devei',
    title: 'Archia, Cristur și Bârcea Mică',
    topics: ['Sate'],
    region: 'Satele municipiului Deva',
    intro:
      'Dincolo de orașul compact, Deva cuprinde și trei sate. O lectură a peisajului local prin așezări, nume și patrimoniu rural.',
    photo: photo(
      'archia',
      'Vedere din satul Archia, 2009; imagine de documentare, nu vedere în timp real.',
      'Oguszt',
      'Arki.jpg',
    ),
    sections: [
      {
        title: 'Archia · aproape de oraș',
        text: 'Archia este un sat aparținător al municipiului, la sud de centrul Devei. Privește-l ca pe o așezare distinctă, nu ca pe un cartier urban. Articolul localității și planșa iosefină permit o comparație între peisajul rural de astăzi și reprezentarea istorică.',
        refs: [1, 2, 5],
      },
      {
        title: 'Cristur · memoria satului',
        text: 'Cristur apare și sub denumirea maghiară Csernakeresztúr. Patrimoniul său este reflectat de bisericile catolică, reformată și ortodoxă. O fotografie documentară din 2009 înfățișează muzeul local ceangăiesc; imaginea nu confirmă un program de vizitare actual.',
        refs: [3, 6],
      },
      {
        title: 'Bârcea Mică · pe valea Cernei',
        text: 'Pe direcția Deva–Hunedoara, Bârcea Mică se întinde dinspre valea Cernei către dealuri. Reperul de patrimoniu menționat în descrierea localității este conacul Acațiu Barcsay, datat în secolul al XVIII-lea. Nu presupunem acces în interior.',
        refs: [4],
      },
    ],
    note: 'Sântuhalm este localitate componentă a Devei, nu unul dintre cele trei sate de mai sus. Nicio limită de sat nu este dedusă din numele ori din poziția lui.',
    sources: [
      { label: 'Deva · componența administrativă', url: wiki('Deva') },
      { label: 'Archia · localitate și repere geografice', url: wiki('Archia, Hunedoara') },
      { label: 'Cristur · denumiri și patrimoniu', url: wiki('Cristur, Hunedoara') },
      { label: 'Bârcea Mică · așezare și monumente', url: wiki('Bârcea Mică, Hunedoara') },
      { label: 'Planșa iosefină 183 · fișa originală', url: archive.source },
      {
        label: 'Muzeul local din Cristur · document fotografic',
        url: commons('Falumuzeum csernakeresztur.jpg'),
      },
    ],
    related: [
      { label: 'Consultă planșa din 1769–1773', to: '/ghiduri/harta-iosefina' },
      { label: 'Muncelu Mic, sat minier', to: '/ghiduri/muncelu-mic' },
    ],
  },
  {
    id: 'magura-uroiului',
    title: 'Andezitul și cariera de la Uroi',
    topics: ['Cariere', 'Arheologie'],
    region: 'Uroi – Rapoltu Mare',
    intro:
      'Un deal vulcanic deasupra Mureșului păstrează atât istoria rocii, cât și urmele celor care au exploatat-o în epoca romană.',
    photo: photo(
      'uroi',
      'Măgura Uroiului: vedere de ansamblu a dealului, nu a unui front de lucru.',
      'Eduard Schuster',
      'Măgura Uroiului.jpg',
      'CC0',
    ),
    sections: [
      {
        title: 'Peisajul vulcanic',
        text: 'Măgura Uroiului este o rezervație geologică, pe teritoriul orașului Simeria și al comunei Rapoltu Mare. Andezitele și breciile păstrează urmele vechii activități vulcanice. Silueta dealului este reperul vizual al acestei excursii.',
        refs: [1],
      },
      {
        title: 'O carieră din epoca romană',
        text: 'Repertoriul Arheologic Național consemnează aici o carieră de piatră din secolele II–III d.Hr. Se extrăgea andezit vinețiu. Fronturile de exploatare și piesele rămase în curs de prelucrare sunt mărturii ale lucrului în piatră, nu amenajări pentru vizitatori.',
        refs: [2],
      },
      {
        title: 'Mai mult decât o singură epocă',
        text: 'Pe terasele dintre Uroi și Rapoltu Mare au fost documentate locuiri din perioade diferite, inclusiv Hallstatt și La Tène. Fișa RAN 87736.01 separă așezările, necropolele și cariera; denumirea dealului nu desemnează un singur monument.',
        refs: [2],
      },
    ],
    reference: { lat: 45.86194, lon: 23.04361, label: 'Măgura Uroiului · reper al rezervației' },
    note: 'Reperul indică dealul, nu intrarea în carieră. Respectă regimul de protecție; nu desprinde și nu colecta roci sau obiecte arheologice.',
    sources: [
      { label: 'Măgura Uroiului · geologie și coordonate', url: wiki('Măgura Uroiului') },
      {
        label: 'Institutul Național al Patrimoniului · RAN 87736.01',
        url: 'https://ran.cimec.ro/sel.asp?codran=87736.01',
      },
    ],
    related: [
      { label: 'Arboretumul din Simeria', to: '/ghiduri/arboretum-simeria' },
      { label: 'Micia romană', to: '/ghiduri/micia' },
    ],
  },
  {
    id: 'minele-de-arama',
    title: 'Minele de aramă ale Devei',
    topics: ['Minerit'],
    region: 'Deva · istorie industrială',
    intro:
      'O mărturie din secolul al XVIII-lea vorbește despre exploatarea cuprului la Deva. Locul exact al minei descrise rămâne o întrebare deschisă.',
    photo: {
      src: archive.preview,
      caption: 'Detaliu cartografic al Devei din aceeași epocă. Nu este un plan al minelor.',
      author: archive.institution,
      license: 'Domeniu public',
      url: archive.source,
    },
    sections: [
      {
        title: 'O vizită din 1770',
        text: 'Istoricul local al exploatărilor amintește vizita mineralogului Ignaz von Born în 1770 și relatarea publicată în 1774. Mărturia privește mineritul cuprifer; nu dovedește existența unei mine turistice amenajate.',
        refs: [1],
      },
      {
        title: 'Valea Aramei sau Valea Crăiesei?',
        text: 'Sursa prezintă două identificări posibile, legate de Valea Aramei și Valea Crăiesei. Tocmai această incertitudine este importantă: nu transformăm o ipoteză istorică într-un marcaj precis pe hartă.',
        refs: [1],
      },
      {
        title: 'Unde poți continua lectura',
        text: 'Pentru a vedea ce însemna prelucrarea minereurilor în regiune, Muzeul Aurului din Brad oferă un context muzeal: minerale, unelte și documente fotografice despre extracție. Este o alternativă la explorarea unor galerii neamenajate.',
        refs: [2],
      },
    ],
    note: 'Patrimoniu industrial, nu traseu subteran. Atlasul nu indică intrări în galerii și nu confirmă accesul în perimetre miniere.',
    sources: [
      {
        label: 'Ziarul Hunedoreanului · „Mina de aramă a Devei”, 13.03.2016',
        url: 'https://www.zhd.ro/evenimente/istorii-uitate-mina-de-arama-a-devei/',
      },
      {
        label: 'Deva City · Muzeul Aurului din Brad',
        url: 'https://devacity.ro/guide/index.php/obiective-turistice-deva/43-imprejurimi-muzee-si-case-memoriale/317-muzeul-aurului-brad',
      },
    ],
    related: [
      { label: 'Muncelu Mic și memoria mineritului', to: '/ghiduri/muncelu-mic' },
      { label: 'Harta contemporană mărturiei', to: '/ghiduri/harta-iosefina' },
    ],
  },
  {
    id: 'muncelu-mic',
    title: 'Muncelu Mic, un sat minier',
    topics: ['Minerit', 'Sate'],
    region: 'Comuna Vețel · Ținutul Pădurenilor',
    intro:
      'La Muncelu Mic, istoria exploatării minereurilor neferoase se citește prin povestea unei comunități de munte.',
    photo: photo(
      'muncelu',
      'Biserica de lemn „Cuvioasa Paraschiva” din Muncelu Mic, septembrie 2010.',
      'Țetcu Mircea Rareș',
      'RO HD Muncelu Mic 32.jpg',
    ),
    sections: [
      {
        title: 'Sat de culme, fostă colonie minieră',
        text: 'Muncelu Mic aparține comunei Vețel, nu municipiului Deva. Exploatarea de aici a avut ca obiect minereuri neferoase, între care cele de cupru, zinc și plumb. Închiderea minei în 1998 a schimbat viața așezării.',
        refs: [1],
      },
      {
        title: 'Un reper din viața satului',
        text: 'Biserica de lemn „Cuvioasa Paraschiva” oferă un alt punct de lectură a așezării, dincolo de istoria industrială. Fotografia documentează lăcașul în 2010; nu este o imagine a minei sau o confirmare a stării actuale.',
        refs: [2],
      },
    ],
    reference: { lat: 45.84694, lon: 22.73194, label: 'Muncelu Mic · centrul de referință al satului' },
    note: 'Consultă condițiile de drum înainte de deplasare. Nu recomandăm vizitarea galeriilor, a haldelor ori a instalațiilor industriale abandonate.',
    sources: [
      { label: 'Muncelu Mic · localizare și istoria exploatării', url: wiki('Muncelu Mic, Hunedoara') },
      {
        label: 'Wikimedia Commons · biserica de lemn, document fotografic',
        url: commons('RO HD Muncelu Mic 32.jpg'),
      },
    ],
    related: [{ label: 'Minele de aramă ale Devei', to: '/ghiduri/minele-de-arama' }],
  },
  {
    id: 'arboretum-simeria',
    title: 'O plimbare în Arboretumul Simeria',
    topics: ['Parcuri'],
    region: 'Simeria · parc dendrologic',
    intro:
      'Dincolo de Deva, o colecție de arbori și arbuști transformă parcul de la Simeria într-o lecție de botanică în aer liber.',
    photo: photo(
      'simeria',
      'Peisaj din Arboretumul Simeria, aprilie 2013.',
      'Marian Lucian',
      'Peisaj in Arboretum Simeria.jpg',
    ),
    sections: [
      {
        title: 'Ce este un arboretum?',
        text: 'Spre deosebire de un parc urban obișnuit, arboretumul reunește o colecție de plante lemnoase. La Simeria, specii autohtone și exotice fac parte dintr-o rezervație cu caracter dendrologic și peisagistic.',
        refs: [1],
      },
      {
        title: 'Cum să privești colecția',
        text: 'Alege o plimbare lentă și compară siluetele arborilor, textura scoarței și forma frunzelor. Consultă etichetele botanice acolo unde sunt prezente. Fotografia din ghid surprinde primăvara, nu condițiile din ziua vizitei.',
        refs: [1, 2],
      },
      {
        title: 'Dincolo de aleile parcului',
        text: 'În aceeași zonă a văii Mureșului, Măgura Uroiului oferă un contrast geologic: aici atenția se mută de la colecțiile vegetale la rocă și la urmele exploatării romane. Sunt două opriri distincte, nu un traseu pietonal verificat între ele.',
        refs: [1, 3],
      },
    ],
    reference: {
      lat: 45.86,
      lon: 23.01472,
      label: 'Arboretumul Simeria · reper general, nu poartă de acces',
    },
    note: 'Arboretumul este în Simeria, nu în Deva. Programul, tariful și condițiile de acces trebuie verificate înaintea vizitei; nu sunt confirmate în această fișă.',
    sources: [
      { label: 'Arboretumul Simeria · istoric, statut și coordonate', url: wiki('Arboretumul Simeria') },
      {
        label: 'Peisaj în Arboretum · fotografia originală',
        url: commons('Peisaj in Arboretum Simeria.jpg'),
      },
      { label: 'RAN · situl de la Măgura Uroiului', url: 'https://ran.cimec.ro/sel.asp?codran=87736.01' },
    ],
    related: [
      { label: 'Parcurile Devei', to: '/ghiduri/parcurile-devei' },
      { label: 'Piatra de la Uroi', to: '/ghiduri/magura-uroiului' },
    ],
  },
  {
    id: 'parcurile-devei',
    title: 'Trei parcuri, trei feluri de plimbare',
    topics: ['Parcuri'],
    region: 'Deva · ghid de plimbare',
    intro:
      'Parcul Cetății, Parcul Operei și Parcul Bejan sunt trei repere diferite ale orașului. Alege o oprire în funcție de zona pe care o explorezi.',
    photo: {
      src: '/images/park.webp',
      caption: 'Parcul Cetății din Deva.',
      author: 'Carmen buzan',
      license: 'CC BY-SA 3.0 RO',
      url: commons('Parcul Cetatii Deva.JPG'),
    },
    sections: [
      {
        title: 'Parcul Cetății · patrimoniu',
        text: 'La poalele dealului, aleile parcului sunt un popas între cetate și centrul vechi. Le poți asocia cu o oprire la Magna Curia; în atlas, palatul și parcul au fișe distincte.',
        refs: [1, 4],
      },
      {
        title: 'Parcul Operei · o pauză în centru',
        text: 'Parcul din zona Pieței I.C. Brătianu este cartografiat separat de Parcul Cetății. Folosește fișa acestui reper ca punct de plecare pentru o plimbare în centrul Devei.',
        refs: [2],
      },
      {
        title: 'Parcul Bejan · la sud de centru',
        text: 'Parcul urban Bejan nu este același loc cu rezervația forestieră Pădurea Bejan. Pentru o întâlnire în parc alege marcajul parcului, nu punctul reprezentativ din interiorul pădurii.',
        refs: [3, 5],
      },
    ],
    note: 'Poți adăuga oricare dintre cele trei parcuri în „Traseele mele”. Lungimea se calculează pe rețeaua pietonală disponibilă; nu este o promisiune de accesibilitate sau de deschidere.',
    sources: [
      { label: 'OpenStreetMap · Parcul Cetății', url: 'https://www.openstreetmap.org/way/87336494' },
      { label: 'OpenStreetMap · Parcul Operei', url: 'https://www.openstreetmap.org/way/37589042' },
      { label: 'OpenStreetMap · Parcul Bejan', url: 'https://www.openstreetmap.org/way/53197305' },
      { label: 'Magna Curia · amplasare și istoric', url: wiki('Magna Curia') },
      {
        label: 'Direcția Silvică Hunedoara · Pădurea Bejan',
        url: 'https://deva.rosilva.ro/articole/traseul_stejarilor_-_padurea_bejan__p_2775.htm',
      },
    ],
    related: [
      { label: 'Parcul Cetății', to: '/loc/parcul-cetatii' },
      { label: 'Parcul Operei', to: '/loc/parcul-operei' },
      { label: 'Parcul Bejan', to: '/loc/parcul-bejan' },
      { label: 'Construiește o plimbare', to: '/trasee' },
    ],
  },
  {
    id: 'primarul-devei',
    title: 'Primarul și administrația Devei',
    topics: ['Viață civică'],
    region: 'Deva · informații publice',
    intro:
      'Lucian Ioan Rus este primarul municipiului Deva, conform paginii oficiale a conducerii primăriei consultate la 19 noiembrie 2026.',
    photo: {
      src: '/images/primaria-deva.webp',
      caption: 'Sediul Primăriei Deva, Piața Unirii. Imagine a instituției, nu portret al primarului.',
      author: 'Thaler Tamas',
      license: 'CC BY-SA 4.0',
      url: commons('Városháza, (Polgármesteri Hivatal), Déva.jpg'),
    },
    sections: [
      {
        title: 'Cine conduce primăria',
        text: 'Instituția îl prezintă pe Lucian Ioan Rus drept primar. Pagina oficială explică atribuțiile funcției, inclusiv punerea în aplicare a hotărârilor consiliului local. Pentru componența actualizată a conducerii, consultă direct instituția.',
        refs: [1],
      },
      {
        title: 'Contact și audiențe',
        text: 'Sediul este în Piața Unirii nr. 4, Deva. Datele publice de contact și programul de audiențe sunt publicate de primărie. Verifică modalitatea de înscriere și programul înainte de deplasare.',
        refs: [1, 2],
      },
      {
        title: 'Sesizare oficială sau contribuție la ghid?',
        text: 'Pentru o problemă a orașului care trebuie înregistrată de autoritate, folosește serviciul municipal Deva24. O observație trimisă către comunitatea Atlas Deva este o contribuție editorială și nu primește număr de înregistrare la primărie.',
        refs: [2, 3],
      },
    ],
    note: 'Atlas Deva este un ghid independent. Funcția și informațiile de contact sunt datate, nu sincronizate în timp real. Nu sunt publicate date personale sau evaluări politice.',
    sources: [
      {
        label: 'Primăria Deva · profilul oficial al primarului',
        url: 'https://www.primariadeva.ro/index.php/primaria/conducere_detaliu/138',
      },
      {
        label: 'Primăria Deva · contact instituțional',
        url: 'https://www.primariadeva.ro/index.php/contact/detaliu/278',
      },
      { label: 'Deva24 · sesizări oficiale', url: 'https://deva24.primariadeva.ro/' },
    ],
    related: [
      { label: 'Primăria pe hartă', to: '/harta?loc=primaria' },
      { label: 'Vocea comunității', to: '/comunitate' },
      { label: 'Anunțuri locale', to: '/live' },
    ],
  },
]
export const fieldTopics: FieldTopic[] = [
  'Sate',
  'Arheologie',
  'Minerit',
  'Cariere',
  'Parcuri',
  'Viață civică',
]
export const fieldPath = (g: FieldGuide) => '/ghiduri/' + g.id
export const archivePath = '/ghiduri/' + archive.id
