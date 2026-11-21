import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { ArrowUpRight, Bookmark, Check, ChevronDown, Layers3, LocateFixed, Maximize, Minus, Plus, X, ListFilter, Mountain, Map as MapIcon } from 'lucide-react'
import { categories } from '../lib/places'
import { useAtlas } from '../lib/atlas-store'
import { Link, useSearchParams } from 'react-router-dom'
import type { Category, Place } from '../lib/places'
import { CompassRose } from './Brand'
import { districts, extent, pathOf, metersPerUnit } from '../lib/local-geography'
import type { District } from '../lib/local-geography'
import { DistrictCaption } from './Districts'

type Camera = { x: number, y: number, zoom: number }
type Point = { x: number, y: number }
const HOME: Camera = { x: 2435, y: 2090, zoom: 1 }
const MAX_ZOOM = 10
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const isMapControl = (element: EventTarget | null) => element instanceof Element && !!element.closest('[data-map-ui]')

interface MapProps {
  visiblePlaces: Place[]
  selected: Place | undefined
  saved: string[]
  focusRequest: { id: string, key: number } | null
  onSelect: (id: string | null) => void
  onSave: (id: string) => void
  onDetails: (place: Place) => void
  onSources: () => void
  district?: District
  districtMode: boolean
  districtList: District[]
  onDistrict: (district: District) => void
  onClearDistrict: () => void
  onDistrictDetails: () => void
}

function Pin({ place, active, onClick, style, compact }: { place: Place, active: boolean, onClick: () => void, style: CSSProperties, compact: boolean }) {
  const { icon: Icon, color } = categories[place.category]
  return <button data-map-ui className={`map-pin ${active ? 'is-active' : ''} ${compact && !active ? 'compact-pin' : ''} pin-${place.label}`} title={place.name} style={{ ...style, '--pin-color': color } as CSSProperties}
    onClick={onClick} aria-label={`Selectează ${place.name}`} aria-pressed={active}>
    <span className="pin-art">
      <svg className="pin-drop" width="38" height="46" viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2C10.2 2 2 9.4 2 19.2c0 10.5 13.6 23.5 17 26.5a1.5 1.5 0 0 0 2 0c3.4-3 17-16 17-26.5C38 9.4 29.8 2 20 2Z" fill={color} stroke="#fffdf3" strokeWidth="2.7"/></svg>
      <Icon className="pin-icon" size={18} strokeWidth={1.7}/>
    </span>
    <span className="pin-label">{place.shortName || place.name}</span>
  </button>
}

