import { Castle, Landmark, Trees, Church, TrainFront, LayoutGrid, ShoppingBag, Utensils, BedDouble, Wrench, Building2 } from 'lucide-react'
import { businessPlaces } from './city-data'
import { additionalPlaces } from './additional-places'
import type { Source } from './local-geography'

export type Category = 'Istorie' | 'Cultură' | 'Natură' | 'Arhitectură' | 'Transport' | 'Magazine' | 'Gastronomie' | 'Cazare' | 'Servicii' | 'Instituții'
export type Filter = 'Toate' | Category
export const categories = {
  Toate: { icon: LayoutGrid, color: '#365642', light: '#e7ede4' },
  Istorie: { icon: Castle, color: '#ad603e', light: '#f4e9de' },
  Cultură: { icon: Landmark, color: '#ae853b', light: '#f5efdf' },
  Natură: { icon: Trees, color: '#5b8058', light: '#e9f0e3' },
  Arhitectură: { icon: Church, color: '#88758e', light: '#eee9f0' },
  Transport: { icon: TrainFront, color: '#607e91', light: '#e8edf0' },
  Magazine: { icon: ShoppingBag, color: '#a26f55', light: '#f2e8dc' },
  Gastronomie: { icon: Utensils, color: '#bd7544', light: '#f7ede0' },
  Cazare: { icon: BedDouble, color: '#77759e', light: '#efedf6' },
  Servicii: { icon: Wrench, color: '#607b8e', light: '#eaf0f3' },
  Instituții: { icon: Building2, color: '#547e72', light: '#e6efe8' },
} as const

export interface Place {
  id: string
  name: string
  shortName?: string
  category: Category
  location: string
  image: string
  preview?: string
  cartogram?: boolean
  representative?: boolean
  sources?: Source[]
  businessType?: string
  phone?: string
  hours?: string
  website?: string
  photoCredit?: string
  photoSource?: string
  checked?: string
  intro: string
  story: string
  tip: string
  address: string
  x: number
  y: number
  lat: number
  lon: number
  label: 'left' | 'right' | 'below' | 'above'
}

