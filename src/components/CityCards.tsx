import {
  Bookmark,
  ArrowUpRight,
  MapPin,
  ArrowRight,
  CloudSun,
  Cloud,
  Sun,
  CloudRain,
  RefreshCw,
  Radio,
  Wind,
  CalendarDays,
  Map,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { categories } from '../lib/places'
import type { Place } from '../lib/places'
import { useAtlas } from '../lib/atlas-store'
import { eventEnded, formatDate, placePath } from '../lib/city-data'
import type { CityEvent } from '../lib/city-data'
import { sky, useWeather } from '../lib/weather'
export function PlaceCard({ place: p }: { place: Place }) {
  const { saved, toggleSave } = useAtlas()
  const { icon: Icon, color } = categories[p.category]
  return (
    <article className="city-place-card">
      <div className="card-media">
        <Link to={placePath(p)} tabIndex={-1} aria-hidden="true">
          <img
            src={p.image}
            loading="lazy"
            alt={p.cartogram ? `Hartă de context pentru ${p.name}` : p.name}
          />
        </Link>
        <button
          className={`card-save ${saved.includes(p.id) ? 'chosen' : ''}`}
          title={saved.includes(p.id) ? 'Elimină din favorite' : 'Adaugă la favorite'}
          aria-label={`${saved.includes(p.id) ? 'Elimină' : 'Salvează'} ${p.name}`}
          aria-pressed={saved.includes(p.id)}
          onClick={() => toggleSave(p.id)}
        >
          <Bookmark size={15} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
        </button>
        {p.cartogram && (
          <span className="crop-label">
            <Map size={10} />
            Extras de hartă
          </span>
        )}
      </div>
      <div className="city-card-info">
        <span className="card-cat" style={{ color }}>
          <Icon size={12} />
          {p.businessType || p.category}
        </span>
        <Link to={placePath(p)}>
          <h3>{p.name}</h3>
        </Link>
        <p>
          <MapPin size={12} />
          {p.location}
        </p>
      </div>
    </article>
  )
}
export function SectionTitle({
  eyebrow,
  title,
  to,
  label = 'Vezi toate',
}: {
  eyebrow?: string
  title: string
  to?: string
  label?: string
}) {
  return (
    <div className="city-section-title">
      <div>
        {eyebrow && <span className="city-eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {to && (
        <Link to={to}>
          {label}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  )
}
export function WeatherCard({ large = false }: { large?: boolean }) {
  const { w, loading, error, stale, retry } = useWeather()
  const Icon = w && w.code < 2 ? Sun : w && w.code > 49 ? CloudRain : w && w.code >= 3 ? Cloud : CloudSun
  return (
    <section className={`weather-card ${large ? 'large' : ''}`} aria-label="Vremea în Deva">
      <div className="weather-label">
        <span>
          <MapPin size={12} />
          Deva, România
        </span>
        <button onClick={retry} disabled={loading} aria-label="Actualizează vremea">
          <RefreshCw size={12} className={loading ? 'spinning' : ''} />
        </button>
      </div>
      {w ? (
        <>
          <div className="weather-reading">
            <div>
              <strong>
                {Math.round(w.temperature)}
                <sup>°</sup>
              </strong>
              <p>{sky(w.code)}</p>
            </div>
            <Icon size={60} strokeWidth={1.45} />
          </div>
          <div className="weather-bottom">
            <span>
              <Wind size={12} />
              {w.wind} km/h
            </span>
            <a href="https://open-meteo.com/" rel="noreferrer" target="_blank">
              Open-Meteo
              <ArrowUpRight size={10} />
            </a>
          </div>
          <small>
            {stale ? 'Ultima valoare disponibilă' : 'Date meteo'} ·{' '}
            {formatDate(w.time, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </small>
        </>
      ) : (
        <p className="weather-unavailable">
          {loading
            ? 'Se încarcă vremea…'
            : error
              ? 'Sursa meteo nu răspunde. Reîncearcă actualizarea.'
              : 'Date indisponibile.'}
        </p>
      )}
    </section>
  )
}
export function EventRow({ event: e }: { event: CityEvent }) {
  return (
    <a className="event-row" href={e.source} target="_blank" rel="noreferrer">
      <span className="date-ticket">
        <small>{formatDate(e.start, { month: 'short' }).replace('.', '')}</small>
        <b>{formatDate(e.start, { day: '2-digit' })}</b>
      </span>
      <span>
        <small>
          {e.type}
          {eventEnded(e) ? ' · Arhivă' : ''}
        </small>
        <b>{e.title}</b>
        <em>
          {formatDate(e.start, { hour: '2-digit', minute: '2-digit' })} · {e.venue}
        </em>
      </span>
      <ArrowUpRight size={13} />
    </a>
  )
}
export function LiveAside() {
  const { events } = useAtlas()
  return (
    <aside className="home-live">
      <div className="aside-title">
        <span className="live-signal" />
        <h2>Deva Live</h2>
        <Link to="/live" aria-label="Deschide Deva Live">
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <WeatherCard />
      <div className="agenda-small">
        <div>
          <CalendarDays size={13} />
          <span>ÎN AGENDĂ</span>
        </div>
        {events
          .filter((e) => !eventEnded(e))
          .slice(0, 1)
          .map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        {!events.some((e) => !eventEnded(e)) && <p>Niciun eveniment viitor confirmat în selecție.</p>}
      </div>
    </aside>
  )
}
export function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="city-empty">
      <MapPin size={25} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}
export function SourceNote({ source, date }: { source: string; date: string }) {
  return (
    <p className="source-note">
      <Radio size={12} />
      Verificat la {formatDate(date)}{' '}
      <a href={source} target="_blank" rel="noreferrer">
        Sursa originală <ExternalLink size={10} />
      </a>
    </p>
  )
}
