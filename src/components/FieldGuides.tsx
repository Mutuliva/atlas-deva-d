import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderOpen,
  Landmark,
  Map as MapIcon,
  MapPin,
  Printer,
  Scan,
  ScrollText,
} from 'lucide-react'
import { archive, archivePath, fieldEdition, fieldGuides, fieldPath, fieldTopics } from '../lib/field-guides'
import type { FieldGuide } from '../lib/field-guides'
import { normalize } from '../lib/places'
import { readLocal, writeLocal } from '../lib/client'
import { Dialog } from './Dialogs'
import { Empty } from './CityCards'
import { PageHeading, SearchBox } from './CityPages'
import { HistoricalSheet } from './HistoricalSheet'
import './field-guides.css'

const KEY = 'deva-atlas:lecturi:v1'
const navPlaces = [
  { name: 'Archia', lat: 45.84333, lon: 22.90139 },
  { name: 'Cristur', lat: 45.82528, lon: 22.9425 },
  { name: 'Bârcea Mică', lat: 45.82167, lon: 22.955 },
]
const geoUrl = (lat: number, lon: number) =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`
function PhotoCredit({ guide }: { guide: FieldGuide }) {
  const p = guide.photo
  const licenseUrl =
    p.license === 'CC0'
      ? 'https://creativecommons.org/publicdomain/zero/1.0/'
      : p.license === 'CC BY-SA 3.0 RO'
        ? 'https://creativecommons.org/licenses/by-sa/3.0/ro/'
        : p.license === 'CC BY-SA 4.0'
          ? 'https://creativecommons.org/licenses/by-sa/4.0/'
          : p.license === 'CC BY-SA 3.0'
            ? 'https://creativecommons.org/licenses/by-sa/3.0/'
            : undefined
  return (
    <figcaption>
      {p.caption}{' '}
      <a href={p.url} target="_blank" rel="noreferrer">
        {p.author} <ExternalLink size={10} />
      </a>{' '}
      ·{' '}
      {licenseUrl ? (
        <a href={licenseUrl} target="_blank" rel="noreferrer">
          {p.license}
        </a>
      ) : (
        p.license
      )}
      . Reproducere redimensionată; în carduri, decupaj.
    </figcaption>
  )
}
function ReadingButton({
  saved,
  toggle,
  name,
  compact = false,
}: {
  saved: boolean
  toggle: () => void
  name: string
  compact?: boolean
}) {
  return (
    <button
      className={compact ? `card-save ${saved ? 'chosen' : ''}` : 'city-btn outline reading-action'}
      onClick={toggle}
      aria-pressed={saved}
      aria-label={`${saved ? 'Elimină din lecturi' : 'Salvează pentru lectură'}: ${name}`}
    >
      <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
      {!compact && (saved ? 'Lectură salvată' : 'Salvează lectura')}
    </button>
  )
}
function ArchiveFeature() {
  return (
    <Link className="archive-feature" to={archivePath} aria-label="Deschide harta iosefină a Devei">
      <div className="archive-feature-copy">
        <span className="field-series">
          <i />
          ARHIVA CARTOGRAFICĂ
        </span>
        <h2>
          Deva, pe o hartă
          <br />
          <em>de secol XVIII.</em>
        </h2>
        <p>O planșă originală, o altă perspectivă asupra orașului de pe Mureș.</p>
        <b>
          <Scan size={15} />
          Explorează planșa <ArrowUpRight size={14} />
        </b>
      </div>
      <div className="archive-feature-image">
        <img src={archive.preview} alt="Detaliu autentic din planșa 183 a ridicării iosefine" />
        <span>
          PLANȘA 183 <i /> 1769—1773
        </span>
      </div>
    </Link>
  )
}
function GuideArticle({
  guide: g,
  saved,
  toggle,
}: {
  guide: FieldGuide
  saved: boolean
  toggle: () => void
}) {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  useEffect(() => {
    document.title = `${g.title} · Ghiduri locale · Atlas Deva`
  }, [g.title])
  return (
    <main className="city-page field-page field-article">
      <Link className="back-link" to="/ghiduri">
        <ArrowLeft size={14} />
        Toate ghidurile
      </Link>
      <div className="field-article-head">
        <span className="city-eyebrow">
          <i />
          {g.topics.join(' / ')} · GHID DE TEREN
        </span>
        <h1>{g.title}</h1>
        <p>{g.intro}</p>
        <div className="field-dateline">
          <span>
            <MapPin size={13} />
            {g.region}
          </span>
          <span>
            <FileText size={13} />
            Documentat la {fieldEdition}
          </span>
        </div>
      </div>
      <div className="field-reading-layout">
        <article className="field-reading">
          <figure>
            <img src={g.photo.src} alt={g.photo.caption} />
            <PhotoCredit guide={g} />
          </figure>
          {g.sections.map((s, i) => (
            <section id={`capitol-${i + 1}`} className="field-chapter" key={s.title}>
              <span className="field-chapter-n">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{s.title}</h2>
                <p>
                  {s.text}{' '}
                  <span className="ref-links">
                    {s.refs.map((n) => (
                      <a
                        key={n}
                        href={g.sources[n - 1].url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Sursa ${n}: ${g.sources[n - 1].label}`}
                      >
                        [{n}]
                      </a>
                    ))}
                  </span>
                </p>
              </div>
            </section>
          ))}
          <div className="field-travel-note">
            <BookOpen size={18} />
            <div>
              <strong>Înainte de plecare</strong>
              <p>{g.note}</p>
            </div>
          </div>
          {g.id === 'satele-devei' && (
            <div className="village-references">
              <h3>Reperele satelor pe hartă</h3>
              <p>Sunt poziții generale ale localităților, nu limite sau intrări în obiective.</p>
              <div>
                {navPlaces.map((p) => (
                  <a href={geoUrl(p.lat, p.lon)} key={p.name} target="_blank" rel="noreferrer">
                    <MapPin size={12} />
                    {p.name}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
        <aside className="field-marginalia">
          <span className="city-eyebrow">CUPRINSUL FIȘEI</span>
          <nav aria-label="Capitolele ghidului">
            {g.sections.map((s, i) => (
              <a
                key={s.title}
                href={`#capitol-${i + 1}`}
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById(`capitol-${i + 1}`)
                    ?.scrollIntoView({ block: 'start', behavior: 'instant' })
                }}
              >
                <small>0{i + 1}</small>
                {s.title}
              </a>
            ))}
          </nav>
          <div className="field-tools">
            <ReadingButton name={g.title} saved={saved} toggle={toggle} />
            <button className="city-btn outline" onClick={() => window.print()}>
              <Printer size={14} />
              Tipărește fișa
            </button>
          </div>
          {g.reference && (
            <a
              className="field-reference-map"
              href={geoUrl(g.reference.lat, g.reference.lon)}
              target="_blank"
              rel="noreferrer"
            >
              <MapIcon size={16} />
              <div>
                <b>Harta împrejurimilor</b>
                <small>{g.reference.label}</small>
              </div>
              <ArrowUpRight size={13} />
            </a>
          )}
          <div className="field-verification">
            <Check size={14} />
            <span>Surse identificabile, fără estimări de program sau de acces.</span>
          </div>
        </aside>
      </div>
      <section className="field-bibliography">
        <span className="city-eyebrow">DOCUMENTARE</span>
        <h2>Surse și referințe</h2>
        <ol>
          {g.sources.map((s, i) => (
            <li key={s.url}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <a target="_blank" rel="noreferrer" href={s.url}>
                {s.label}
                <ExternalLink size={12} />
              </a>
            </li>
          ))}
        </ol>
      </section>
      {g.related && (
        <div className="field-related">
          <span className="city-eyebrow">CONTINUĂ EXPLORAREA</span>
          {g.related.map((r) => (
            <Link key={r.to} to={r.to}>
              {r.label}
              <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      )}
      <button className="field-method" onClick={() => setSourcesOpen(true)}>
        <FolderOpen size={13} />
        Cum sunt alese sursele?
      </button>
      {sourcesOpen && (
        <Dialog labelledBy="field-method-title" onClose={() => setSourcesOpen(false)} className="form-dialog">
          <span className="city-eyebrow">NOTĂ EDITORIALĂ</span>
          <h2 id="field-method-title">Cum citim sursele</h2>
          <p>
            Fișele RAN documentează descoperiri arheologice; ele nu confirmă că un sit este deschis
            publicului. Informațiile civice provin de la primărie. Localizarea satelor și fotografiile au
            trimiteri la documentele originale.
          </p>
          <p>
            Ghidurile regionale nu adaugă marcaje fictive pe harta urbană, iar o fotografie istorică nu este
            prezentată drept imagine actuală. Data documentării nu este data realizării fotografiei.
          </p>
        </Dialog>
      )}
    </main>
  )
}
export default function FieldGuides() {
  const { id } = useParams(),
    [params, setParams] = useSearchParams()
  const [saved, setSaved] = useState<string[]>(() => {
    const a = readLocal<unknown>(KEY, [])
    return Array.isArray(a)
      ? a.filter((s): s is string => typeof s === 'string' && fieldGuides.some((g) => g.id === s))
      : []
  })
  const [persisted, setPersisted] = useState(true)
  const toggle = (s: string) => {
    const next = saved.includes(s) ? saved.filter((id) => id !== s) : [...saved, s]
    setSaved(next)
    setPersisted(writeLocal(KEY, next))
  }
  const theme = params.get('tema') || 'Toate',
    q = params.get('q') || '',
    onlySaved = params.get('lecturi') === '1'
  const change = (key: string, value: string) => {
    const p = new URLSearchParams(params)
    if (value) p.set(key, value)
    else p.delete(key)
    setParams(p, { replace: true })
  }
  if (id === archive.id) return <HistoricalSheet />
  const guide = fieldGuides.find((g) => g.id === id)
  if (guide)
    return (
      <>
        <GuideArticle
          key={guide.id}
          guide={guide}
          saved={saved.includes(guide.id)}
          toggle={() => toggle(guide.id)}
        />
        {!persisted && (
          <p className="form-message">
            Lectura este păstrată doar pentru această sesiune; stocarea locală nu este disponibilă.
          </p>
        )}
      </>
    )
  if (id)
    return (
      <main className="city-page">
        <Empty title="Ghidul nu a fost găsit">Alege o fișă din colecția documentată.</Empty>
        <Link className="city-btn" to="/ghiduri">
          Toate ghidurile
        </Link>
      </main>
    )
  const results = fieldGuides.filter(
    (g) =>
      (theme === 'Toate' || g.topics.some((t) => t === theme)) &&
      (!onlySaved || saved.includes(g.id)) &&
      normalize(
        [g.title, g.region, g.intro, ...g.topics, ...g.sections.map((s) => s.title)].join(' '),
      ).includes(normalize(q)),
  )
  return (
    <main className="city-page field-page">
      <PageHeading
        eyebrow="COLECȚIA DE TEREN"
        title="Ghiduri locale"
        sub="Deva și împrejurimile ei, prin locuri și documente: sate, peisaje miniere, parcuri și urme ale lumii romane."
      />
      <ArchiveFeature />
      <div className="field-list-heading">
        <div>
          <span className="city-eyebrow">BIBLIOTECA ATLAS</span>
          <h2>Alege un ghid</h2>
        </div>
        <button
          className={`reading-filter ${onlySaved ? 'active' : ''}`}
          aria-pressed={onlySaved}
          onClick={() => change('lecturi', onlySaved ? '' : '1')}
        >
          <Bookmark size={14} />
          Lecturi salvate <b>{saved.length}</b>
        </button>
      </div>
      <div className="field-filters">
        <div className="filter-tabs wrap" role="group" aria-label="Temele ghidurilor">
          {['Toate', ...fieldTopics].map((t) => (
            <button
              key={t}
              className={theme === t ? 'active' : ''}
              aria-pressed={theme === t}
              onClick={() => change('tema', t === 'Toate' ? '' : t)}
            >
              {t}
            </button>
          ))}
        </div>
        <SearchBox label="Caută în ghiduri" value={q} onChange={(s) => change('q', s)} />
      </div>
      <p className="result-label" aria-live="polite">
        {results.length} {results.length === 1 ? 'FIȘĂ' : 'FIȘE'} · SELECȚIE EDITORIALĂ
      </p>
      <div className="field-card-grid">
        {results.map((g) => (
          <article className="city-place-card field-card" key={g.id}>
            <div className="card-media">
              <Link to={fieldPath(g)} aria-label={`Citește ${g.title}`}>
                <img loading="lazy" src={g.photo.src} alt={g.photo.caption} />
              </Link>
              <span className="field-card-series">
                FIȘA {String(fieldGuides.indexOf(g) + 1).padStart(2, '0')}
              </span>
              <ReadingButton
                compact
                name={g.title}
                saved={saved.includes(g.id)}
                toggle={() => toggle(g.id)}
              />
            </div>
            <div className="city-card-info">
              <span className="card-cat">
                <ScrollText size={12} />
                {g.topics.join(' · ')}
              </span>
              <Link to={fieldPath(g)}>
                <h3>{g.title}</h3>
              </Link>
              <p>
                <MapPin size={12} />
                {g.region}
              </p>
              <Link className="field-read" to={fieldPath(g)}>
                Citește ghidul
                <ArrowRight size={13} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!results.length && (
        <>
          <Empty title={onlySaved ? 'Nicio lectură pentru selecția ta' : 'Niciun ghid găsit'}>
            {onlySaved
              ? 'Salvează o fișă folosind semnul de carte sau elimină filtrele.'
              : 'Încearcă un alt termen ori o altă temă.'}
          </Empty>
          <button className="city-btn outline" onClick={() => setParams({})}>
            Arată toate ghidurile
          </button>
        </>
      )}
      {!persisted && (
        <p role="status" className="form-message">
          Lista de lecturi este disponibilă numai în această sesiune.
        </p>
      )}
      <div className="field-directory-bridge">
        <Landmark size={22} />
        <div>
          <b>De la documentare la plimbare</b>
          <p>Găsește magazinele și reperele din oraș în directorul local.</p>
        </div>
        <Link className="city-btn outline" to="/business?tip=Magazine">
          Magazine din Deva
          <ChevronRight size={13} />
        </Link>
      </div>
    </main>
  )
}