export const places: Place[] = [
  {
    id: 'cetatea-devei', name: 'Cetatea Devei', category: 'Istorie', location: 'Dealul Cetății',
    image: '/images/aerial.webp', preview: '/images/fortress.webp',
    sources: [{ label:'Cetatea Devei · OpenStreetMap', url:'https://www.openstreetmap.org/node/2634652302' }],
    intro: 'Fortăreața medievală care veghează orașul de pe un vechi con vulcanic.',
    story: 'Ridicată pe Dealul Cetății, fortăreața este unul dintre simbolurile Transilvaniei. Atestată documentar în 1269, cetatea păstrează incinte și ziduri din mai multe epoci. De sus, privirea urmărește valea Mureșului și acoperișurile Devei.',
    tip: 'Pentru o plimbare în natură, pornește pe aleile de la poalele dealului. Poartă încălțăminte comodă și rămâi pe traseele marcate din rezervație.',
    address: 'Dealul Cetății, Deva', x: 2138.75, y: 2132.75, lat:45.888742, lon:22.897455, label:'below',
  },
  {
    id:'magna-curia',name:'Palatul Magna Curia',category:'Cultură',location:'Aleea Parcului',image:'/images/palace.webp',
    sources: [{ label:'Palatul Magna Curia · OpenStreetMap', url:'https://www.openstreetmap.org/way/87337570' }],
    intro:'Un palat cu rădăcini renascentiste, la poalele Dealului Cetății.',
    story:'Cunoscut și sub numele de Castelul Bethlen, Magna Curia îmbină arhitectura renascentistă cu detalii baroce. Palatul găzduiește Muzeul Civilizației Dacice și Romane, o invitație la descoperirea istoriei ținutului hunedorean.',
    tip:'Privește balconul baroc și detaliile din piatră ale fațadei. Pentru vizitarea expozițiilor, verifică programul muzeului înainte de plecare.',
    address:'Bulevardul 1 Decembrie 1918, nr. 39, Deva',x:2182.75,y:2316,lat:45.886005,lon:22.898399,label:'left',
  },
  {
    id:'parcul-cetatii',name:'Parcul Cetății',category:'Natură',location:'Centrul vechi',image:'/images/park.webp',
    sources: [{ label:'Parcul Cetății · OpenStreetMap', url:'https://www.openstreetmap.org/way/87336494' }],
    intro:'Alei umbrite și un răgaz de liniște la poalele cetății medievale.',
    story:'Între centrul istoric și deal, Parcul Cetății este locul potrivit pentru o pauză verde. Aleile sale leagă palatul Magna Curia de zona pietonală a orașului, printre arbori maturi și perspective asupra cetății.',
    tip:'Combină plimbarea prin parc cu o oprire la Magna Curia. Aleile umbrite sunt un loc plăcut de popas după coborârea de la cetate.',
    address:'Parcul Cetate, Deva',x:2239.25,y:2331,lat:45.885781,lon:22.899612,label:'right',
  },
  {
    id:'teatrul-de-arta',name:'Teatrul de Artă',category:'Cultură',location:'Piața Unirii',image:'/images/theatre.webp',
    sources: [{ label:'Teatrul de Artă · OpenStreetMap', url:'https://www.openstreetmap.org/way/88201666' }],
    intro:'O bijuterie de arhitectură a vechiului centru, dedicată artelor spectacolului.',
    story:'Clădirea teatrului, ridicată la începutul secolului al XX-lea, face parte din peisajul istoric al Devei. Fațada sa cu forme curbe și detalii decorative marchează una dintre cele mai frumoase opriri din zona pietonală.',
    tip:'Oprește-te în Piața Unirii pentru a privi fațada în ansamblu. Dacă îți dorești o seară la teatru, consultă repertoriul înaintea vizitei.',
    address:'Piața Unirii, nr. 3, Deva',x:2271,y:2542,lat:45.882630,lon:22.900293,label:'left',
  },
  {
    id:'manastirea-franciscana',name:'Mănăstirea Franciscană',category:'Arhitectură',location:'Strada Progresului',image:'/images/monastery.webp',
    sources: [{ label:'Ansamblul franciscan · OpenStreetMap', url:'https://www.openstreetmap.org/relation/1302947' }],
    intro:'Un ansamblu monastic baroc din vechiul cartier al franciscanilor.',
    story:'Biserica și mănăstirea franciscană păstrează o altă pagină din istoria multiculturală a Devei. Silueta turnului și arhitectura sobră a ansamblului se disting între străzile liniștite din partea de nord a orașului.',
    tip:'Este un lăcaș de cult activ. Păstrează liniștea și respectă desfășurarea slujbelor atunci când vizitezi biserica.',
    address:'Strada Progresului, Deva',x:2585,y:2224.5,lat:45.887372,lon:22.907031,label:'right',
  },
  {
    id:'gara-deva',name:'Gara Deva',category:'Transport',location:'Piața Gării',image:'/images/station.webp',
    sources: [{ label:'Gara Deva · OpenStreetMap', url:'https://www.openstreetmap.org/node/9330871706' }],
    intro:'Poarta feroviară a orașului și un punct de plecare spre centrul istoric.',
    story:'Gara leagă Deva de orașele de pe valea Mureșului și de rețeaua feroviară națională. Din Piața Gării poți continua pe jos către centrul vechi, iar Dealul Cetății îți rămâne un reper ușor de recunoscut.',
    tip:'Pentru orele de plecare și liniile de îmbarcare, consultă informațiile afișate în gară sau mersul trenurilor.',
    address:'Piața Gării, Deva',x:2749.5,y:2423.25,lat:45.884403,lon:22.910560,label:'below',
  },
  ...additionalPlaces.map(p => p.id === 'primaria' ? {...p,category:'Instituții' as const,image:'/images/primaria-deva.webp',cartogram:false,phone:'0254 213 435',website:'https://www.primariadeva.ro/'} : p),
  ...businessPlaces,
]

export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export const coordinate = (n: number, direction: string) => `${Math.floor(n)}°${Math.floor((n % 1) * 60)}′${Math.round(((n % 1) * 60 % 1) * 60)}″ ${direction}`
