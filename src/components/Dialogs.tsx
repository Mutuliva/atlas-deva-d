import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, Bookmark, Check, Compass, ExternalLink, MapPin, MapPinOff, MousePointer2, Navigation, Sparkles, X } from 'lucide-react'
import { categories, coordinate } from '../lib/places'
import type { Place } from '../lib/places'
import { CastleMark } from './Brand'
import { Link } from 'react-router-dom'
import { placePath } from '../lib/city-data'

export function Dialog({ children, onClose, labelledBy, className = '' }: { children:ReactNode, onClose:() => void, labelledBy:string, className?:string }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close.current() }
      if (e.key !== 'Tab') return
      const nodes = Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"], input:not([disabled]), select:not([disabled]), textarea:not([disabled])') || []).filter(node=>node.getClientRects().length)
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { last.focus(); e.preventDefault() }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
    }
    document.addEventListener('keydown', key, true)
    return () => { document.removeEventListener('keydown', key, true); document.body.style.overflow = previousOverflow; previous?.focus() }
  }, [])
  return <div className="dialog-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
    <div ref={ref} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
      {children}<button className="dialog-close" onClick={onClose} aria-label="Închide fereastra"><X size={18}/></button>
    </div>
  </div>
}

export function PlaceDetails({ place, saved, onSave, onClose }: { place:Place, saved:boolean, onSave:()=>void, onClose:()=>void }) {
  const { icon: Icon, color } = categories[place.category]
  return <Dialog onClose={onClose} labelledBy="detail-title" className="detail-dialog">
    <div className="detail-image"><img src={place.image} alt={place.cartogram ? `Extras de hartă: ${place.name}` : place.name}/><span className="detail-image-caption"><MapPin size={12}/>{place.cartogram ? 'Extras cartografic · © OpenStreetMap' : 'Deva, Transilvania'}</span></div>
    <div className="detail-content"><div className="detail-category" style={{ color }}><Icon size={15}/>{place.category}</div>
      <h2 id="detail-title">{place.name}</h2><p className="detail-intro">{place.intro}</p>
      <div className="detail-divider"/><p className="detail-story">{place.story}</p>
      <Link to={placePath(place)} className="editorial-link">Fișă completă, contact și distribuire <ArrowUpRight size={13}/></Link>
      <div className="visitor-tip"><Compass size={19}/><div><strong>Însemnare de călătorie</strong><p>{place.tip}</p></div></div>
      <div className="detail-address"><MapPin size={16}/><div><strong>{place.address}</strong><span>{coordinate(place.lat,'N')} · {coordinate(place.lon,'E')}</span></div></div>
      {place.sources && <section className="place-sources"><span className="eyebrow">SURSE VERIFICABILE</span>{place.sources.map(s => <a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label}<ExternalLink size={11}/></a>)}</section>}
      <div className="detail-buttons"><a className="primary-button" href={place.representative ? `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lon}#map=16/${place.lat}/${place.lon}` : `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=walking`} target="_blank" rel="noopener noreferrer"><Navigation size={15}/>{place.representative ? 'Punctul de referință' : 'Indicații de orientare'}<ArrowUpRight size={14}/></a>
        <button className={`secondary-button ${saved ? 'saved-button' : ''}`} onClick={onSave} aria-pressed={saved}>{saved ? <Check size={15}/> : <Bookmark size={15}/>} {saved ? 'Salvat' : 'Salvează'}</button></div>
    </div>
  </Dialog>
}

export function LocalNameDialog({ name, onClose }: { name: string; onClose: () => void }) {
  return <Dialog onClose={onClose} labelledBy="local-name-title" className="about-dialog"><div className="empty-icon local-icon"><MapPinOff size={24}/></div><span className="eyebrow">DENUMIRE LOCALĂ SEMNALATĂ</span><h2 id="local-name-title">{name}</h2><span className="geo-status">Localizare neconfirmată</span><p className="about-lead local-explanation">Nu am putut asocia denumirea „{name}” unei poziții verificabile în Deva. Numele este păstrat în index, fără marcaj pe hartă, altitudine presupusă sau traseu inventat.</p><div className="visitor-tip"><Compass size={18}/><div><strong>Ce lipsește?</strong><p>O sursă locală identificabilă, cu numele și coordonatele aceluiași punct. Un nume asemănător sau un punct de belvedere din apropiere nu confirmă localizarea.</p></div></div><section className="place-sources"><span className="eyebrow">HĂRȚI DE REFERINȚĂ CONSULTATE</span><a href="https://deva-city.map2web.eu/" target="_blank" rel="noreferrer">Harta interactivă a municipiului Deva <ExternalLink size={11}/></a><a href="https://www.openstreetmap.org/#map=14/45.875/22.900" target="_blank" rel="noreferrer">OpenStreetMap · zona Deva <ExternalLink size={11}/></a></section></Dialog>
}

