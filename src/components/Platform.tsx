import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronRight,
  Compass,
  Globe2,
  House,
  Info,
  LandPlot,
  Layers3,
  LockKeyhole,
  Map,
  MapPin,
  Menu,
  Moon,
  Radio,
  Route as TrailIcon,
  Search,
  Store,
  Sun,
  Users,
} from 'lucide-react'
import { CastleMark } from './Brand'
import { AboutDialog, Dialog } from './Dialogs'
import { useAtlas } from '../lib/atlas-store'
import { districts, localNames } from '../lib/local-geography'
import { normalize } from '../lib/places'
import { placePath, trails } from '../lib/city-data'
import { archive, archivePath, fieldGuides, fieldPath } from '../lib/field-guides'
import { CityHome, Directory, PlacePage, Explore, LivePage, Nearby, HistoryPage } from './CityPages'
const RoutesPage = lazy(() => import('./RoutesPage'))
const Community = lazy(() => import('./Community'))
const Admin = lazy(() => import('./Admin'))
const FieldGuides = lazy(() => import('./FieldGuides'))
const navGroups = [
  {
    title: 'DESCOPERĂ',
    items: [
      { path: '/', label: 'Explorează', icon: Compass },
      { path: '/harta', label: 'Hartă interactivă', icon: Map },
      { path: '/ghiduri', label: 'Ghiduri locale', icon: BookOpen },
      { path: '/cartiere', label: 'Cartiere', icon: LandPlot },
      { path: '/business', label: 'Deva Business', icon: Store },
      { path: '/live', label: 'Deva Live', icon: Radio },
    ],
  },
  {
    title: 'ATLASUL MEU',
    items: [
      { path: '/salvate', label: 'Locuri salvate', icon: Bookmark },
      { path: '/trasee', label: 'Traseele mele', icon: TrailIcon },
    ],
  },
  { title: 'COMUNITATE', items: [{ path: '/comunitate', label: 'Vocea comunității', icon: Users }] },
]
function GlobalSearch({ close }: { close: () => void }) {
  const [q, setQ] = useState(''),
    input = useRef<HTMLInputElement>(null)
  const { places, events } = useAtlas(),
    go = useNavigate()
  useEffect(() => {
    input.current?.focus()
  }, [])
  const all = [
    ...places.map((p) => ({ name: p.name, kind: p.businessType || p.category, path: placePath(p) })),
    ...districts.map((d) => ({ name: d.name, kind: 'Cartier', path: '/cartiere?cartier=' + d.id })),
    ...trails.map((t) => ({ name: t.name, kind: 'Traseu de plimbare', path: '/trasee?model=' + t.id })),
    ...events.map((e) => ({ name: e.title, kind: 'Eveniment', path: '/live?eveniment=' + e.id })),
    ...fieldGuides.map(g => ({name:g.title,kind:'Ghid · '+g.topics.join(' / '),path:fieldPath(g),keywords:g.region+' '+g.intro+' '+g.sections.map(s=>s.title).join(' ')})),
    { name: archive.title, kind: 'Hartă istorică · 1769–1773', path: archivePath, keywords: 'harta veche istorie planșa 183 arhivă cartografie' },
    ...localNames.map((n) => ({
      name: n,
      kind: 'Localizare neconfirmată',
      path: '/harta?cauta=' + encodeURIComponent(n),
    })),
  ]
  const results = all.filter((i) => normalize(i.name + ' ' + i.kind + ' ' + ('keywords' in i ? i.keywords : '')).includes(normalize(q))).slice(0, 30)
  return (
    <Dialog labelledBy="global-title" onClose={close} className="global-dialog">
      <span className="city-eyebrow">CĂUTARE GLOBALĂ</span>
      <h2 id="global-title">Ce vrei să descoperi?</h2>
      <div className="city-input">
        <Search size={19} />
        <input
          ref={input}
          placeholder="Loc, afacere, cartier sau eveniment…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Caută în tot atlasul"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) {
              e.preventDefault()
              e.stopPropagation()
              close()
              go(results[0].path)
            }
          }}
        />
      </div>
      <p className="result-label">
        {q ? `${results.length}${results.length === 30 ? '+' : ''} rezultate` : 'SUGESTII DIN ATLAS'}
      </p>
      <div className="global-results">
        {results.slice(0, q ? 30 : 6).map((r) => (
          <Link key={r.path} to={r.path} onClick={close}>
            <MapPin size={16} />
            <span>
              <b>{r.name}</b>
              <small>{r.kind}</small>
            </span>
            <ArrowUpRight size={14} />
          </Link>
        ))}
        {!results.length && <p>Niciun rezultat. Încearcă „Cetate”, „restaurant” sau „Micro 15”.</p>}
      </div>
    </Dialog>
  )
}
export default function Platform({ MapView }: { MapView: ComponentType }) {
  const loc = useLocation(),
    { saved, dark, toggleTheme } = useAtlas()
  const [drawer, setDrawer] = useState(false),
    [search, setSearch] = useState(false),
    [about, setAbout] = useState(false),
    [near, setNear] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const path = loc.pathname
  const navItem = navGroups.flatMap((g) => g.items).find((n) => n.path !== '/' && path.startsWith(n.path))
  const title =
    navItem?.label ||
    (path === '/administrare'
      ? 'Administrare'
      : path.startsWith('/loc/')
        ? 'Fișă de loc'
        : path === '/istorie'
          ? 'Istoria orașului'
          : 'Explorează')
  const isMap = ['/harta', '/cartiere', '/salvate'].includes(path)
  useEffect(() => {
    contentRef.current?.scrollTo(0, 0)
    if (!/^\/(loc|business|ghiduri)\/.+/.test(path)) document.title =
      (path.startsWith('/business')
        ? 'Restaurante Deva și afaceri locale'
        : path === '/obiective'
          ? 'Obiective turistice Deva'
          : title) + ' · Atlas Deva'
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', dark ? '#17251f' : '#f6f7f3')
  }, [path, title, dark, loc.search])
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((v) => !v)
      }
      if (e.key === 'Escape') setDrawer(false)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])
  const nav = (
    <>
      <Link
        to="/"
        className="atlas-wordmark"
        aria-label="Atlas Deva — Explorează"
        onClick={() => setDrawer(false)}
      >
        <span className="logo-tile">
          <CastleMark size={33} />
        </span>
        <span>
          Atlas <strong>Deva</strong>
          <small>GHIDUL ORAȘULUI</small>
        </span>
      </Link>
      <nav className="rail-nav" aria-label="Secțiunile atlasului">
        {navGroups.map((g) => (
          <div className="rail-group" key={g.title}>
            <div className="rail-eyebrow">{g.title}</div>
            {g.items.map((n) => (
              <NavLink
                aria-label={n.label}
                title={n.label}
                end={n.path === '/'}
                key={n.path}
                to={n.path}
                onClick={() => setDrawer(false)}
                className={({ isActive }) => `rail-link ${isActive ? 'active' : ''}`}
              >
                <n.icon size={18} strokeWidth={1.65} />
                <span>{n.label}</span>
                {n.path === '/live' && <i className="tiny-live" />}
                {n.path === '/salvate' && <small>{saved.length}</small>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="rail-foot">
        <button
          className="rail-secondary"
          onClick={() => {
            setAbout(true)
            setDrawer(false)
          }}
        >
          <Info size={16} />
          Despre atlas
        </button>
        <Link className="rail-secondary" to="/administrare" onClick={() => setDrawer(false)}>
          <LockKeyhole size={15} />
          Administrare
        </Link>
        <div className="rail-location">
          <span>
            <MapPin size={16} />
          </span>
          <div>
            <b>Deva, România</b>
            <small>Județul Hunedoara</small>
          </div>
          <span className="romanian-flag" />
        </div>
      </div>
    </>
  )
  return (
    <div className="platform">
      <a className="skip-link" href="#atlas-content">
        Sari la conținut
      </a>
      <aside className="city-rail">{nav}</aside>
      {drawer && (
        <Dialog onClose={() => setDrawer(false)} labelledBy="mobile-nav-title" className="mobile-rail-dialog">
          <span id="mobile-nav-title" className="sr-only">
            Navigare Atlas Deva
          </span>
          {nav}
        </Dialog>
      )}
      <div className="platform-main">
        <header className="city-topbar">
          <button
            className="mobile-menu icon-box"
            onClick={() => setDrawer(true)}
            aria-label="Deschide meniul"
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumbs">
            <House size={15} />
            <ChevronRight size={12} />
            <span>Atlas Deva</span>
            <ChevronRight size={12} />
            <b>{title}</b>
          </div>
          <button className="global-trigger" aria-label="Căutare globală" onClick={() => setSearch(true)}>
            <Search size={15} />
            <span>Caută în atlas…</span>
            <kbd>⌘ K</kbd>
          </button>
          <i />
          <button
            className="theme-button icon-box"
            onClick={toggleTheme}
            aria-label={dark ? 'Activează tema luminoasă' : 'Activează tema întunecată'}
            title={dark ? 'Temă luminoasă' : 'Temă întunecată'}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <span className="top-language">
            <Globe2 size={14} />
            RO
          </span>
        </header>
        <div
          ref={contentRef}
          id="atlas-content"
          className={`platform-content ${isMap ? 'map-content' : ''}`}
          tabIndex={-1}
        >
          <Suspense
            fallback={
              <div className="page-loading">
                <Layers3 size={24} />
                Se încarcă secțiunea…
              </div>
            }
          >
            <Routes>
              <Route index element={<CityHome onNear={() => setNear(true)} />} />
              <Route path="/obiective" element={<Explore />} />
              <Route path="/istorie" element={<HistoryPage />} />
              <Route path="/ghiduri" element={<FieldGuides />} />
              <Route path="/ghiduri/:id" element={<FieldGuides />} />
              <Route path="/harta" element={<MapView key={path + loc.search} />} />
              <Route path="/cartiere" element={<MapView key={path + loc.search} />} />
              <Route path="/salvate" element={<MapView key={path + loc.search} />} />
              <Route path="/business" element={<Directory />} />
              <Route path="/business/:id" element={<PlacePage />} />
              <Route path="/loc/:id" element={<PlacePage />} />
              <Route path="/live" element={<LivePage />} />
              <Route path="/trasee" element={<RoutesPage />} />
              <Route path="/comunitate" element={<Community />} />
              <Route path="/administrare" element={<Admin />} />
              <Route
                path="*"
                element={
                  <div className="city-page">
                    <h1>Pagina nu a fost găsită</h1>
                    <Link to="/" className="city-btn">
                      Înapoi la atlas
                    </Link>
                  </div>
                }
              />
            </Routes>
          </Suspense>
          {!isMap && (
            <footer className="platform-footer">
              <span>
                <CastleMark size={20} />
                Atlas Deva <i /> Ghid urban independent
              </span>
              <button onClick={() => setAbout(true)}>
                Despre atlas și surse <ArrowUpRight size={12} />
              </button>
            </footer>
          )}
        </div>
      </div>
      {search && <GlobalSearch close={() => setSearch(false)} />}{' '}
      {about && <AboutDialog onClose={() => setAbout(false)} />}{' '}
      {near && <Nearby onClose={() => setNear(false)} />}
    </div>
  )
}