export function AtlasMap({ visiblePlaces, selected, saved, focusRequest, onSelect, onSave, onDetails, onSources, district, districtMode, districtList, onDistrict, onClearDistrict, onDistrictDetails }: MapProps) {
  const {places, walk}=useAtlas(),[mapParams]=useSearchParams()
  const showWalk=mapParams.get('traseu')==='1'&&walk
  const root = useRef<HTMLElement>(null)
  const [size, setSize] = useState({ w: 1000, h: 760 })
  const [camera, setCamera] = useState<Camera>(() => ({ ...HOME, x: window.innerWidth <= 700 ? 2385 : HOME.x }))
  const [dragging, setDragging] = useState(false)
  const [layersOpen, setLayersOpen] = useState(false)
  const [legendOpen, setLegendOpen] = useState(false)
  const [terrain, setTerrain] = useState(true)
  const [labels, setLabels] = useState(true)
  const [districtLabels, setDistrictLabels] = useState(true)
  const [zoomPanel, setZoomPanel] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const legendRef = useRef<HTMLDivElement>(null)
  const isMobile = size.w < 560
  const baseScale = Math.min(size.w / (isMobile ? 945 : 1800), size.h / (isMobile ? 850 : 1320))
  const scale = baseScale * camera.zoom
  const minZoom = Math.max(size.w, size.h) / (5120 * baseScale)
  const cameraRef = useRef(camera)
  const goal = useRef<Camera | null>(null)
  const candidates = useRef(visiblePlaces)
  useLayoutEffect(() => { candidates.current = visiblePlaces }, [visiblePlaces])
  const dimsRef = useRef({ ...size, baseScale })
  useLayoutEffect(() => { cameraRef.current = camera }, [camera])
  useLayoutEffect(() => { dimsRef.current = { ...size, baseScale } }, [size, baseScale])
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<{ camera: Camera, mid: Point, dist: number, moved: boolean, multi: boolean } | null>(null)
  const frame = useRef(0)

  useEffect(() => {
    if (!root.current) return
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ w: width, h: height })
    })
    obs.observe(root.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(q.matches)
    update(); q.addEventListener('change', update)
    return () => { q.removeEventListener('change', update); cancelAnimationFrame(frame.current) }
  }, [])

  const bound = useCallback((cam: Camera) => {
    const d = dimsRef.current
    const zoom = clamp(cam.zoom, Math.max(d.w, d.h) / (5120 * d.baseScale), MAX_ZOOM)
    const halfW = Math.min(2560, d.w / (2 * d.baseScale * zoom))
    const halfH = Math.min(2560, d.h / (2 * d.baseScale * zoom))
    return { zoom, x: clamp(cam.x, halfW, 5120 - halfW), y: clamp(cam.y, halfH, 5120 - halfH) }
  }, [])

  const flyTo = useCallback((target: Camera) => {
    cancelAnimationFrame(frame.current)
    const from = cameraRef.current
    const to = bound(target)
    goal.current = to
    if (reduceMotion) { frame.current = requestAnimationFrame(() => { setCamera(to); goal.current = null }); return }
    const started = performance.now()
    const animate = (now: number) => {
      const n = Math.min(1, (now - started) / 340)
      const f = 1 - (1 - n) ** 3
      setCamera(bound({ x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f, zoom: from.zoom * (to.zoom / from.zoom) ** f }))
      if (n < 1) frame.current = requestAnimationFrame(animate)
      else goal.current = null
    }
    frame.current = requestAnimationFrame(animate)
  }, [bound, reduceMotion])

  const fit = useCallback((items: Point[], max = 3.6) => {
    if (!items.length) return
    const d = dimsRef.current, b = extent(items)
    const zoom = Math.min(max, (d.w - Math.min(122, d.w * .24)) / (Math.max(1, b.r-b.l) * d.baseScale), (d.h - Math.min(202, d.h * .30)) / (Math.max(1, b.b-b.t) * d.baseScale))
    flyTo({ x: (b.l+b.r)/2, y: (b.t+b.b)/2, zoom })
  }, [flyTo])

  useEffect(() => {
    // Resizing a phone or panel must not expose the outside of the map sheet.
    const id = requestAnimationFrame(() => setCamera(c => bound(c)))
    return () => cancelAnimationFrame(id)
  }, [size, bound])

  useEffect(() => {
    if (!focusRequest) return
    if (focusRequest.id === '__home__') { flyTo({ ...HOME, x: window.innerWidth <= 700 ? 2385 : HOME.x }); return }
    if (focusRequest.id === '__districts__') { fit(districts.flatMap(d => d.ring || [d])); return }
    if (focusRequest.id === '__results__') { fit(candidates.current); return }
    if (focusRequest.id === '__walk__' && walk) { fit(walk.points); return }
    if (focusRequest.id.startsWith('district:')) {
      const d = districts.find(d => `district:${d.id}` === focusRequest.id)
      if (d) { if (d.ring) fit(d.ring, 4.5); else flyTo({ x:d.x, y:d.y, zoom:1.7 }) }
      return
    }
    const p = places.find(p => p.id === focusRequest.id)
    if (p) {
      const d = dimsRef.current
      const zoom = clamp(cameraRef.current.zoom, 1.35, 3.5)
      flyTo({ x: p.x, y: p.y - d.h * 0.12 / (d.baseScale * zoom), zoom })
    }
  }, [focusRequest, flyTo, fit, places, walk])

  const zoomAt = useCallback((factor: number, anchor?: Point, animate = true) => {
    const d = dimsRef.current, c = goal.current || cameraRef.current
    const a = anchor || { x: d.w / 2, y: d.h / 2 }
    const z = clamp(c.zoom * factor, Math.max(d.w, d.h) / (5120 * d.baseScale), MAX_ZOOM)
    const oldScale = d.baseScale * c.zoom, newScale = d.baseScale * z
    const to = bound({ x: c.x + (a.x - d.w / 2) * (1 / oldScale - 1 / newScale), y: c.y + (a.y - d.h / 2) * (1 / oldScale - 1 / newScale), zoom: z })
    if (animate) flyTo(to)
    else { cancelAnimationFrame(frame.current); goal.current = to; frame.current = requestAnimationFrame(() => { setCamera(to); cameraRef.current = to; goal.current = null }) }
  }, [bound, flyTo])

  useEffect(() => {
    const el = root.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      if (isMapControl(e.target) && !(e.target instanceof Element && e.target.closest('.map-pin, .district-label'))) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const delta = clamp(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? r.height : 1), -240, 240)
      zoomAt(Math.exp(-delta * (e.ctrlKey ? .006 : .0022)), { x: e.clientX - r.left, y: e.clientY - r.top }, false)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [zoomAt])

  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!layerRef.current?.contains(e.target as Node)) setLayersOpen(false)
      if (!legendRef.current?.contains(e.target as Node)) setLegendOpen(false)
      if (!(e.target instanceof Element && e.target.closest('.map-navigation'))) setZoomPanel(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLayersOpen(false); setLegendOpen(false); setZoomPanel(false) } }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc) }
  }, [])

  function getGesture() {
    const pts = [...pointers.current.values()]
    if (pts.length < 2) return { mid: pts[0], dist: 0 }
    return { mid: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y) }
  }
  function localPoint(e: ReactPointerEvent) { const r = root.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  function startDrag(e: ReactPointerEvent<HTMLElement>) {
    if (isMapControl(e.target) || e.button !== 0) return
    cancelAnimationFrame(frame.current)
    goal.current = null
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, localPoint(e))
    gesture.current = { camera: cameraRef.current, ...getGesture(), moved: false, multi: pointers.current.size > 1 }
    setDragging(true)
  }
  function moveDrag(e: ReactPointerEvent<HTMLElement>) {
    const g = gesture.current
    if (!g || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, localPoint(e))
    const { mid, dist } = getGesture()
    if (Math.abs(mid.x - g.mid.x) + Math.abs(mid.y - g.mid.y) > 4 || dist) g.moved = true
    const z = g.dist && dist ? clamp(g.camera.zoom * dist / g.dist, minZoom, MAX_ZOOM) : g.camera.zoom
    const s0 = baseScale * g.camera.zoom, s1 = baseScale * z
    setCamera(bound({ x: g.camera.x + (g.mid.x - size.w / 2) / s0 - (mid.x - size.w / 2) / s1, y: g.camera.y + (g.mid.y - size.h / 2) / s0 - (mid.y - size.h / 2) / s1, zoom: z }))
  }
  function endDrag(e: ReactPointerEvent<HTMLElement>, cancelled = false) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    if (!pointers.current.size) {
      if (!cancelled && gesture.current && !gesture.current.moved && !gesture.current.multi) onSelect(null)
      setDragging(false); gesture.current = null
    } else gesture.current = { camera: cameraRef.current, ...getGesture(), moved: true, multi: true }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function position(p: Point) { return { x: size.w / 2 + (p.x - camera.x) * scale, y: size.h / 2 + (p.y - camera.y) * scale } }
  function selectPin(place: Place) {
    const pos = position(place)
    onSelect(place.id)
    if (pos.y < 315 || pos.y > size.h - 55 || pos.x < 55 || pos.x > size.w - 55) {
      flyTo({ ...camera, x: place.x, y: place.y - size.h * .13 / scale })
    }
  }
  const pinPos = selected && position(selected)
  const popupW = isMobile ? 221 : 246
  const popupX = pinPos ? clamp(pinPos.x - popupW / 2, 12, size.w - popupW - 12) : 0
  const showPopup = !!(selected && pinPos && pinPos.x > -2 && pinPos.x < size.w + 2 && pinPos.y > 0 && pinPos.y < size.h + 3)
  const popupBelow = !!pinPos && pinPos.y < 267
  const scaleDistance = [10, 20, 50, 100, 200, 500, 1000, 2000].filter(n => n * scale / metersPerUnit <= 104).pop() || 10
  const scaleLength = scaleDistance / metersPerUnit * scale
  const fitVisible = () => fit(district?.ring || (districtMode ? districtList.flatMap(d => d.ring || [d]) : visiblePlaces))

  return <section className={`atlas-map ${dragging ? 'is-dragging' : ''} ${terrain ? '' : 'street-view'}`} ref={root}
    aria-label="Hartă interactivă a orașului Deva" tabIndex={0}
    onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={e => endDrag(e)} onPointerCancel={e => endDrag(e, true)}
    onDoubleClick={e => { if (!isMapControl(e.target)) { const r = root.current!.getBoundingClientRect(); zoomAt(1.5, { x:e.clientX-r.left, y:e.clientY-r.top }) } }}
    onKeyDown={e => {
      if (isMapControl(e.target)) return
      const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
      if (dirs[e.key]) { e.preventDefault(); const [dx, dy] = dirs[e.key]; flyTo({ ...camera, x: camera.x + dx * 95 / scale, y: camera.y + dy * 95 / scale }) }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(1.35) }
      if (e.key === '-') { e.preventDefault(); zoomAt(1/1.35) }
      if (e.key === 'Home') { e.preventDefault(); flyTo(HOME) }
    }}>
    <div className="map-ground" aria-hidden="true" style={{ transform: `translate3d(${size.w / 2 - camera.x * scale}px, ${size.h / 2 - camera.y * scale}px, 0) scale(${scale})` }}>
      <img className="map-sheet land-sheet" src="/map/land.svg" alt="" draggable="false"/>
      {terrain && <img className="map-sheet" src="/map/terrain.svg" alt="" draggable="false"/>}
      <img className="map-sheet street-sheet" src="/map/streets.svg" alt="" draggable="false"/>
      {labels && <img className="map-sheet" src={camera.zoom > 3.7 ? '/map/labels-detail.svg' : '/map/labels.svg'} alt="" draggable="false"/>}
    </div>
    {district?.ring && <svg className="district-outline" width={size.w} height={size.h} aria-label={`Perimetrul PUZ ${district.name}, conform planșei primăriei`}><path d={pathOf(district.ring.map(position))} fill="#cb45371a" stroke="#bf3f34" strokeWidth="2.6" strokeLinejoin="round"/></svg>}
    <div className="map-paper" aria-hidden="true"/>
    {showWalk&&<><svg className="district-outline" width={size.w} height={size.h} aria-label="Traseu calculat pe rețeaua pietonală"><polyline points={walk.points.map(p=>{const q=position(p);return `${q.x},${q.y}`}).join(' ')} fill="none" stroke="#56804d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/></svg><Link className="walk-caption" data-map-ui to="/trasee">Traseul meu · {(walk.meters/1000).toFixed(2)} km · ≈ {walk.minutes} min <ArrowUpRight size={13}/></Link></>}
    <div className="map-topline">
      <div className="map-location"><span className="live-dot"/>Deva, România</div>
      <div ref={layerRef} data-map-ui className="layer-control">
        <button className={`map-control layer-trigger ${layersOpen ? 'control-active' : ''}`} onClick={() => setLayersOpen(v => !v)} aria-expanded={layersOpen} aria-controls="layer-panel"><Layers3 size={16}/>Straturi<ChevronDown size={13} className={layersOpen ? 'turned' : ''}/></button>
        {layersOpen && <div className="layer-panel pop-panel" id="layer-panel">
          <p className="eyebrow">STILUL HĂRȚII</p>
          <div className="style-options">
            <button onClick={() => setTerrain(true)} className={terrain ? 'chosen' : ''} aria-pressed={terrain}><span className="style-preview topo-preview"><Mountain size={23}/></span>Topografică{terrain && <span className="style-check"><Check size={10}/></span>}</button>
            <button onClick={() => setTerrain(false)} className={!terrain ? 'chosen' : ''} aria-pressed={!terrain}><span className="style-preview street-preview"><MapIcon size={23}/></span>Stradală{!terrain && <span className="style-check"><Check size={10}/></span>}</button>
          </div>
          <button role="switch" aria-checked={labels} className="switch-row" onClick={() => setLabels(v => !v)}>Denumiri pe hartă<span className={`toggle ${labels ? 'on' : ''}`}/></button>
          {!districtMode && <button role="switch" aria-checked={districtLabels} className="switch-row" onClick={() => setDistrictLabels(v => !v)}>Nume de cartiere<span className={`toggle ${districtLabels ? 'on' : ''}`}/></button>}
          <Link className="map-archive-link" to="/ghiduri/harta-iosefina"><img src="/images/field/old-map-preview.webp" alt=""/><span><small>COLECȚIE ISTORICĂ</small><b>Planșa din 1769–1773</b><em>Document separat, fără suprapunere</em></span><ArrowUpRight size={13}/></Link>
        </div>}
      </div>
    </div>
    {(districtMode || (labels && districtLabels)) && districtList.map(d => {
      const pos = position(d), active = d.id === district?.id
      if (pos.x < -5 || pos.x > size.w+5 || pos.y < 0 || pos.y > size.h) return null
      if (!districtMode && (visiblePlaces.some(p => Math.abs((p.x-d.x)*scale) < 68 && Math.abs((p.y-d.y)*scale) < 51) || camera.zoom < .66)) return null
      return <button data-map-ui key={d.id} className={`district-label ${districtMode ? 'district-layer-label' : ''} ${active ? 'active' : ''}`} onClick={() => onDistrict(d)} style={{ left:pos.x, top:pos.y }} aria-label={`Cartier: ${d.name}`} aria-pressed={active}>{districtMode && <i/>}{d.name}</button>
    })}
    {visiblePlaces.map(p => { const pos = position(p); return <Pin key={p.id} place={p} compact={!!p.cartogram && camera.zoom < 1.9 && (visiblePlaces.length > 8 || districtMode)} active={p.id === selected?.id} onClick={() => selectPin(p)} style={{ left:pos.x, top:pos.y }}/> })}
    {district && <DistrictCaption district={district} onClose={onClearDistrict} onDetails={onDistrictDetails}/>}
    {showPopup && selected && pinPos && <article data-map-ui key={selected.id} className={`place-popup ${popupBelow ? 'popup-below' : ''}`} aria-label={`Fișă reper: ${selected.name}`}
        style={{ width: popupW, left: popupX, ...(popupBelow ? { top:pinPos.y + 33 } : { bottom:size.h - pinPos.y + 51 }), '--arrow-x': `${clamp(pinPos.x - popupX, 22, popupW - 22)}px` } as CSSProperties & { '--arrow-x': string }}>
      <div className="popup-photo"><img src={selected.preview || selected.image} alt={selected.cartogram ? `Extras de hartă: ${selected.name}` : selected.name}/>{selected.cartogram && <small className="cartogram-caption">EXTRAS DE HARTĂ</small>}
        <span className="photo-category"><span style={{ background: categories[selected.category].color }}/>{selected.category}</span>
        <button className="popup-close" onClick={() => onSelect(null)} aria-label="Închide fișa de pe hartă"><X size={14}/></button>
      </div>
      <div className="popup-body"><h2>{selected.name}</h2><p>{selected.intro}</p>
        <div className="popup-actions"><button className="text-action" onClick={() => onDetails(selected)}>Vezi detalii <ArrowUpRight size={15}/></button>
          <button className={`save-icon ${saved.includes(selected.id) ? 'is-saved' : ''}`} onClick={() => onSave(selected.id)} aria-pressed={saved.includes(selected.id)} aria-label={saved.includes(selected.id) ? `Elimină ${selected.name} din locurile salvate` : `Salvează ${selected.name}`} title={saved.includes(selected.id) ? 'Elimină din salvate' : 'Salvează locul'}><Bookmark size={16} fill={saved.includes(selected.id) ? 'currentColor' : 'none'}/></button>
        </div>
      </div>
    </article>}
    <div className="map-navigation" data-map-ui>
      <button className="map-control center-map" onClick={fitVisible} disabled={!districtMode && !visiblePlaces.length} aria-label="Încadrează toate rezultatele" title="Încadrează toate rezultatele"><Maximize size={17}/></button>
      <button className="map-control center-map" onClick={() => flyTo(HOME)} title="Recentrează harta" aria-label="Recentrează harta"><LocateFixed size={19}/></button>
      <div className="zoom-stack"><button onClick={() => zoomAt(Math.SQRT2)} disabled={camera.zoom >= MAX_ZOOM-.001} title="Mărește harta" aria-label="Mărește harta"><Plus size={20}/></button><button className="zoom-value" onClick={() => setZoomPanel(v => !v)} aria-label="Alege nivelul de zoom" aria-expanded={zoomPanel}>{Number(camera.zoom.toFixed(1))}×</button><button onClick={() => zoomAt(1/Math.SQRT2)} disabled={camera.zoom <= minZoom+.001} title="Micșorează harta" aria-label="Micșorează harta"><Minus size={20}/></button></div>
      {zoomPanel && <div className="zoom-panel pop-panel"><label htmlFor="atlas-zoom">Nivel de zoom <b>{Math.round(camera.zoom*100)}%</b></label><input id="atlas-zoom" type="range" min="0" max="100" step="1" aria-valuetext={`${Math.round(camera.zoom*100)}%`} value={Math.round(100*Math.log(camera.zoom/minZoom)/Math.log(MAX_ZOOM/minZoom))} onChange={e => zoomAt(minZoom*(MAX_ZOOM/minZoom)**(Number(e.target.value)/100) / (goal.current || cameraRef.current).zoom, undefined, false)}/><div><span>Ansamblu</span><span>Detaliu</span></div></div>}
    </div>
    <div className="map-lower-left">
      <div className="compass-rose"><CompassRose size={48}/></div>
      <div data-map-ui ref={legendRef} className="legend-control">
        {legendOpen && <div className="legend-panel pop-panel"><div className="legend-heading"><span className="eyebrow">LEGENDA HĂRȚII</span><button onClick={() => setLegendOpen(false)} aria-label="Închide legenda"><X size={14}/></button></div>
          {(Object.keys(categories).filter(c => c !== 'Toate') as Category[]).map(cat => { const { icon: Icon, color } = categories[cat]; return <div className="legend-item" key={cat}><span style={{ background:color }}><Icon size={13}/></span>{cat}</div> })}
          <p>Alege un reper pentru a-i descoperi povestea.</p>
        </div>}
        <button className="legend-trigger map-control" onClick={() => setLegendOpen(v => !v)} aria-expanded={legendOpen}><ListFilter size={15}/>Legendă</button>
      </div>
    </div>
    <div className="map-bottomline"><div className="map-scale"><span style={{ width:scaleLength }}/>{scaleDistance >= 1000 ? `${scaleDistance/1000} km` : `${scaleDistance} m`}</div><button data-map-ui onClick={onSources}>© OpenStreetMap <span>·</span> Surse cartografice</button></div>
    <span className="sr-only" aria-live="polite">{visiblePlaces.length} repere afișate pe hartă. Folosește săgețile pentru deplasare și tastele plus și minus pentru zoom.</span>
  </section>
}