const credits = [
  ['Panorama orașului Deva','Flavius Ivaşca','CC BY-SA 4.0','RO_HD_Deva_Centru.jpg'],
  ['Primăria Deva','Thaler Tamas','CC BY-SA 4.0','Városháza,_(Polgármesteri_Hivatal),_Déva.jpg'],
  ['Cetatea Devei, la răsărit','Neighbor’s goat','CC BY-SA 4.0','Cetatea_medievală_Deva,_în_lumina_răsăritului.jpg'],
  ['Cetatea Devei, vedere aeriană','Civertan','CC BY-SA 4.0','Déva_vára_-_légi_fotó.jpg'],
  ['Palatul Magna Curia','Andrei kokelburg','CC BY-SA 3.0 RO','Deva_Magna_curia_(1).jpg'],
  ['Parcul Cetății','Carmen buzan','CC BY-SA 3.0 RO','Parcul_Cetatii_Deva.JPG'],
  ['Teatrul de Artă','Țetcu Mircea Rareș','CC BY-SA 4.0','RO_HD_Teatrul_de_Arta_Deva_(1).jpg'],
  ['Mănăstirea Franciscană','Dezidor','CC BY 3.0','Deva,_kostel.jpg'],
  ['Gara Deva','Dezidor','CC BY 3.0','Deva,_železniční_nádraží.jpeg'],
]
export function AboutDialog({ onClose, sources = false }: { onClose:()=>void, sources?:boolean }) {
  const [tab, setTab] = useState(sources ? 'sources' : 'guide')
  return <Dialog onClose={onClose} labelledBy="about-title" className="about-dialog">
    <div className="about-brand"><CastleMark size={48}/></div><span className="eyebrow">DESPRE ATLASUL LOCAL</span>
    <h2 id="about-title">Deva, loc cu loc.</h2><p className="about-lead">Un ghid de buzunar pentru a descoperi istoria, natura și cultura orașului de pe Mureș.</p>
    <div className="about-tabs"><button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}>Cum explorezi</button><button className={tab === 'sources' ? 'active' : ''} onClick={() => setTab('sources')}>Surse și credite</button></div>
    {tab === 'guide' ? <div className="about-guide">
      <div><span><MousePointer2 size={19}/></span><section><h3>Privește mai de aproape</h3><p>Deplasează harta prin tragere. Folosește rotița, două degete sau butoanele + și − pentru a schimba scara.</p></section></div>
      <div><span><MapPin size={19}/></span><section><h3>Descoperă un reper</h3><p>Alege un loc din listă sau de pe hartă. Caută după nume ori filtrează reperele după categorie.</p></section></div>
      <div><span><Bookmark size={19}/></span><section><h3>Păstrează ce îți place</h3><p>Apasă semnul de carte din fișa unui loc. Locurile salvate rămân în acest browser, fără cont.</p></section></div>
      <p className="about-note"><Sparkles size={14}/>Harta și fotografiile sunt incluse în atlas, fără un serviciu de hartă extern.</p>
    </div> : <div className="source-content"><h3>Cartografie și relief</h3><p>Date geografice © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">contribuitorii OpenStreetMap <ExternalLink size={11}/></a>, sub licența ODbL, prelucrate din <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a>. Curbele de nivel și relieful umbrit folosesc setul <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noreferrer">Terrain Tiles</a>.</p>
      <h3>Cartiere și repere noi</h3><p>Contururile roșii reproduc perimetrele de studiu din planșele PUZ ale <a href="https://www.primariadeva.ro/index.php/servicii_publice/documente/C78" target="_blank" rel="noreferrer">Primăriei Deva</a>, nu limite cadastrale ale cartierelor. Pentru celelalte cartiere afișăm numai repere punctuale OSM. Planșele, estimările și sursele fiecărui loc nou sunt indicate în fișe; absența datelor nu înseamnă absența unui serviciu sau risc.</p>
      <h3>Fotografii</h3><p>Fotografii din Wikimedia Commons, redimensionate și decupate pentru acest atlas. Reperele noi folosesc extrase din harta locală, etichetate ca atare. Fiecare sursă fotografică include licența originală.</p>
      <ul>{credits.map(([title,author,license,file]) => <li key={title}><a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`} target="_blank" rel="noreferrer">{title}<ExternalLink size={11}/></a><span>{author} · {license}</span></li>)}</ul>
      <p className="source-disclaimer">Atlasul este un ghid de explorare, nu un instrument de navigație în timp real. Confirmă local accesul și programul de vizitare.</p>
    </div>}
  </Dialog>
}
