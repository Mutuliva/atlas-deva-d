import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  ArrowUpRight,
  Crosshair,
  Download,
  Frame,
  LandPlot,
  MapPin,
  Minus,
  Plus,
  Scan,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { archive, fieldEdition } from '../lib/field-guides'

// Positions below are fractions of the scanned page, not geographic coordinates.
const landmarks = [
  {
    name: 'Deva și cetatea',
    u: 0.666,
    v: 0.493,
    icon: LandPlot,
    note: 'Casele sunt grupate la poalele dealului. Deasupra lor se distinge conturul fortificației.',
  },
  {
    name: 'Valea Mureșului',
    u: 0.775,
    v: 0.39,
    icon: Waves,
    note: 'Cursul sinuos al râului organizează văile, drumurile și așezările reprezentate pe planșă.',
  },
]
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

export function HistoricalSheet() {
  const viewport = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null)
  const [size, setSize] = useState({ w: 680, h: 440 })
  const [view, setView] = useState({ zoom: 1, u: 0.5, v: 0.5, ax: 0.5, ay: 0.5 })
  const [chosen, setChosen] = useState('')
  const [failed, setFailed] = useState(false)
  const naturalW = 3400,
    naturalH = 2254
  const fit = Math.min((size.w - 24) / naturalW, (size.h - 24) / naturalH)
  const width = naturalW * fit * view.zoom,
    height = naturalH * fit * view.zoom
  const padX = Math.max(12, (size.w - width) / 2),
    padY = Math.max(12, (size.h - height) / 2)
  useEffect(() => {
    document.title = 'Deva pe harta iosefină, 1769–1773 · Atlas Deva'
    if (!viewport.current) return
    const ob = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    ob.observe(viewport.current)
    return () => ob.disconnect()
  }, [])
  useLayoutEffect(() => {
    const v = viewport.current
    if (!v) return
    v.scrollLeft = padX + view.u * width - view.ax * size.w
    v.scrollTop = padY + view.v * height - view.ay * size.h
  }, [view, padX, padY, size, width, height])
  const zoom = (z: number, ax = 0.5, ay = 0.5) => {
    const v = viewport.current
    if (!v) return
    setChosen('')
    setView({
      zoom: clamp(z, 1, 6),
      ax,
      ay,
      u: clamp((v.scrollLeft + ax * size.w - padX) / width, 0, 1),
      v: clamp((v.scrollTop + ay * size.h - padY) / height, 0, 1),
    })
  }
  const reset = () => {
    setChosen('')
    setView({ zoom: 1, u: 0.5, v: 0.5, ax: 0.5, ay: 0.5 })
  }
  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (view.zoom <= 1 || e.button !== 0 || e.pointerType === 'touch') return
    const v = e.currentTarget
    pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, left: v.scrollLeft, top: v.scrollTop }
    v.setPointerCapture(e.pointerId)
  }
  return (
    <main className="city-page field-page historical-sheet">
      <Link className="back-link" to="/ghiduri">
        ← Ghiduri locale
      </Link>
      <div className="sheet-heading">
        <div>
          <span className="city-eyebrow">
            <i />
            COLECȚIA CARTOGRAFICĂ
          </span>
          <h1>
            Deva pe harta <em>iosefină</em>
          </h1>
          <p>{archive.description}</p>
        </div>
        <span className="archive-seal">
          <Frame size={18} />
          <b>PL. 183</b>
          <small>TRANSILVANIA</small>
        </span>
      </div>
      <section className="sheet-reader" aria-label="Cititor de hartă istorică">
        <div className="sheet-toolbar">
          <div>
            <span className="sheet-dot" />
            PLANȘĂ DE ARHIVĂ <b>1769–1773</b>
          </div>
          <div className="sheet-buttons">
            <button
              onClick={() => zoom(view.zoom / 1.5)}
              disabled={view.zoom <= 1 || failed}
              aria-label="Micșorează planșa"
            >
              <Minus size={15} />
            </button>
            <output aria-live="polite">{Math.round(view.zoom * 100)}%</output>
            <button
              onClick={() => zoom(view.zoom * 1.5)}
              disabled={view.zoom >= 6 || failed}
              aria-label="Mărește planșa"
            >
              <Plus size={15} />
            </button>
            <i />
            <button
              disabled={failed}
              onClick={reset}
              aria-label="Încadrează planșa completă"
              title="Încadrează planșa completă"
            >
              <Scan size={15} />
            </button>
          </div>
        </div>
        <div
          ref={viewport}
          className={`sheet-viewport ${view.zoom > 1 ? 'magnified' : ''}`}
          role="region"
          aria-label="Planșa 183. Folosește săgețile pentru deplasare, plus și minus pentru zoom."
          tabIndex={0}
          onPointerDown={start}
          onPointerMove={(e) => {
            const p = pointer.current
            if (!p || p.id !== e.pointerId) return
            e.currentTarget.scrollLeft = p.left + p.x - e.clientX
            e.currentTarget.scrollTop = p.top + p.y - e.clientY
          }}
          onPointerUp={() => {
            pointer.current = null
          }}
          onLostPointerCapture={() => {
            pointer.current = null
          }}
          onPointerCancel={() => {
            pointer.current = null
          }}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            zoom(
              view.zoom < 6 ? view.zoom * 1.6 : 1,
              (e.clientX - r.left) / size.w,
              (e.clientY - r.top) / size.h,
            )
          }}
          onKeyDown={(e) => {
            if (['+', '=', '-', 'Home'].includes(e.key)) {
              e.preventDefault()
              if (e.key === 'Home') reset()
              else zoom(view.zoom * (e.key === '-' ? 1 / 1.5 : 1.5))
            }
          }}
        >
          {failed ? (
            <div className="sheet-error">
              <p>Reproducerea locală nu s-a încărcat.</p>
              <a className="city-btn" href={archive.source} target="_blank" rel="noreferrer">
                Consultă originalul <ArrowUpRight size={14} />
              </a>
            </div>
          ) : (
            <div className="sheet-mount" style={{ width: width + 2 * padX, height: height + 2 * padY }}>
              <img
                src={archive.image}
                alt="Ridicarea iosefină, planșa 183: așezarea Deva, cetatea, valea Mureșului și împrejurimile, 1769–1773."
                draggable={false}
                onError={() => setFailed(true)}
                style={{ width, height, left: padX, top: padY }}
              />
            </div>
          )}
        </div>
        <div className="sheet-caption">
          <span>Österreichisches Staatsarchiv · Kriegsarchiv, B IX 715</span>
          <span>Domeniu public</span>
        </div>
      </section>
      <div className="sheet-focus">
        <span>
          <Crosshair size={15} />
          Detalii de explorat
        </span>
        {landmarks.map((l) => (
          <button
            disabled={failed}
            key={l.name}
            aria-pressed={chosen === l.name}
            className={chosen === l.name ? 'active' : ''}
            onClick={() => {
              setChosen(l.name)
              setView({ zoom: 3.6, u: l.u, v: l.v, ax: 0.5, ay: 0.5 })
            }}
          >
            <l.icon size={14} />
            {l.name}
          </button>
        ))}
      </div>
      <p className="sheet-help" aria-live="polite">
        {landmarks.find((l) => l.name === chosen)?.note ||
          'Mărește planșa pentru detalii. Trage cu mouse-ul sau glisează cu degetul pentru a o deplasa. 100% înseamnă încadrarea întregii foi.'}
      </p>
      <div className="archive-documentation">
        <section>
          <span className="city-eyebrow">NOTĂ DE LECTURĂ</span>
          <h2>Un document, nu o hartă de navigație</h2>
          <p>
            Reproducerea păstrează orientarea și toponimele documentului de epocă. Nu este o suprapunere
            georeferențiată pe străzile actuale: pozițiile GPS, limitele de cartier și traseele de azi nu sunt
            desenate peste planșă.
          </p>
          <Link className="editorial-link" to="/harta">
            <MapPin size={14} />
            Deschide harta actuală a Devei <ArrowUpRight size={13} />
          </Link>
        </section>
        <aside>
          <span className="city-eyebrow">PROVENIENȚĂ</span>
          <h3>Prima ridicare militară a Transilvaniei</h3>
          <p>
            1769–1773 · foaia 183 · colecția B IX 715. Copia digitală provine din Wikimedia Commons; extrasul
            de copertă este decupat din aceeași planșă.
          </p>
          <a href={archive.source} target="_blank" rel="noreferrer">
            Fișa documentului și drepturile de utilizare <ArrowUpRight size={12} />
          </a>
          <a href={archive.original} target="_blank" rel="noreferrer">
            <Download size={12} />
            Imaginea originală, la rezoluție integrală
          </a>
          <small>Documentare: {fieldEdition}.</small>
        </aside>
      </div>
    </main>
  )
}
