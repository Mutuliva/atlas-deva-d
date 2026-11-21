import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Edit3, LockKeyhole, LogOut, Plus, Trash2 } from 'lucide-react'
import { useAtlas } from '../lib/atlas-store'
import { api } from '../lib/client'
import { businessKinds } from '../lib/city-data'
import type { CityEvent, Contribution } from '../lib/city-data'
import { categories } from '../lib/places'
import type { Place } from '../lib/places'
import { PageHeading, SearchBox } from './CityPages'
import { preparePhoto } from '../lib/photo'
import { Dialog } from './Dialogs'
const seed = {
  id: '',
  name: '',
  category: 'Istorie',
  businessType: '',
  intro: '',
  story: '',
  location: '',
  address: '',
  lat: '',
  lon: '',
  phone: '',
  hours: '',
  website: '',
  source: '',
  image: '/map/small-atlas.webp',
  photoCredit: '',
  photoSource: '',
  cartogram: true,
  representative: false,
  tip: '',
  title: '',
  venue: '',
  start: '',
  end: '',
  description: '',
  type: 'Activitate',
}
type Editor = typeof seed
const toLocal = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
export default function Admin() {
  const { places, events, configured, adminConfigured, refresh } = useAtlas()
  const [csrf, setCsrf] = useState(''),
    [username, setUser] = useState(''),
    [pw, setPw] = useState(''),
    [tab, setTab] = useState('Locații'),
    [q, setQ] = useState(''),
    [msg, setMsg] = useState(''),
    [busy, setBusy] = useState(false),
    [editor, setEditor] = useState<Editor | null>(null),
    [remove, setRemove] = useState<{ id: string; name: string } | null>(null),
    [queue, setQueue] = useState<Contribution[]>([])
  const kind = tab === 'Evenimente' ? 'event' : 'location'
  const readQueue = async () => setQueue(await api<Contribution[]>('moderation'))
  useEffect(() => {
    let ok = true
    if (adminConfigured)
      api<{ csrf: string }>('session')
        .then((s) => {
          if (ok) setCsrf(s.csrf)
        })
        .catch(() => {})
    return () => {
      ok = false
    }
  }, [adminConfigured])
  useEffect(() => {
    if (csrf)
      api<Contribution[]>('moderation')
        .then(setQueue)
        .catch(() => setMsg('Coada de moderare nu a putut fi încărcată.'))
  }, [csrf])
  const act = async (fn: () => Promise<void>) => {
    setBusy(true)
    setMsg('')
    try {
      await fn()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Operațiunea a eșuat.')
    } finally {
      setBusy(false)
    }
  }
  const login = (e: FormEvent) => {
    e.preventDefault()
    void act(async () => {
      const s = await api<{ csrf: string }>('login', { username, password: pw })
      setCsrf(s.csrf)
      setPw('')
    })
  }
  const open = (p?: Place | CityEvent) => {
    setMsg('')
    if (!p) {
      setEditor({ ...seed, id: crypto.randomUUID(), businessType: tab === 'Afaceri' ? 'Restaurante' : '' })
      return
    }
    if ('lat' in p)
      setEditor({
        ...seed,
        ...p,
        businessType: p.businessType || (p.category === 'Magazine' ? 'Magazine' : ''),
        lat: String(p.lat),
        lon: String(p.lon),
        phone: p.phone || '',
        hours: p.hours || '',
        website: p.website || '',
        photoCredit: p.photoCredit || '',
        photoSource: p.photoSource || '',
        cartogram: !!p.cartogram,
        representative: !!p.representative,
        source: p.sources?.[0]?.url || '',
      })
    else setEditor({ ...seed, ...p, start: toLocal(p.start), end: toLocal(p.end || '') })
  }
  const entries =
    tab === 'Evenimente'
      ? events
      : places.filter((p) => (tab === 'Afaceri' ? p.businessType || p.category === 'Magazine' : true))
  const set = (k: keyof Editor, v: string) => setEditor((f) => (f ? { ...f, [k]: v } : null))
  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!editor) return
    void act(async () => {
      const rec = {
        ...editor,
        ...(kind === 'event'
          ? {
              start: new Date(editor.start).toISOString(),
              end: editor.end ? new Date(editor.end).toISOString() : undefined,
            }
          : { lat: Number(editor.lat), lon: Number(editor.lon) }),
      }
      await api('save', { kind, id: editor.id, record: rec }, csrf)
      await refresh()
      setEditor(null)
      setMsg('Modificările au fost publicate.')
    })
  }
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="SPAȚIU PROTEJAT"
        title="Administrare"
        sub="Conținut editorial și moderare, disponibile numai administratorului autorizat."
      />
      {!csrf ? (
        !configured || !adminConfigured ? (
          <section className="setup-panel">
            <LockKeyhole size={27} />
            <h2>Administrarea nu este activată</h2>
            <p>
              Nu există un cont demonstrativ sau o parolă implicită. Datele ghidului rămân disponibile pentru
              explorare.
            </p>
            <h3>Configurare necesară pe server</h3>
            <ol>
              <li>
                Conectează stocarea persistentă folosind <code>UPSTASH_REDIS_REST_URL</code> și{' '}
                <code>UPSTASH_REDIS_REST_TOKEN</code>.
              </li>
              <li>
                Definește <code>ATLAS_ADMIN_USER</code> și <code>ATLAS_ADMIN_HASH</code>. Generează hashul
                scrypt cu utilitarul inclus, fără parole în cod.
              </li>
              <li>
                Reîncarcă implementarea Vercel cu funcția <code>/api/atlas</code>. Instrucțiunile complete
                sunt în <strong>CONFIGURARE.md</strong>.
              </li>
            </ol>
            <p className="muted-note">Cheile și autorizarea sunt verificate pe server, nu în browser.</p>
          </section>
        ) : (
          <form className="panel-form login-form" onSubmit={login}>
            <LockKeyhole size={24} />
            <h2>Autentificare administrator</h2>
            <label>
              Utilizator
              <input
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUser(e.target.value)}
              />
            </label>
            <label>
              Parolă
              <input
                autoComplete="current-password"
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </label>
            <button className="city-btn" disabled={busy}>
              Autentificare
            </button>
          </form>
        )
      ) : (
        <>
          <div className="page-toolbar">
            <div className="filter-tabs">
              {['Locații', 'Afaceri', 'Evenimente', 'Moderare'].map((t) => (
                <button
                  key={t}
                  className={tab === t ? 'active' : ''}
                  onClick={() => {
                    setTab(t)
                    setQ('')
                    setMsg('')
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              className="city-btn outline"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await api('logout', {}, csrf)
                  setCsrf('')
                  setQueue([])
                })
              }
            >
              <LogOut size={14} />
              Ieșire
            </button>
          </div>
          {tab === 'Moderare' ? (
            <div className="admin-queue">
              {!queue.length && <p className="muted-note">Nu există sesizări primite.</p>}
              {queue.map((r) => (
                <article key={r.id} className="panel-form">
                  <span className="city-eyebrow">
                    {r.kind} · {r.status}
                  </span>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <small>{r.location}</small>
                  {r.photo && (
                    <img className="review-pic" src={r.photo} alt="Fotografie propusă spre moderare" />
                  )}
                  <div className="form-actions">
                    {[
                      ['approved', 'Aprobă'],
                      ['rejected', 'Respinge'],
                      ['resolved', 'Marchează soluționată'],
                    ].map(([s, label]) => (
                      <button
                        className="city-btn outline"
                        key={s}
                        disabled={busy || r.status === s}
                        onClick={() =>
                          act(async () => {
                            await api('moderate', { id: r.id, status: s }, csrf)
                            await readQueue()
                            await refresh()
                            setMsg('Starea sesizării a fost actualizată.')
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <div className="page-toolbar">
                <SearchBox label="Caută în conținut" value={q} onChange={setQ} />
                <button className="city-btn" onClick={() => open()}>
                  <Plus size={14} />
                  Adaugă {kind === 'event' ? 'eveniment' : tab === 'Afaceri' ? 'afacere' : 'locație'}
                </button>
              </div>
              <div className="admin-table">
                {entries
                  .filter((p) =>
                    ('name' in p ? p.name : p.title)
                      .toLocaleLowerCase('ro')
                      .includes(q.toLocaleLowerCase('ro')),
                  )
                  .map((p) => (
                    <div key={p.id}>
                      <span>
                        <b>{'name' in p ? p.name : p.title}</b>
                        <small>{'category' in p ? p.category : p.venue}</small>
                      </span>
                      <button
                        aria-label={`Editează ${'name' in p ? p.name : p.title}`}
                        onClick={() => open(p)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        aria-label={`Șterge ${'name' in p ? p.name : p.title}`}
                        onClick={() => setRemove({ id: p.id, name: 'name' in p ? p.name : p.title })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </>
      )}
      {msg && !editor && !remove && (
        <p className="form-message" role="status">
          {msg}
        </p>
      )}
      {editor && (
        <Dialog
          onClose={() => {
            if (!busy) setEditor(null)
          }}
          labelledBy="edit-title"
          className="form-dialog admin-edit"
        >
          <h2 id="edit-title">{kind === 'event' ? 'Fișă de eveniment' : 'Fișă de locație'}</h2>
          <form className="panel-form" onSubmit={save}>
            {(kind === 'event'
              ? [
                  ['title', 'Titlu'],
                  ['venue', 'Loc de desfășurare'],
                  ['type', 'Tipul evenimentului'],
                  ['start', 'Început (ora dispozitivului)'],
                  ['end', 'Sfârșit (opțional)'],
                  ['description', 'Descriere'],
                  ['source', 'Sursă HTTPS'],
                ]
              : [
                  ['name', 'Nume'],
                  ['intro', 'Descriere scurtă'],
                  ['story', 'Descriere detaliată'],
                  ['location', 'Zonă / stradă'],
                  ['address', 'Adresă'],
                  ['lat', 'Latitudine'],
                  ['lon', 'Longitudine'],
                  ['phone', 'Telefon (opțional)'],
                  ['hours', 'Program (opțional)'],
                  ['website', 'Site HTTPS (opțional)'],
                  ['source', 'Sursă verificabilă HTTPS'],
                ]
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                {['story', 'description'].includes(key) ? (
                  <textarea
                    required
                    minLength={10}
                    value={String(editor[key as keyof Editor])}
                    onChange={(e) => set(key as keyof Editor, e.target.value)}
                  />
                ) : (
                  <input
                    required={!['website', 'phone', 'hours', 'end'].includes(key)}
                    type={
                      ['start', 'end'].includes(key)
                        ? 'datetime-local'
                        : ['lat', 'lon'].includes(key)
                          ? 'number'
                          : ['website', 'source'].includes(key)
                            ? 'url'
                            : 'text'
                    }
                    step="any"
                    value={String(editor[key as keyof Editor])}
                    onChange={(e) => set(key as keyof Editor, e.target.value)}
                  />
                )}
              </label>
            ))}
            {kind === 'location' && (
              <>
                <label>
                  Categorie
                  <select value={editor.category} onChange={(e) => set('category', e.target.value)}>
                    {Object.keys(categories)
                      .filter((c) => c !== 'Toate')
                      .map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                  </select>
                </label>
                <label>
                  Tip de afacere
                  <select value={editor.businessType} onChange={(e) => set('businessType', e.target.value)}>
                    <option value="">Nu este afacere</option>
                    {businessKinds.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Fotografie cu drept de publicare
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f)
                        void act(async () => {
                          const m = await api<{ url: string }>(
                            'upload',
                            { photo: await preparePhoto(f) },
                            csrf,
                          )
                          setEditor((v) => (v ? { ...v, image: m.url, cartogram: false } : null))
                        })
                    }}
                  />
                </label>
                <img className="review-pic" src={editor.image} alt="Imagine selectată pentru locație" />
                <label>
                  Credit fotografic
                  <input value={editor.photoCredit} onChange={(e) => set('photoCredit', e.target.value)} />
                </label>
              </>
            )}
            <button className="city-btn" disabled={busy}>
              <Check size={14} />
              {busy ? 'Se salvează…' : 'Publică modificările'}
            </button>
            {msg && (
              <p role="alert" className="form-message">
                {msg}
              </p>
            )}
          </form>
        </Dialog>
      )}
      {remove && (
        <Dialog onClose={() => setRemove(null)} labelledBy="remove-title" className="form-dialog">
          <h2 id="remove-title">Ștergi această fișă?</h2>
          <p>„{remove.name}” nu va mai apărea în atlasul public.</p>
          <div className="form-actions">
            <button
              className="city-btn danger"
              disabled={busy}
              onClick={() =>
                act(async () => {
                  await api('delete', { kind, id: remove.id }, csrf)
                  await refresh()
                  setRemove(null)
                  setMsg('Fișă retrasă din atlas.')
                })
              }
            >
              Confirmă ștergerea
            </button>
            <button className="city-btn outline" onClick={() => setRemove(null)}>
              Renunță
            </button>
          </div>
          {msg && <p role="status">{msg}</p>}
        </Dialog>
      )}
    </main>
  )
}
