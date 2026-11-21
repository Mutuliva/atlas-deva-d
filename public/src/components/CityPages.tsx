import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Castle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  ExternalLink,
  Globe2,
  Landmark,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Radio,
  Route,
  Search,
  Share2,
  ShieldCheck,
  Trees,
  Utensils,
} from 'lucide-react'
import { useAtlas } from '../lib/atlas-store'
import {
  businessKinds,
  cityNotices,
  eventEnded,
  formatDate,
  mapPath,
  placePath,
  sourceDate,
} from '../lib/city-data'
import { coordinate, normalize } from '../lib/places'
import type { Place } from '../lib/places'
import { metricDistance, project } from '../lib/local-geography'
import { Dialog } from './Dialogs'
import { Empty, EventRow, LiveAside, PlaceCard, SectionTitle, SourceNote, WeatherCard } from './CityCards'
const heroSlides = [
  {
    photo: '/images/hero-deva.webp',
    name: 'Cetatea Devei',
    sub: 'Răsărit peste cetate',
    link: '/loc/cetatea-devei',
  },
  {
    photo: '/images/centrul-deva.webp',
    name: 'Panorama Devei',
    sub: 'Orașul văzut de sus',
    link: '/obiective',
  },
  {
    photo: '/images/palace.webp',
    name: 'Palatul Magna Curia',
    sub: 'La poalele Dealului Cetății',
    link: '/loc/magna-curia',
  },
]
const shortcuts = [
  {
    icon: Castle,
    name: 'Obiective turistice',
    note: 'Istorie și cultură',
    to: '/obiective?tema=Patrimoniu',
    tone: 'sage',
  },
  {
    icon: Trees,
    name: 'Natură & parcuri',
    note: 'Locuri în aer liber',
    to: '/obiective?tema=Natură',
    tone: 'olive',
  },
  {
    icon: Utensils,
    name: 'Gastronomie',
    note: 'Restaurante și cafenele',
    to: '/business?tip=Gastronomie',
    tone: 'peach',
  },
  { icon: Route, name: 'Trasee de plimbare', note: 'La pas prin oraș', to: '/trasee', tone: 'lavender' },
]
export function CityHome({ onNear }: { onNear: () => void }) {
  const [slide, setSlide] = useState(0)
  const { places } = useAtlas(),
    s = heroSlides[slide]
  const picks = ['cetatea-devei', 'magna-curia', 'parcul-cetatii']
    .map((id) => places.find((p) => p.id === id))
    .filter((p): p is Place => !!p)
  return (
    <main className="city-page home-page">
      <section className={`city-hero hero-${slide}`} aria-label="Explorează orașul Deva">
        <img key={s.photo} src={s.photo} alt={s.name} fetchPriority="high" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <span className="hero-kicker">
            <i />
            GHID URBAN INTERACTIV
          </span>
          <h1>
            Descoperă Deva<span>.</span>
          </h1>
          <p>
            Istorie, natură și viață locală.
            <br />
            Orașul tău, într-un singur atlas.
          </p>
          <div className="hero-actions">
            <Link className="hero-cta" to="/harta">
              <MapIcon size={16} />
              Explorează harta
              <ArrowUpRight size={16} />
            </Link>
            <button onClick={onNear}>
              <Navigation size={14} />
              În apropierea mea
            </button>
          </div>
        </div>
        <div className="hero-coordinates">
          <span>45°52′ N</span>
          <i />
          22°54′ E
        </div>
        <div className="hero-caption">
          <MapPin size={12} />
          <Link to={s.link}>{s.name}</Link>
          <span />
          <button aria-label="Fotografia anterioară" onClick={() => setSlide((n) => (n + 2) % 3)}>
            <ChevronLeft size={15} />
          </button>
          <button aria-label="Fotografia următoare" onClick={() => setSlide((n) => (n + 1) % 3)}>
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="slide-index">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={slide === i ? 'selected' : ''}
              aria-label={`Afișează fotografia ${i + 1}`}
              aria-pressed={slide === i}
              onClick={() => setSlide(i)}
            />
          ))}
        </div>
      </section>
      <div className="quick-grid">
        {shortcuts.map((c) => (
          <Link to={c.to} key={c.name} className="quick-card">
            <span className={'quick-icon ' + c.tone}>
              <c.icon size={23} strokeWidth={1.7} />
            </span>
            <span>
              <b>{c.name}</b>
              <small>{c.note}</small>
            </span>
            <ChevronRight size={14} />
          </Link>
        ))}
      </div>
      <div className="home-columns">
        <section className="home-recs">
          <SectionTitle
            eyebrow="SELECȚIA ATLAS"
            title="De neratat în Deva"
            to="/obiective"
            label="Vezi toate"
          />
          <div className="recommended-grid">
            {picks.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </div>
        </section>
        <LiveAside />
      </div>
      <div className="home-secondary">
        <Link to="/cartiere" className="district-promo">
          <span className="promo-map" />
          <div>
            <span className="city-eyebrow">GEOGRAFIE LOCALĂ</span>
            <h2>Orașul, cartier cu cartier</h2>
            <p>Descoperă reperele și limitele documentate ale Devei.</p>
            <b>
              Explorează cartierele <ArrowRight size={14} />
            </b>
          </div>
        </Link>
        <Link className="community-promo" to="/comunitate">
          <span className="city-eyebrow">ÎMPREUNĂ PENTRU DEVA</span>
          <h2>Vocea comunității</h2>
          <p>Un loc de propus? O problemă de semnalat?</p>
          <b>
            Contribuie la atlas <ArrowRight size={14} />
          </b>
        </Link>
      </div>
      <SectionTitle eyebrow="JURNAL DE ORAȘ" title="Poveștile Devei" to="/ghiduri" label="Ghiduri locale" />
      <Link className="story-strip" to="/istorie">
        <img src="/images/theatre.webp" alt="Teatrul de Artă din Deva" loading="lazy" />
        <div>
          <span className="city-eyebrow">ISTORIE LOCALĂ</span>
          <h3>De la cetatea medievală la orașul de astăzi</h3>
          <p>O lectură despre Deva, prin clădirile care îi păstrează memoria.</p>
        </div>
        <ArrowUpRight size={22} />
      </Link>
      <Link className="editorial-bridge field-home-link" to="/ghiduri"><BookOpen size={20}/><span>Ghiduri de teren: sate, mine și patrimoniu arheologic</span><ArrowRight size={15}/></Link>
    </main>
  )
}
export function Explore() {
  const { places } = useAtlas(),
    [params, set] = useSearchParams()
  const theme = params.get('tema') || 'Toate',
    [q, setQ] = useState('')
  const items = places.filter(
    (p) =>
      ['Istorie', 'Cultură', 'Natură', 'Arhitectură', 'Instituții'].includes(p.category) &&
      (theme === 'Toate' ||
        (theme === 'Patrimoniu'
          ? ['Istorie', 'Cultură', 'Arhitectură'].includes(p.category)
          : p.category === theme)) &&
      normalize(p.name + ' ' + p.intro).includes(normalize(q)),
  )
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="GHIDUL ORAȘULUI"
        title="Explorează Deva"
        sub="Obiective turistice, parcuri și locuri mai puțin cunoscute, alese pentru următoarea ta plimbare."
      />
      <div className="page-toolbar">
        <div className="filter-tabs">
          {['Toate', 'Patrimoniu', 'Natură', 'Cultură'].map((t) => (
            <button
              className={theme === t ? 'active' : ''}
              key={t}
              onClick={() => set(t === 'Toate' ? {} : { tema: t })}
            >
              {t}
            </button>
          ))}
        </div>
        <SearchBox value={q} onChange={setQ} label="Caută un obiectiv" />
      </div>
      <div className="full-card-grid">
        {items.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </div>
      {!items.length && (
        <Empty title="Niciun obiectiv găsit">Încearcă un alt termen sau categoria „Toate”.</Empty>
      )}
      <Link className="editorial-bridge" to="/istorie">
        <Landmark size={21} />
        <span>Istoria orașului, în trei repere</span>
        <ArrowRight size={15} />
      </Link>
      <Link className="editorial-link" to="/ghiduri">Ghiduri turistice pentru Deva și împrejurimi <ArrowRight size={13}/></Link>
    </main>
  )
}
export function PageHeading({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="page-heading">
      <span className="city-eyebrow">
        <i />
        {eyebrow}
      </span>
      <h1>
        {title}
        <b>.</b>
      </h1>
      <p>{sub}</p>
    </div>
  )
}
export function SearchBox({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (s: string) => void
  label: string
}) {
  return (
    <label className="city-input">
      <Search size={16} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label + '…'}
        aria-label={label}
      />
    </label>
  )
}
export function Directory() {
  const { places } = useAtlas(),
    [par, set] = useSearchParams(),
    [q, setQ] = useState(''),
    [contact, cSet] = useState(false)
  const bt = par.get('tip') || 'Toate'
  const rows = places
    .filter((p) => p.businessType || p.category === 'Magazine')
    .filter(
      (p) =>
        bt === 'Toate' ||
        (bt === 'Gastronomie' ? p.category === 'Gastronomie' : (p.businessType || p.category) === bt),
    )
    .filter(
      (p) =>
        (!contact || !!p.phone) &&
        normalize(p.name + ' ' + p.category + ' ' + p.address).includes(normalize(q)),
    )
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="DIRECTOR LOCAL"
        title="Deva Business"
        sub="Oameni și afaceri din oraș: de la o cafea în centru la servicii de zi cu zi."
      />
      {places.some(p=>p.id==='casa-rustica') && <div className="business-cover">
        <img src={places.find(p=>p.id==='casa-rustica')!.image} alt="Casa Rustica Deva" />
        <div>
          <span className="hero-kicker">
            <i />
            AFACERE DIN DEVA
          </span>
          <h2>Casa Rustica</h2>
          <p>Bistro & pizzerie · Aleea Transilvaniei</p>
          <Link to="/business/casa-rustica">
            Descoperă locul <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>}
      <div className="page-toolbar">
        <SearchBox value={q} onChange={setQ} label="Caută o afacere" />
        <label className="check-option">
          <input type="checkbox" checked={contact} onChange={(e) => cSet(e.target.checked)} />
          Cu telefon disponibil
        </label>
      </div>
      <div className="filter-tabs wrap">
        {['Toate', ...(bt==='Gastronomie'?['Gastronomie']:[]), ...businessKinds].map((v) => (
          <button
            key={v}
            className={v === bt ? 'active' : ''}
            onClick={() => set(v === 'Toate' ? {} : { tip: v })}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="result-label">{rows.length} AFACERI ÎN SELECȚIE · DATE DIN SURSE PUBLICE</p>
      <div className="full-card-grid">
        {rows.map((p) => (
          <PlaceCard key={p.id} place={p} />
        ))}
      </div>
      {!rows.length && <Empty title="Nicio afacere găsită">Schimbă filtrul sau termenul căutat.</Empty>}
    </main>
  )
}
export function ShareButton({ p }: { p: Place }) {
  const [link, setLink] = useState(''),
    { toast } = useAtlas()
  const share = async () => {
    const v = location.origin + placePath(p)
    try {
      if (navigator.share) {
        await navigator.share({ title: `${p.name} · Atlas Deva`, url: v })
        return
      }
      await navigator.clipboard.writeText(v)
      toast('Link copiat în clipboard')
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError')) setLink(v)
    }
  }
  return (
    <>
      <button className="city-btn outline" onClick={share}>
        <Share2 size={15} />
        Distribuie
      </button>
      {link && (
        <Dialog labelledBy="share-title" onClose={() => setLink('')} className="form-dialog">
          <h2 id="share-title">Link către {p.name}</h2>
          <p>Copiază adresa pentru a distribui acest loc.</p>
          <input
            className="share-address"
            readOnly
            value={link}
            aria-label="Link de distribuire"
            onFocus={(e) => e.target.select()}
          />
        </Dialog>
      )}
    </>
  )
}
export function PlacePage() {
  const { id } = useParams(),
    { places, saved, toggleSave, routeIds, setRouteIds, toast } = useAtlas()
  const p = places.find((x) => x.id === id),
    go = useNavigate()
  useEffect(() => {
    if (p)
      document.title = `${p.name}${p.businessType === 'Restaurante' ? ' · Restaurante Deva' : ''} | Atlas Deva`
  }, [p])
  if (!p)
    return (
      <main className="city-page">
        <Empty title="Loc indisponibil">Fișa nu există sau a fost retrasă.</Empty>
        <Link className="city-btn" to="/">
          Înapoi la ghid
        </Link>
      </main>
    )
  const business = p.businessType || p.category === 'Magazine'
  const included = routeIds.includes(p.id)
  return (
    <main className="city-page">
      <Link className="back-link" to={business ? '/business' : '/obiective'}>
        <ArrowLeft size={14} />
        {business ? 'Director de afaceri' : 'Explorează Deva'}
      </Link>
      <div className="profile-grid">
        <article className="place-editorial">
          <div className="profile-hero">
            <img src={p.image} alt={p.cartogram ? 'Hartă de context a Devei' : p.name} />
            <span>{p.cartogram ? 'HARTĂ DE CONTEXT · DEVA' : 'FOTOGRAFIE · ' + p.name.toUpperCase()}</span>
          </div>
          <span className="city-eyebrow">{p.businessType || p.category}</span>
          <h1>{p.name}</h1>
          <p className="profile-intro">{p.intro}</p>
          <h2>Despre acest loc</h2>
          <p>{p.story}</p>
          <div className="visitor-tip">
            <Compass size={20} />
            <div>
              <strong>De știut</strong>
              <p>{p.tip}</p>
            </div>
          </div>
          <div className="profile-actions">
            <button className="city-btn outline" onClick={() => toggleSave(p.id)}>
              <Bookmark size={15} fill={saved.includes(p.id) ? 'currentColor' : 'none'} />
              {saved.includes(p.id) ? 'Salvat în favorite' : 'Salvează locul'}
            </button>
            <ShareButton p={p} />
            <button
              className="city-btn outline"
              onClick={() => {
                if (included) {
                  go('/trasee')
                  return
                }
                if (routeIds.length >= 6) {
                  toast('Traseul are deja șase opriri. Editează-l în Traseele mele.')
                  return
                }
                setRouteIds([...routeIds, p.id])
                toast('Loc adăugat la traseul tău')
              }}
            >
              <Route size={15} />
              {included ? 'Vezi traseul' : 'Adaugă în traseu'}
            </button>
          </div>
        </article>
        <aside className="profile-facts">
          <span className="city-eyebrow">FIȘĂ LOCALĂ</span>
          <h2>Informații utile</h2>
          <Fact icon={MapPin} label="Adresă" value={p.address} />
          <Fact icon={Clock3} label="Program consemnat" value={p.hours || 'Program neconfirmat.'} />
          <div className="fact">
            <Phone size={16} />
            <div>
              <small>TELEFON</small>
              {p.phone ? (
                <a href={'tel:' + p.phone.replace(/[^\d+]/g, '')}>{p.phone}</a>
              ) : (
                <p>Număr indisponibil în sursă.</p>
              )}
            </div>
          </div>
          {p.website && (
            <a className="fact-web" href={p.website} target="_blank" rel="noreferrer">
              <Globe2 size={15} />
              Pagina operatorului
              <ExternalLink size={12} />
            </a>
          )}
          <div className="coord-line">
            {coordinate(p.lat, 'N')} · {coordinate(p.lon, 'E')}
          </div>
          <Link className="city-btn" to={mapPath(p)}>
            <MapIcon size={15} />
            Vezi pe hartă
            <ArrowUpRight size={14} />
          </Link>
          {!p.representative && (
            <a
              className="city-btn outline"
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
            >
              <Navigation size={14} />
              Indicații de orientare
            </a>
          )}
          <div className="fact-sources">
            <b>
              <ShieldCheck size={13} />
              Surse și proveniență
            </b>
            {p.sources?.map((s) => (
              <a href={s.url} key={s.url} target="_blank" rel="noreferrer">
                {s.label}
                <ArrowUpRight size={11} />
              </a>
            ))}
            {p.photoSource && (
              <a href={p.photoSource} target="_blank" rel="noreferrer">
                {p.photoCredit || 'Sursa fotografiei'} <ArrowUpRight size={11} />
              </a>
            )}
            <small>
              Fișă documentată: {formatDate(p.checked || sourceDate)}. Confirmă datele înainte de deplasare.
            </small>
          </div>
        </aside>
      </div>
    </main>
  )
}
function Fact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="fact">
      <Icon size={16} />
      <div>
        <small>{label.toUpperCase()}</small>
        <p>{value}</p>
      </div>
    </div>
  )
}
export function HistoryPage() {
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="JURNAL DE ORAȘ"
        title="Deva, prin timp"
        sub="Trei repere ale orașului de pe Mureș și documente pentru a-i descoperi împrejurimile."
      />
      <div className="history-list">
        {[
          {
            n: '01',
            era: 'SECOLUL AL XIII-LEA',
            id: 'cetatea-devei',
            name: 'Cetatea de pe deal',
            img: 'aerial',
            desc: 'Atestată documentar în 1269, Cetatea Devei domină valea Mureșului de pe dealul vulcanic. Incintele fortăreței păstrează urme ale mai multor etape de construcție.',
            src: 'https://ro.wikipedia.org/wiki/Cetatea_Devei',
          },
          {
            n: '02',
            era: 'RENAȘTERE ȘI BAROC',
            id: 'magna-curia',
            name: 'Palatul de la poalele cetății',
            img: 'palace',
            desc: 'Magna Curia, cunoscut și ca Palatul Bethlen, păstrează elemente renascentiste și baroce. Astăzi adăpostește Muzeul Civilizației Dacice și Romane.',
            src: 'https://ro.wikipedia.org/wiki/Magna_Curia',
          },
          {
            n: '03',
            era: 'ÎNCEPUTUL SECOLULUI XX',
            id: 'teatrul-de-arta',
            name: 'O scenă pentru oraș',
            img: 'theatre',
            desc: 'În Piața Unirii, clădirea Teatrului de Artă marchează o altă epocă a orașului. Fațada sa ornamentală rămâne un reper al centrului istoric.',
            src: 'https://ro.wikipedia.org/wiki/Deva',
          },
        ].map((h) => (
          <article key={h.id}>
            <img src={'/images/' + h.img + '.webp'} alt={h.name} />
            <div>
              <span className="city-eyebrow">
                {h.n} / {h.era}
              </span>
              <h2>{h.name}</h2>
              <p>{h.desc}</p>
              <Link to={'/loc/' + h.id}>
                Explorează reperul
                <ArrowRight size={14} />
              </Link>
              <a href={h.src} target="_blank" rel="noreferrer">
                Lectură și referințe <ExternalLink size={10} />
              </a>
            </div>
          </article>
        ))}
      </div>
      <Link className="editorial-bridge field-home-link" to="/ghiduri/harta-iosefina"><MapIcon size={20}/><span>Deva în 1769–1773 · consultă harta iosefină, planșa 183</span><ArrowUpRight size={15}/></Link>
      <Link className="editorial-link" to="/ghiduri">Continuă cu ghidurile de istorie și patrimoniu <ArrowRight size={13}/></Link>
    </main>
  )
}
export function LivePage() {
  const [clock, setClock]=useState(()=>Date.now())
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),60000);return()=>clearInterval(timer)},[])
  const { events } = useAtlas(),
    [par] = useSearchParams(),
    [type, setType] = useState('Toate'),
    [archive, setArchive] = useState(false)
  const list = events.filter(
    (e) => (archive ? eventEnded(e) : !eventEnded(e)) && (type === 'Toate' || e.type === type),
  )
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="PULSUL ORAȘULUI"
        title="Deva Live"
        sub="Agenda culturală, vremea și anunțurile orașului. Fiecare informație are o sursă și o dată."
      />
      <div className="live-grid">
        <section>
          <SectionTitle title="Agenda locală" />
          <div className="page-toolbar">
            <select aria-label="Tip de eveniment" value={type} onChange={(e) => setType(e.target.value)}>
              {['Toate', ...new Set(events.map((e) => e.type))].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label className="check-option">
              <input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} />
              Arhivă
            </label>
          </div>
          {list.map((e) => (
            <article className={`event-card ${par.get('eveniment') === e.id ? 'highlight' : ''}`} key={e.id}>
              <EventRow event={e} />
              <p>{e.description}</p>
              <SourceNote source={e.source} date={e.updated} />
            </article>
          ))}
          {!list.length && (
            <Empty title="Niciun eveniment confirmat">
              Consultă agenda organizatorului sau schimbă filtrul.
            </Empty>
          )}
          <a
            className="editorial-link"
            href="https://www.centrulculturaldeva.ro/evenimente/"
            target="_blank"
            rel="noreferrer"
          >
            Calendarul Centrului Cultural <ExternalLink size={13} />
          </a>
        </section>
        <aside>
          <WeatherCard large />
          <div className="notice-box">
            <Radio size={18} />
            <h3>Despre aceste date</h3>
            <p>
              Vremea se actualizează de la Open-Meteo. Evenimentele și comunicatele sunt selecții datate, nu
              un flux automat sau un serviciu de trafic în timp real.
            </p>
          </div>
        </aside>
      </div>
      <SectionTitle eyebrow="INFORMAȚII PUBLICE" title="Anunțuri și mobilitate" />
      <div className="notice-grid">
        {cityNotices.map((n) => (
          <article key={n.id}>
            <span className="city-eyebrow">
              {n.kind} {n.end && Date.parse(n.end) < clock ? '· INTERVAL ÎNCHEIAT' : ''}
            </span>
            <h3>{n.title}</h3>
            <p>{n.description}</p>
            <SourceNote source={n.source} date={n.date} />
          </article>
        ))}
      </div>
    </main>
  )
}
export function Nearby({ onClose }: { onClose: () => void }) {
  const { places } = useAtlas(),
    [state, setState] = useState('idle'),
    [text, setText] = useState(''),
    [point, setPoint] = useState<{ x: number; y: number } | null>(null),
    [range, setRange] = useState(1500)
  const items = point
    ? places
        .map((p) => ({ p, dist: metricDistance(p, point) }))
        .filter((a) => a.dist <= range)
        .sort((a, b) => a.dist - b.dist)
    : []
  const request = () => {
    if (!navigator.geolocation) {
      setText('Geolocalizarea nu este disponibilă în acest browser.')
      setState('error')
      return
    }
    setState('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const v = project(pos.coords.latitude, pos.coords.longitude)
        setPoint(v)
        setState('done')
        setText(`Precizie raportată: ±${Math.round(pos.coords.accuracy)} m.`)
      },
      (err) => {
        setState('error')
        setText(
          err.code === 1
            ? 'Accesul la locație a fost refuzat. Îl poți permite din setările browserului sau poți explora harta manual.'
            : 'Poziția nu a putut fi obținută. Reîncearcă sau explorează harta.',
        )
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
    )
  }
  return (
    <Dialog onClose={onClose} labelledBy="near-title" className="form-dialog">
      <div className="feature-symbol">
        <LocateFixed size={24} />
      </div>
      <span className="city-eyebrow">EXPLORARE LOCALĂ</span>
      <h2 id="near-title">În apropierea mea</h2>
      <p>
        Cu acordul tău, ordonăm locurile după distanța în linie dreaptă. Poziția rămâne în această fereastră,
        fără a fi trimisă sau salvată.
      </p>
      {state === 'done' ? (
        <>
          <label className="form-label">
            Rază de căutare
            <select aria-label="Rază de căutare" value={range} onChange={(e) => setRange(Number(e.target.value))}>
              <option value={500}>500 m</option>
              <option value={1500}>1,5 km</option>
              <option value={5000}>5 km</option>
            </select>
          </label>
          <p className="muted-note">
            {text} {items.length} locuri găsite.
          </p>
          <div className="global-results">
            {items.slice(0, 18).map(({ p, dist }) => (
              <Link key={p.id} to={placePath(p)} onClick={onClose}>
                <MapPin size={15} />
                <span>
                  <b>{p.name}</b>
                  <small>
                    {Math.round(dist)} m · {p.category}
                  </small>
                </span>
                <ChevronRight size={13} />
              </Link>
            ))}
          </div>
          {!items.length && (
            <p>Nu există repere din atlas în raza aleasă. Încearcă o rază mai mare sau navighează în Deva.</p>
          )}
        </>
      ) : (
        <>
          <button className="city-btn" disabled={state === 'loading'} onClick={request}>
            <Navigation size={15} />
            {state === 'loading'
              ? 'Se caută poziția…'
              : state === 'error'
                ? 'Reîncearcă'
                : 'Permite localizarea'}
          </button>
          {state === 'error' && (
            <p role="alert" className="form-message">
              {text}
            </p>
          )}
        </>
      )}
      <Link to="/harta" onClick={onClose} className="editorial-link">
        Explorează fără localizare
        <ArrowRight size={13} />
      </Link>
    </Dialog>
  )
}
