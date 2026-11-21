import businessIndex from './business-index.json'
import { project } from './local-geography'
import type { Category, Place } from './places'

export interface CityEvent {
  id: string
  title: string
  start: string
  end?: string
  venue: string
  type: string
  description: string
  source: string
  updated: string
}
export interface Notice {
  id: string
  title: string
  source: string
  date: string
  kind: string
  description: string
  end?: string
}
export interface Contribution {
  id: string
  title: string
  kind: string
  location: string
  description: string
  photo?: string
  status: string
  created: string
}
export const sourceDate = '2026-11-19'
export const businessKinds = [
  'Restaurante',
  'Cafenele',
  'Hoteluri',
  'Pensiuni',
  'Magazine',
  'Saloane',
  'Service auto',
  'Servicii',
]
const grouping: Record<string, Category> = {
  Magazine: 'Magazine',
  Restaurante: 'Gastronomie',
  Cafenele: 'Gastronomie',
  Hoteluri: 'Cazare',
  Pensiuni: 'Cazare',
  Saloane: 'Servicii',
  'Service auto': 'Servicii',
  Servicii: 'Servicii',
}
const singular: Record<string, string> = {
  Magazine: 'Magazin',
  Restaurante: 'Restaurant',
  Cafenele: 'Cafenea',
  Hoteluri: 'Hotel',
  Pensiuni: 'Pensiune',
  Saloane: 'Salon',
  'Service auto': 'Service auto',
  Servicii: 'Serviciu local',
}
export const businessPlaces: Place[] = businessIndex.map((b) => ({
  id: b.id,
  name: b.name,
  category: grouping[b.kind],
  businessType: b.kind,
  location: b.street || 'Deva, Hunedoara',
  address: b.address || 'Adresă poștală neconfirmată; poziția este indicată pe hartă.',
  lat: b.lat,
  lon: b.lon,
  ...project(b.lat, b.lon),
  label: 'below',
  image: b.image || (b.kind === 'Magazine' ? `/images/atlas/${b.id}.webp` : '/map/small-atlas.webp'),
  cartogram: !b.image,
  intro: b.description || `${singular[b.kind]} în Deva${b.street ? `, pe ${b.street}` : ''}.`,
  story:
    b.description ||
    `Fișa ${b.name} folosește reperul public din OpenStreetMap. Poziția indică locul cartografiat; confirmă accesul și disponibilitatea direct la operator.`,
  tip: 'Datele de contact și programul sunt informații din sursele citate, nu confirmări în timp real. Verifică programul înainte de vizită.',
  phone: b.phone,
  hours: b.hours,
  website: b.web,
  photoCredit: b.credit,
  photoSource: b.photoSource,
  checked: sourceDate,
  sources: [
    { label: 'OpenStreetMap · obiectul original', url: b.source },
    ...(b.web ? [{ label: 'Pagina operatorului', url: b.web }] : []),
  ],
}))
export const scheduledEvents: CityEvent[] = [
  {
    id: 'copii-cochilie',
    title: 'Lumea copiilor dincolo de cochilie',
    start: '2026-11-24T18:00:00+02:00',
    end: '2026-11-24T21:00:00+02:00',
    venue: 'Amfiteatrul „Liviu Oros”',
    type: 'Conferință',
    description:
      'O întâlnire despre educație și universul copilului, anunțată de Centrul Cultural „Drăgan Muntean”. Consultă condițiile de participare la organizator.',
    source: 'https://www.centrulculturaldeva.ro/evenimente/lumea-copiilor-dincolo-de-cochilie/',
    updated: sourceDate,
  },
  {
    id: 'iancu-570',
    title: 'Istorie și comemorare: Iancu de Hunedoara',
    start: '2026-11-26T10:00:00+02:00',
    venue: 'Sala Mare, Primăria Deva',
    type: 'Cultură',
    description:
      'Conferință științifică națională la 570 de ani de la victoria de la Belgrad și de la moartea lui Iancu de Hunedoara.',
    source: 'https://www.primariadeva.ro/index.php/informatii_publice/anunt/9532',
    updated: sourceDate,
  },
  {
    id: 'devorchestra-craciun',
    title: 'DevOrchestra, în concert de Crăciun',
    start: '2026-12-19T18:00:00+02:00',
    venue: 'Centrul Cultural „Drăgan Muntean”',
    type: 'Concert',
    description:
      'Colinde și melodii de sărbători într-un concert anunțat de organizator pentru 19 decembrie, la ora 18:00.',
    source: 'https://www.centrulculturaldeva.ro/evenimente/devorchestra-in-concert-de-craciun/',
    updated: sourceDate,
  },
]
export const cityNotices: Notice[] = [
  {
    id: 'trafic-vlaicu',
    title: 'Lucrări pe strada Aurel Vlaicu',
    kind: 'Trafic și lucrări',
    date: '2026-11-19',
    end: '2026-11-19T14:00:00+02:00',
    description:
      'Restricții anunțate pentru 19 noiembrie, 08:00–14:00, la nr. 98–108, pentru lucrări la conducta de gaze. Nu indică starea actuală a traficului.',
    source: 'https://www.primariadeva.ro/index.php/informatii_publice/anunt/9571',
  },
  {
    id: 'sedinta-locala',
    title: 'Ședința extraordinară a Consiliului Local',
    kind: 'Anunț public',
    date: '2026-11-19',
    end: '2026-11-20T11:00:00+02:00',
    description:
      'Ședință convocată pentru 20 noiembrie 2026, ora 11:00, în sala mare de ședințe a Primăriei Deva. Ordinea de zi este disponibilă în comunicatul oficial.',
    source: 'https://www.primariadeva.ro/index.php/informatii_publice/anunt/9570',
  },
]
export const trails = [
  {
    id: 'centrul-vechi',
    name: 'La pas prin centrul vechi',
    description: 'De la teatru la Magna Curia, prin inima istorică a orașului.',
    stops: ['teatrul-de-arta', 'biblioteca', 'magna-curia', 'parcul-cetatii'],
    image: '/images/palace.webp',
    label: 'ISTORIE & CULTURĂ',
  },
  {
    id: 'sub-cetate',
    name: 'Pe urmele cetății',
    description: 'Un parc, un palat și cetatea care veghează valea Mureșului.',
    stops: ['parcul-cetatii', 'magna-curia', 'cetatea-devei'],
    image: '/images/aerial.webp',
    label: 'PATRIMONIU',
  },
  {
    id: 'oras-verde',
    name: 'O pauză în oraș',
    description: 'O plimbare printre alei, o oprire la cafea și un parc urban.',
    stops: ['parcul-cetatii', 'caffe-boheme', 'parcul-operei'],
    image: '/images/park.webp',
    label: 'PLIMBARE URBANĂ',
  },
]
export const formatDate = (v: string, opts?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('ro-RO', {
    timeZone: 'Europe/Bucharest',
    ...(opts || { day: 'numeric', month: 'long', year: 'numeric' }),
  }).format(new Date(v))
export const eventEnded = (e: CityEvent) => new Date(e.end || e.start).getTime() < Date.now()
export const placePath = (p: Place) =>
  `${p.businessType || p.category === 'Magazine' ? '/business/' : '/loc/'}${p.id}`
export const mapPath = (p: Place) => `/harta?loc=${encodeURIComponent(p.id)}`
export const walkingUrl = (p: Place[]) =>
  p.length < 2
    ? ''
    : `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${p[0].lat},${p[0].lon}&destination=${p.at(-1)!.lat},${p.at(-1)!.lon}&waypoints=${encodeURIComponent(
        p
          .slice(1, -1)
          .map((a) => `${a.lat},${a.lon}`)
          .join('|'),
      )}`
