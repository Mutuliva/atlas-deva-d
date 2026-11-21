import outlines from './district-outlines.json'

export type Point = { x: number; y: number }
export type Source = { label: string; url: string }
export const municipal = 'https://www.primariadeva.ro/images/uploads/documente/'
export const osm = (object: string) => `https://www.openstreetmap.org/${object}`
export const project = (lat: number, lon: number): Point => ({
  x: (lon + 180) / 360 * 16777216 - 9232 * 1024,
  y: (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * 16777216 - 5834 * 1024,
})
export const metersPerUnit = 40075016.686 / 16777216 * Math.cos(45.875 * Math.PI / 180)
export const metricDistance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) * metersPerUnit
export function containsPoint(p: Point, ring: Point[]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}
export const pathOf = (ring: Point[]) => ring.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('') + 'Z'
export function extent(points: Point[]) {
  const x = points.map(p => p.x), y = points.map(p => p.y)
  return { l: Math.min(...x), r: Math.max(...x), t: Math.min(...y), b: Math.max(...y) }
}
export interface District extends Point {
  id: string; name: string; ring?: Point[]; area?: string; decision?: string; description: string; sources: Source[]
  population?: { value: string; note: string; url: string }; facility?: Source; referenceLabel?: string
}
const areaDistrict = (id: keyof typeof outlines, name: string, area: string, description: string, decision: string, plan: string, memo: string, hcl: string): District => {
  const ring = outlines[id].coordinates[0].map(([lon, lat]) => project(lat, lon))
  // Use the actual study polygon's centroid, not a different neighbourhood's label.
  let a = 0, x = 0, y = 0
  for (let i = 1; i < ring.length; i++) {
    const p = ring[i - 1], q = ring[i], f = p.x * q.y - q.x * p.y
    a += f; x += (p.x + q.x) * f; y += (p.y + q.y) * f
  }
  return { id, name, x: x / (3 * a), y: y / (3 * a), ring, area, decision, description,
    sources: [{ label: 'Planșa originală cu delimitarea', url: municipal + plan }, { label: 'Memoriul urbanistic', url: municipal + memo }, { label: decision, url: municipal + hcl }] }
}
const micro = areaDistrict('micro-15', 'Micro 15', '≈ 38 ha', 'Zona studiată se întinde de o parte și de alta a străzii Minerului, între Aleea Armatei, străzile Mihai Eminescu, Pietroasa, Ceangăi, Petru Rareș, Bejan și Titu Maiorescu.', 'HCL 56 / 2025', '01._Situa%C8%9Bia_existent%C4%83__1.pdf', 'MEMORIU_1.pdf', 'HCL_Nr.56_din_27_.02.2025_1.pdf')
micro.population = { value: '8.179', note: 'Estimare pentru zona de studiu, calculată în memoriul PUZ din numărul de apartamente. Nu este un recensământ al cartierului și nici o cifră actualizată.', url: municipal + 'MEMORIU_1.pdf#page=106' }
micro.facility = { label: 'Școala Gimnazială „Andrei Mureșanu”', url: osm('way/50415708') }
const gojdu = areaDistrict('gojdu', 'Emanoil Gojdu', '42,8 ha', 'Planșa include ansamblurile rezidențiale dintre Calea Zarandului, strada Mărăști și bulevardele dinspre centrul orașului. Conturul urmărește inclusiv retragerile din partea nordică.', 'HCL 218 / 2024', 'A.02_PLAN_SITUATIA_EXISTENTA__1.pdf', 'Memoriu-PUZ_Gojdu.pdf', 'HCL_Nr.218_din_25_.07.2024.pdf')
gojdu.facility = { label: 'Școala Gimnazială nr. 4', url: osm('way/88687204') }
const dorobanti = areaDistrict('dorobanti', 'Dorobanți', '28,2 ha', 'Perimetrul documentat se află între strada Mărăști și Aleea Panseluțelor. Planșa exclude o parte dintre parcelele de locuințe individuale; acestea nu au fost incluse în contur.', 'HCL 217 / 2024', 'A.02_PLAN_SITUATIA_EXISTENTA_.pdf', 'Memoriu-PUZ_Dorobanti.pdf', 'HCL_Nr.217_din_25_.07.2024.pdf')
// OSM place=suburb nodes are point references, never surrogate boundaries.
const nodeDistrict = (id: string, name: string, node: number, lat: number, lon: number): District => ({
  id, name, ...project(lat, lon), description: 'Poziția denumirii provine dintr-un reper de cartier OpenStreetMap. Acest punct nu descrie întinderea cartierului.', sources: [{ label: 'Reperul de cartier în OpenStreetMap', url: osm(`node/${node}`) }],
})
const progresul = areaDistrict('progresul', 'Progresul', '28,4 ha', 'Zona reglementată cuprinde străzi și ansambluri rezidențiale între Griviței, Horea, Decebal, Iuliu Maniu și Calea Zarandului. Roșul urmărește „Limită P.U.Z.” din planșă, nu zona de studiu mai largă de 46,1 ha.', 'HCL 89 / 2024', '01_Situa%C8%9Bia_existent%C4%83_%C8%99i_disfunc%C8%9Bionalit%C4%83%C8%9Bi.pdf', 'Memoriu_general_Progresului_1.pdf', 'HCL_nr._89_din_28_.03.2024__.pdf')
const dacia: District = { id:'dacia', name:'Dacia', ...project(45.869887016,22.910852238), referenceLabel:'Reper stradal · SIDU și OSM',
  description:'Pentru Dacia, reperul este pe Aleea Salcâmilor, stradă asociată cartierului în SIDU 2014–2023, revizia 2017 (tabelul 4.34). Nu este centrul geometric al cartierului.',
  sources:[{ label:'SIDU Deva · tabelul 4.34, p. 193', url:'https://devabusiness.ro/wp-content/uploads/2017/12/SIDU-DEVA-REV-2017-iunie-v9-final.pdf#page=215' }, { label:'Aleea Salcâmilor · reper stradal OSM', url:osm('way/34326078') }] }
export const districts: District[] = [micro, gojdu, dorobanti, progresul, dacia,
  nodeDistrict('centrul-vechi', 'Centrul Vechi', 5645570815, 45.8824055, 22.9001588),
  nodeDistrict('aurel-vlaicu', 'Aurel Vlaicu', 5645570816, 45.8812591, 22.8898108),
  nodeDistrict('calugareni', 'Călugăreni', 5645570817, 45.8752912, 22.8961623),
  nodeDistrict('ceangaiasca', 'Ceangaiască', 5645570820, 45.8660616, 22.911585),
  nodeDistrict('mures', 'Mureș', 5645570814, 45.8842055, 22.9141062),
  nodeDistrict('matei-corvin', 'Matei Corvin', 5645570812, 45.8934245, 22.8962964),
  nodeDistrict('viile-noi', 'Viile Noi', 5645570811, 45.8930474, 22.8913450),
]
export const localNames = ['Dealul 1000', 'La 700'] as const
export const mapDate = '19 noiembrie 2026'
