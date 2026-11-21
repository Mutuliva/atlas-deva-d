import type { Place, Category } from './places'
import { osm, project } from './local-geography'

function mapped(id: string, name: string, category: Category, location: string, lat: number, lon: number, object: string, intro: string, address = location): Place {
  return { id, name, category, location, lat, lon, ...project(lat, lon), image: `/images/atlas/${id}.webp`, cartogram: true, intro,
    story: category === 'Magazine' ? 'Acest loc figurează în inventarul comercial OpenStreetMap. Marcajul reproduce poziția cartografiată, nu o intrare verificată pe teren.' : 'Poziția acestui reper este preluată din obiectul OpenStreetMap indicat mai jos. Extrasul cartografic arată împrejurimile reale ale punctului.',
    tip: category === 'Magazine' ? 'Programul, disponibilitatea produselor și funcționarea în prezent nu sunt confirmate în atlas. Consultă informațiile operatorului înaintea vizitei.' : 'Verifică la fața locului condițiile de acces. Atlasul nu confirmă starea traseelor sau programul de vizitare.',
    address, label: 'below', sources: [{ label: 'Obiectul cartografic · OpenStreetMap', url: osm(object) }] }
}
const forest: Place = {
  id: 'padurea-bejan', name: 'Pădurea Bejan', category: 'Natură', location: 'Rezervație forestieră',
  lat: 45.85167, lon: 22.88889, ...project(45.85167, 22.88889), image: '/images/atlas/padurea-bejan.webp', cartogram: true,
  intro: 'Rezervația forestieră de lângă Deva, cunoscută pentru diversitatea stejarilor.',
  story: 'Direcția Silvică Hunedoara descrie aici Traseul stejarilor și speciile de cvercinee ale rezervației. Pădurea Bejan și Parcul Bejan sunt două locuri distincte, reprezentate separat în atlas.',
  tip: 'Marcajul indică un punct reprezentativ al rezervației, nu intrarea într-un traseu. Urmează semnalizarea din teren; nu sunt oferite indicații de mers către centrul pădurii.',
  address: 'Pădurea Bejan, lângă Deva', label: 'right', representative: true,
  sources: [{ label: 'Direcția Silvică Hunedoara · Traseul stejarilor', url: 'https://deva.rosilva.ro/articole/traseul_stejarilor_-_padurea_bejan__p_2775.htm' }, { label: 'Pădurea Bejan · coordonatele de referință', url: 'https://ro.wikipedia.org/wiki/P%C4%83durea_Bejan' }],
}
export const additionalPlaces: Place[] = [forest,
  mapped('parcul-bejan', 'Parcul Bejan', 'Natură', 'Zona Bejan', 45.856102, 22.9042304, 'way/53197305', 'Parcul urban din sudul Devei, distinct de rezervația forestieră.'),
  mapped('izvorul-bejan', 'Izvorul Bejan', 'Natură', 'Izvor cartografiat', 45.8537900, 22.9001802, 'node/12802903401', 'Izvor înregistrat în OpenStreetMap. Potabilitatea apei nu este verificată.'),
  mapped('belvedere-cetate', 'Belvedere spre Cetate', 'Natură', 'Punct de belvedere', 45.8682468, 22.8860182, 'node/2670132136', 'Punctul numit „Vedere Cetatea Deva” în OpenStreetMap, pe dealurile de la vest de oraș.'),
  mapped('parcul-operei', 'Parcul Operei', 'Natură', 'Piața I.C. Brătianu', 45.8790931, 22.9055125, 'way/37589042', 'Un spațiu verde cartografiat în zona centrală a Devei.'),
  mapped('piata-cioclovina', 'Piața Cioclovina', 'Magazine', 'Strada Scărișoara', 45.8630807, 22.9068106, 'way/352775827', 'Piață din zona Micro 15, consemnată în OpenStreetMap și sub denumirea anterioară „Piața Micro 15”.'),
  mapped('lidl-bejan', 'Lidl · Bejan', 'Magazine', 'Strada Bejan', 45.8638502, 22.9024655, 'way/84756610', 'Supermarket cartografiat pe strada Bejan, în vecinătatea zonei Micro 15.', 'Strada Bejan, nr. 2A, Deva'),
  mapped('kaufland-deva', 'Kaufland Deva', 'Magazine', 'Deva', 45.8732780, 22.9197550, 'way/227321363', 'Supermarket din estul orașului, identificat prin clădirea sa în OpenStreetMap.'),
  mapped('deva-mall', 'Deva Mall', 'Magazine', 'Centru comercial', 45.8820358, 22.9053301, 'way/29185037', 'Centru comercial cartografiat în apropierea pieței centrale.'),
  mapped('piata-deva', 'Piața Deva', 'Magazine', 'Piață agroalimentară', 45.8812927, 22.9065049, 'way/29185067', 'Piața orașului, marcată separat de centrul comercial învecinat.'),
  mapped('profi-gojdu', 'Profi · zona Gojdu', 'Magazine', 'Zona Gojdu', 45.874294, 22.915474, 'node/8727848844', 'Magazin alimentar cartografiat în interiorul perimetrului PUZ Emanoil Gojdu.'),
  mapped('carrefour-dorobanti', 'Carrefour Express', 'Magazine', 'Zona Dorobanți', 45.8679517, 22.9137361, 'node/12258258903', 'Magazin de proximitate în perimetrul studiat prin PUZ Dorobanți.'),
  mapped('penny-micro', 'Penny Market', 'Magazine', 'Zona Micro 15', 45.8616424, 22.9105228, 'way/78067986', 'Magazin alimentar identificat în datele cartografice ale zonei Micro 15.'),
  mapped('biblioteca', 'Biblioteca Județeană', 'Cultură', 'Deva', 45.8840561, 22.9007918, 'way/87419612', 'Clădire identificată ca bibliotecă în OpenStreetMap, în apropierea centrului vechi.'),
  mapped('muzeul-tipografiei', 'Muzeul Tipografiei', 'Cultură', 'Deva', 45.8610559, 22.9209083, 'node/3359289117', 'Reper dedicat tipografiei, înregistrat în inventarul cartografic al orașului.'),
  mapped('primaria', 'Primăria Deva', 'Arhitectură', 'Piața Unirii', 45.8820284, 22.9002553, 'way/88201682', 'Sediul primăriei din Piața Unirii, în centrul vechi.', 'Piața Unirii, nr. 4, Deva'),
]
