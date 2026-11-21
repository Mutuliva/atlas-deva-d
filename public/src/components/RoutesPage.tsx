import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Clock3, Footprints, Map, Navigation, Plus, Route, Trash2 } from 'lucide-react'
import { useAtlas } from '../lib/atlas-store'
import { trails, walkingUrl } from '../lib/city-data'
import { calculateWalk } from '../lib/walking'
import { PageHeading } from './CityPages'
import type { Place } from '../lib/places'
export default function RoutesPage() {
  const { places, routeIds, setRouteIds, walk, setWalk, toast } = useAtlas()
  const [params] = useSearchParams()
  const template = trails.find((t) => t.id === params.get('model'))
  const [choice, setChoice] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('')
  const pending = useRef(0)
  const stops = routeIds.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => !!p)
  const eligible = places.filter((p) => !p.representative && !routeIds.includes(p.id))
  const update = (ids: string[]) => {
    pending.current++
    setBusy(false)
    setMessage('')
    setRouteIds(ids)
  }
  const move = (i: number, k: number) => {
    const a = [...routeIds]
    ;[a[i], a[k]] = [a[k], a[i]]
    update(a)
  }
  const calc = async () => {
    const seq = ++pending.current
    setBusy(true)
    setMessage('')
    try {
      const r = await calculateWalk(stops)
      if (seq === pending.current) {
        setWalk(r)
        toast('Traseul pietonal a fost calculat')
      }
    } catch (e) {
      if (seq === pending.current) setMessage(e instanceof Error ? e.message : 'Calculul nu a reușit.')
    } finally {
      if (seq === pending.current) setBusy(false)
    }
  }
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="LA PAS PRIN DEVA"
        title="Traseele mele"
        sub="Alege o plimbare din atlas sau construiește un itinerar cu două până la șase opriri."
      />
      <div className="trail-presets">
        {trails.map((t) => (
          <button
            key={t.id}
            className={template?.id === t.id ? 'selected' : ''}
            onClick={() => update(t.stops.filter((id) => places.some((p) => p.id === id)))}
          >
            <img src={t.image} alt="" />
            <span>
              <small>{t.label}</small>
              <b>{t.name}</b>
              <em>
                {t.stops.length} opriri <ArrowUp size={12} />
              </em>
            </span>
          </button>
        ))}
      </div>
      <section className="route-editor">
        <div className="section-row">
          <div>
            <span className="city-eyebrow">ITINERAR PERSONALIZAT</span>
            <h2>Plimbarea ta</h2>
          </div>
          <span className="neutral-pill">{stops.length} / 6 opriri</span>
        </div>
        {template && !stops.length && (
          <button
            className="city-btn outline"
            onClick={() => update(template.stops.filter((id) => places.some((p) => p.id === id)))}
          >
            Folosește „{template.name}”
          </button>
        )}
        {!stops.length && (
          <p className="muted-note">
            Pornește de la unul dintre traseele de mai sus sau adaugă primul loc. Selecția se păstrează numai
            în acest browser.
          </p>
        )}
        <ol className="route-stops">
          {stops.map((p, i) => (
            <li key={p.id}>
              <span>{i + 1}</span>
              <div>
                <b>{p.name}</b>
                <small>{p.location}</small>
              </div>
              <button disabled={i === 0} aria-label={`Mută ${p.name} mai sus`} onClick={() => move(i, i - 1)}>
                <ArrowUp size={14} />
              </button>
              <button
                disabled={i === stops.length - 1}
                aria-label={`Mută ${p.name} mai jos`}
                onClick={() => move(i, i + 1)}
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={() => update(routeIds.filter((id) => id !== p.id))}
                aria-label={`Elimină oprirea ${p.name}`}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ol>
        <div className="add-stop">
          <select
            aria-label="Alege o oprire"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            disabled={stops.length >= 6}
          >
            <option value="">Selectează un loc din atlas…</option>
            {eligible.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="city-btn outline"
            disabled={!choice || stops.length >= 6 || routeIds.includes(choice)}
            onClick={() => {
              update([...routeIds, choice])
              setChoice('')
            }}
          >
            <Plus size={14} />
            Adaugă
          </button>
        </div>
        <button className="city-btn" onClick={calc} disabled={busy || stops.length < 2}>
          <Footprints size={16} />
          {busy ? 'Se calculează…' : 'Calculează traseul'}
        </button>
        {message && (
          <p className="form-message" role="alert">
            {message}
          </p>
        )}
        {walk && (
          <div className="route-summary">
            <div>
              <span>
                <Route size={18} />
                {(walk.meters / 1000).toLocaleString('ro-RO', { maximumFractionDigits: 2 })} km
              </span>
              <span>
                <Clock3 size={17} />≈ {walk.minutes} min
              </span>
            </div>
            <p>
              Lungime pe rețeaua pietonală OSM, între nodurile cele mai apropiate. Accesul dintre reper și
              rețea (până la {walk.snap} m) nu este inclus. Timp estimat la 4,2 km/h, fără opriri sau corecție
              pentru pantă.
            </p>
            <Link className="city-btn" to="/harta?traseu=1">
              <Map size={15} />
              Traseul pe hartă
            </Link>
            <a className="city-btn outline" href={walkingUrl(stops)} target="_blank" rel="noreferrer">
              <Navigation size={14} />
              Navighează în Google Maps
            </a>
          </div>
        )}
        <p className="source-note">
          © OpenStreetMap · extras local 19.11.2026. Nu verifică lucrări, acces temporar sau accesibilitatea
          pentru mobilitate redusă.
        </p>
      </section>
    </main>
  )
}
