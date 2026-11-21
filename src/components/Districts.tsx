import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronRight, ExternalLink, MapPin, Scan, ShieldQuestion, ShoppingBag, Trees, Users, X } from 'lucide-react'
import { containsPoint, extent, metricDistance, pathOf, mapDate } from '../lib/local-geography'
import type { District } from '../lib/local-geography'
import { categories } from '../lib/places'
import { useAtlas } from '../lib/atlas-store'
import type { Place } from '../lib/places'

export function DistrictRow({ district: d, onClick }: { district: District; onClick: () => void }) {
  const b = d.ring && extent(d.ring)
  return <button className="place-row district-row" onClick={onClick} aria-label={`Explorează cartierul ${d.name}`}>
    <span className={`district-thumb ${d.ring ? 'has-outline' : ''}`}>{b && d.ring ? <svg viewBox={`${b.l - 35} ${b.t - 35} ${b.r-b.l+70} ${b.b-b.t+70}`} aria-hidden="true"><path d={pathOf(d.ring)} fill="#c35d4914" stroke="#b45e4a" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/></svg> : <MapPin size={20} strokeWidth={1.4}/>}</span>
    <span className="place-row-copy"><span className="row-category">{d.ring ? 'PERIMETRU DOCUMENTAT' : 'REPER CARTOGRAFIC'}</span><span className="row-name">{d.name}</span><span className="row-location">{d.decision || d.referenceLabel || 'Poziție din OpenStreetMap'}</span></span><ChevronRight size={14}/>
  </button>
}

export function DistrictProfile({ district: d, onBack, onPlace, onShowMap }: { district: District; onBack: () => void; onPlace: (p: Place) => void; onShowMap: () => void }) {
  const {places}=useAtlas()
  const within = places.map(p => ({ p, dist: metricDistance(d,p) })).filter(({p,dist}) => d.ring ? containsPoint(p,d.ring) : dist <= 800).sort((a,b) => a.dist-b.dist)
  const nearbyGreen = d.ring && !within.some(s => s.p.category === 'Natură') ? places.filter(p => p.category === 'Natură').map(p => ({ p, dist:metricDistance(d,p) })).filter(s => s.dist < 2000).sort((a,b) => a.dist-b.dist)[0] : undefined
  const groups = [
    { title: 'Magazine și piețe', icon: ShoppingBag, list: within.filter(({p}) => p.category === 'Magazine') },
    { title: 'Parcuri și natură', icon: Trees, list: within.filter(({p}) => p.category === 'Natură') },
    { title: 'Alte puncte de interes', icon: BookOpen, list: within.filter(({p}) => !['Magazine','Natură'].includes(p.category)) },
  ]
  return <div className="district-profile" aria-label={`Fișa cartierului ${d.name}`}>
    <button className="district-back" onClick={onBack}><ArrowLeft size={14}/>Toate cartierele</button>
    <div className="section-kicker"><span/>FIȘĂ DE CARTIER</div><h1>{d.name}</h1>
    <span className={`geo-status ${d.ring ? 'documented' : ''}`}>{d.ring ? <Scan size={12}/> : <MapPin size={12}/>} {d.ring ? 'Perimetru PUZ documentat' : 'Poziție documentată · fără contur'}</span>
    <p className="district-description">{d.description}</p>
    <div className="boundary-note"><i/>{d.ring ? <>Roșu: <strong>perimetrul proiectului PUZ</strong>, digitizat după planșa primăriei. Nu este o limită administrativă certificată a întregului cartier.</> : <>Roșu: <strong>punct de reper</strong>. Nu avem o delimitare verificată pentru întregul cartier; nu desenăm un poligon estimat.</>}</div>
    <div className="district-pop"><div><Users size={15}/><h2>Populație</h2></div>{d.population ? <><strong>{d.population.value} <small>locuitori estimați</small></strong><p>{d.population.note}</p><a href={d.population.url} target="_blank" rel="noreferrer">Memoriu PUZ · p. 106 <ExternalLink size={10}/></a></> : <p>Nu este disponibilă o cifră verificată pentru acest cartier. Totalul municipiului nu este folosit ca estimare.</p>}
    {d.area && <div className="study-area"><span>Suprafața perimetrului din PUZ</span><b>{d.area}</b></div>}</div>
    <div className="district-inventory"><div className="eyebrow">{d.ring ? 'REPERE ÎN PERIMETRUL PUZ' : 'LA CEL MULT 800 M DE REPER'}</div>
      <p className="inventory-note">{d.ring ? 'Selecție din atlas, pe baza poziției punctelor în contur; nu este un inventar complet.' : 'Distanțe în linie dreaptă. Apropierea nu confirmă apartenența la cartier.'}</p>
      {groups.map(({title,icon:Icon,list}) => <section key={title}><h3><Icon size={14}/>{title}</h3>
        {list.map(({p,dist}) => <button className="inventory-place" key={p.id} onClick={() => onPlace(p)}><i style={{background: categories[p.category].color}}/><span>{p.name}</span>{!d.ring && <small>{Math.round(dist/10)*10} m</small>}<ChevronRight size={12}/></button>)}
        {title === 'Alte puncte de interes' && d.facility && <a className="inventory-place" href={d.facility.url} target="_blank" rel="noreferrer"><i/><span>{d.facility.label}</span><ExternalLink size={11}/></a>}
        {!list.length && !(title === 'Alte puncte de interes' && d.facility) && <p className="inventory-empty">Niciun reper din această categorie în selecția atlasului pentru zona afișată.</p>}
        {title === 'Parcuri și natură' && nearbyGreen && <><p className="inventory-note">În afara perimetrului, cel mai apropiat reper verde din atlas:</p><button className="inventory-place" onClick={() => onPlace(nearbyGreen.p)}><i/><span>{nearbyGreen.p.name}</span><small>≈ {Math.round(nearbyGreen.dist/10)*10} m</small><ChevronRight size={12}/></button><p className="inventory-note">Distanță în linie dreaptă de la reperul cartierului.</p></>}
      </section>)}
    </div>
    <section className="district-safety"><h3><ShieldQuestion size={15}/>Siguranță și reputație</h3><strong>Neevaluată</strong><p>Nu avem date verificabile la nivelul cartierului pentru a-l numi „rău-famat” sau „sigur”. Lipsa datelor nu este un verdict.</p></section>
    <section className="district-sources"><h3><Check size={14}/>Surse și delimitare</h3>{d.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}<ArrowUpRight size={12}/></a>)}{d.ring && <a href={`/map/perimetre/${d.id}.geojson`} download>Descarcă perimetrul și proveniența · GeoJSON</a>}<small>Surse consultate: {mapDate}. Contururile sunt pentru orientare, nu pentru uz cadastral.</small></section>
    <button className="primary-button district-mobile-map" onClick={onShowMap}><MapPin size={14}/>Arată pe hartă</button>
  </div>
}

export function DistrictCaption({ district, onDetails, onClose }: { district: District; onDetails: () => void; onClose: () => void }) {
  return <div className="district-caption" data-map-ui><span className="boundary-swatch"/><div><b>{district.name}</b><small>{district.ring ? 'Perimetru PUZ, nu limită administrativă' : 'Reper punctual · delimitare neverificată'}</small></div><button className="caption-details" onClick={onDetails} aria-label={`Vezi fișa cartierului ${district.name}`}><BookOpen size={15}/></button><button onClick={onClose} aria-label="Închide selecția cartierului"><X size={14}/></button></div>
}
