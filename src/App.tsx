import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { BrowserRouter, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Bookmark, ChevronRight, Globe2, List, Map as MapIcon, MapPin, MapPinOff, Search, SlidersHorizontal, X } from 'lucide-react'
import Platform from './components/Platform'
import { AtlasProvider, useAtlas } from './lib/atlas-store'
import { AtlasMap } from './components/AtlasMap'
import { AboutDialog, PlaceDetails, LocalNameDialog } from './components/Dialogs'
import { DistrictProfile, DistrictRow } from './components/Districts'
import { containsPoint, districts, localNames, metricDistance } from './lib/local-geography'
import type { District } from './lib/local-geography'
import { categories, normalize } from './lib/places'
import type { Filter, Place } from './lib/places'
import './App.css'
import './districts.css'
import './platform.css'

function MapWorkspace() {
  const { places, saved, toggleSave, walk } = useAtlas()
  const pathname=useLocation().pathname, navigate=useNavigate(), [params]=useSearchParams()
  const tab=pathname==='/salvate'?'saved':pathname==='/cartiere'?'districts':'explore'
  const [districtId, setDistrictId] = useState<string | null>(params.get('cartier'))
  const [localName, setLocalName] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('Toate')
  const [query, setQuery] = useState(params.get('cauta')||'')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('traseu')?null:params.get('loc')||(tab==='saved'?saved[0]:places[0]?.id)||null)
  const [detail, setDetail] = useState<Place | null>(null)
  const [about, setAbout] = useState<'guide' | 'sources' | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>(params.get('cauta')||tab==='saved'||(tab==='districts'&&!districtId)?'list':'map')
  const [focusRequest, setFocusRequest] = useState<{ id: string, key: number } | null>(()=>({id:params.get('traseu')&&walk?'__walk__':params.get('loc')||(districtId?`district:${districtId}`:tab==='districts'?'__districts__':tab==='saved'?saved[0]||'__home__':'__home__'),key:0}))
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const filtered = useMemo(() => places.filter(place =>
    (tab !== 'saved' || saved.includes(place.id)) &&
    (filter === 'Toate' || filter === place.category) &&
    normalize(`${place.name} ${place.location} ${place.category} ${place.intro}`).includes(normalize(query))
  ), [places, tab, saved, filter, query])
  const selected = filtered.find(p => p.id === selectedId)
  const savedEmpty = tab === 'saved' && saved.length === 0
  const inDistricts = tab === 'districts'
  const district = inDistricts ? districts.find(d => d.id === districtId) : undefined
  const districtList = useMemo(() => districts.filter(d => normalize(d.name).includes(normalize(query))), [query])
  const nameList = tab === 'explore' && (filter === 'Toate' || filter === 'Natură') ? localNames.filter(n => normalize(n).includes(normalize(query))) : []
  const districtMatches = tab === 'explore' && filter === 'Toate' && query.trim() ? districtList : []
  const mapPlaces = useMemo(() => params.get('traseu')&&walk?places.filter(p=>walk.stops.includes(p.id)):!inDistricts ? filtered : district ? places.filter(p => district.ring ? containsPoint(p, district.ring) : metricDistance(p, district) <= 800) : [], [params,walk,places,inDistricts, district, filtered])

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (detail || about || localName) return
      if (e.key === '/' && !(e.target instanceof HTMLInputElement) && !e.metaKey && !e.ctrlKey) {
        e.preventDefault(); setDistrictId(null); setMobileView('list'); requestAnimationFrame(() => searchRef.current?.focus())
      }
      if (e.key === 'Escape') {
        if (document.activeElement === searchRef.current) searchRef.current?.blur()
        else setSelectedId(null)
      }
    }
    window.addEventListener('keydown', keydown)
    return () => window.removeEventListener('keydown', keydown)
  }, [about, detail, localName])

  function changeTab(next: 'explore' | 'saved' | 'districts') {
    setDistrictId(null)
    navigate(next==='districts'?'/cartiere':next==='saved'?'/salvate':'/harta'); setQuery(''); setFilter('Toate'); setMobileView('list')
    setSelectedId(next === 'explore' ? places[0]?.id||null : saved[0] || null)
    setFocusRequest(prev => ({ id: next === 'districts' ? '__districts__' : next === 'saved' && saved.length ? saved[0] : '__home__', key: (prev?.key || 0) + 1 }))
    if (listRef.current) listRef.current.scrollTop = 0
  }

  function focusPlace(place: Place) {
    if (inDistricts) { navigate('/harta?loc='+place.id); return }
    setSelectedId(place.id); setMobileView('map'); setFocusRequest(prev => ({ id: place.id, key: (prev?.key || 0) + 1 }))
  }

  function selectDistrict(d: District) {
    if(!inDistricts) {navigate('/cartiere?cartier='+d.id);return}
    setDistrictId(d.id); setSelectedId(null); setQuery(''); setFilter('Toate'); setMobileView('map')
    setFocusRequest(prev => ({ id:`district:${d.id}`, key: (prev?.key || 0) + 1 }))
  }

  function chooseFilter(value: Filter) {
    setFilter(value)
    const matches = places.filter(p => (value === 'Toate' || p.category === value) && (tab !== 'saved' || saved.includes(p.id)) && normalize(`${p.name} ${p.location} ${p.category} ${p.intro}`).includes(normalize(query)))
    if (matches.length === 1) setSelectedId(matches[0].id)
    setFocusRequest(prev => ({ id: matches.length === 1 ? matches[0].id : value === 'Toate' ? '__home__' : '__results__', key: (prev?.key || 0) + 1 }))
    if (listRef.current) listRef.current.scrollTop = 0
  }

  return (
    <div className="atlas-app">
      <main className="guide-layout" data-mobile-view={mobileView} data-district={district ? 'selected' : undefined}>
        <aside className="explore-panel" aria-label={inDistricts ? 'Cartierele Devei' : tab === 'explore' ? 'Explorează reperele din Deva' : 'Locuri salvate'}>
          {district ? <DistrictProfile district={district} onBack={() => changeTab('districts')} onPlace={focusPlace} onShowMap={() => setMobileView('map')}/> : <>
          <div className="panel-intro">
            <div className="section-kicker"><span/>{inDistricts ? 'GEOGRAFIE LOCALĂ' : tab === 'explore' ? 'GHID INTERACTIV DE ORAȘ' : 'COLECȚIA PERSONALĂ'}</div>
            <h1>{inDistricts ? <>Cartierele <em>Devei</em></> : tab === 'explore' ? <>Descoperă <em>Deva</em></> : <>Locuri <em>salvate</em></>}</h1>
            <p className="intro-copy">{inDistricts ? 'Explorează zonele orașului, cu surse la vedere.' : tab === 'explore' ? 'Istorie, natură și cultură, loc cu loc.' : 'Reperele tale preferate, într-un singur loc.'}</p>
            {!savedEmpty && <>
              <div className="search-field"><Search size={17} strokeWidth={1.7}/><input ref={searchRef} aria-label={inDistricts ? 'Caută un cartier' : 'Caută un loc în Deva'} type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder={inDistricts ? 'Caută un cartier...' : tab === 'saved' ? 'Caută în locurile salvate...' : 'Caută un loc în Deva...'} autoComplete="off"/>
                {query ? <button onClick={() => { setQuery(''); searchRef.current?.focus() }} aria-label="Șterge căutarea"><X size={14}/></button> : <kbd>/</kbd>}
              </div>
              {inDistricts ? <p className="district-key"><i/>Contur roșu: zonă PUZ documentată<br/><span>Fără poligon: doar poziția este confirmată.</span></p> : <div className="category-filters" role="group" aria-label="Filtrează după categorie">
                {(Object.keys(categories) as Filter[]).map(cat => { const { icon: Icon, color } = categories[cat]; return <button key={cat} className={`category-chip ${filter === cat ? 'selected' : ''}`} onClick={() => chooseFilter(cat)} aria-pressed={filter === cat} style={{ '--category-color':color } as CSSProperties}><Icon size={13.5} strokeWidth={1.75}/>{cat}</button> })}
              </div>}
            </>}
          </div>
          {!savedEmpty && <div className="results-heading"><h2>{inDistricts ? 'Cartiere în atlas' : tab === 'explore' ? 'Locuri de explorat' : 'În colecția ta'}</h2><span className="result-count" aria-live="polite">{String(inDistricts ? districtList.length : filtered.length).padStart(2, '0')} <span>{inDistricts ? 'CARTIERE' : 'PE HARTĂ'}</span></span></div>}
          <div ref={listRef} className="places-list">
            {(inDistricts ? districtList : districtMatches).map(d => <DistrictRow key={d.id} district={d} onClick={() => selectDistrict(d)}/>)}
            {inDistricts && !districtList.length && <div className="empty-state"><h3>Niciun cartier găsit</h3><p>Încearcă un alt nume de cartier.</p><button className="secondary-button" onClick={() => setQuery('')}>Șterge căutarea</button></div>}
            {!inDistricts && filtered.map(place => <button key={place.id} className={`place-row ${place.id === selected?.id ? 'row-active' : ''}`} onClick={() => focusPlace(place)} aria-label={`Arată ${place.name} pe hartă`} aria-pressed={place.id === selected?.id}>
              <img className={`place-thumb thumb-${place.id}`} src={place.image} loading="lazy" alt=""/>
              <span className="place-row-copy"><span className="row-category" style={{ color:categories[place.category].color }}><i/>{place.category}</span><span className="row-name">{place.name}</span><span className="row-location"><MapPin size={11.5}/>{place.location}</span></span>
              <ChevronRight className="row-arrow" size={15}/>
            </button>)}
            {!!nameList.length && <div className="local-names"><span className="eyebrow">DENUMIRI LOCALE · FĂRĂ COORDONATE</span>{nameList.map(n => <button key={n} onClick={() => setLocalName(n)}><MapPinOff size={16}/><span><b>{n}</b><small>Localizare neconfirmată</small></span><ChevronRight size={13}/></button>)}</div>}
            {!inDistricts && !filtered.length && !nameList.length && !districtMatches.length && <div className="empty-state"><div className="empty-icon">{savedEmpty ? <Bookmark size={28} strokeWidth={1.35}/> : <Search size={27} strokeWidth={1.4}/>}</div><h3>{savedEmpty ? 'O colecție de descoperit' : 'Niciun loc găsit'}</h3>
              <p>{savedEmpty ? 'Apasă pe semnul de carte din fișa unui reper pentru a-l păstra aici.' : 'Încearcă alt nume sau alege o altă categorie de locuri.'}</p><button className="secondary-button" onClick={() => { if (savedEmpty) changeTab('explore'); else { setFilter('Toate'); setQuery('') } }}>{savedEmpty ? 'Explorează locurile' : 'Resetează filtrele'}<ArrowRight size={14}/></button></div>}
            {tab==='explore' && !query && filter==='Toate' && <Link className="editorial-link" to="/ghiduri">Dincolo de hartă: ghiduri locale <ArrowRight size={13}/></Link>}
          </div></>}
          <footer className="panel-footer"><span><Globe2 size={13}/>45°52′ N &nbsp; 22°54′ E</span><span>JUDEȚUL HUNEDOARA</span></footer>
        </aside>
        <AtlasMap visiblePlaces={mapPlaces} selected={inDistricts ? undefined : selected} saved={saved} focusRequest={focusRequest} onSelect={id => { if (inDistricts && id) { const p = places.find(p => p.id === id); if (p) focusPlace(p) } else setSelectedId(id) }} onSave={toggleSave} onDetails={setDetail} onSources={() => setAbout('sources')} district={district} districtMode={inDistricts} districtList={inDistricts ? districtList : districts} onDistrict={selectDistrict} onClearDistrict={() => changeTab('districts')} onDistrictDetails={() => setMobileView('list')}/>
        <button className="mobile-view-switch" onClick={() => setMobileView(v => v === 'map' ? 'list' : 'map')}>{mobileView === 'map' ? <List size={16}/> : <MapIcon size={16}/>} {mobileView === 'map' ? district ? 'Fișă de cartier' : inDistricts ? 'Listă de cartiere' : 'Listă de locuri' : 'Vezi harta'}<span>{inDistricts ? districtList.length : filtered.length}</span></button>
        {mobileView === 'map' && <button className="mobile-filter-trigger" aria-label="Caută și filtrează locurile" onClick={() => { setMobileView('list'); requestAnimationFrame(() => searchRef.current?.focus()) }}><SlidersHorizontal size={17}/></button>}
      </main>
      {detail && <PlaceDetails place={detail} saved={saved.includes(detail.id)} onSave={() => toggleSave(detail.id)} onClose={() => setDetail(null)}/>}
      {localName && <LocalNameDialog name={localName} onClose={() => setLocalName(null)}/>}
      {about && <AboutDialog sources={about === 'sources'} onClose={() => setAbout(null)}/>}
    </div>
  )
}

export default function App(){return <><link rel="alternate" type="application/zip" title="Atlas Deva — arhiva codului sursă" href="/assets/Atlas-Deva.zip"/><BrowserRouter><AtlasProvider><Platform MapView={MapWorkspace}/></AtlasProvider></BrowserRouter></>}
