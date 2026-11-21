import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowUpRight, Check, Download, ImagePlus, Send, ShieldCheck, Trash2 } from 'lucide-react'
import { useAtlas } from '../lib/atlas-store'
import { api, readLocal, writeLocal } from '../lib/client'
import { preparePhoto } from '../lib/photo'
import { formatDate } from '../lib/city-data'
import { PageHeading } from './CityPages'
const KEY = 'deva-atlas:contributie:v1',
  empty = { title: '', kind: 'Groapă', location: '', description: '', photo: '', consent: false }
export default function Community() {
  const { configured, reports, refresh, toast } = useAtlas()
  const [form, setForm] = useState(() => {
      const raw = readLocal<unknown>(KEY, null)
      if (
        raw &&
        typeof raw === 'object' &&
        Object.keys(empty).every(
          (k) => typeof (raw as Record<string, unknown>)[k] === typeof empty[k as keyof typeof empty],
        )
      )
        return { ...(raw as typeof empty), consent: false }
      return empty
    }),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState(''),
    [success, setSuccess] = useState('')
  const patch = (k: string, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }))
    setSuccess('')
    setMsg('')
  }
  const persist = () => {
    const ok = writeLocal(KEY, form)
    setMsg(
      ok
        ? 'Schiță salvată pe acest dispozitiv. Nu a fost trimisă.'
        : 'Salvarea locală nu este disponibilă. Poți descărca schița.',
    )
    return ok
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!configured) {
      persist()
      return
    }
    setBusy(true)
    setMsg('')
    try {
      const r = await api<{ id: string }>('report', form)
      setSuccess(`Contribuția ${r.id.slice(0, 8)} a fost primită pentru moderare. Nu este încă publică.`)
      setForm({ ...empty })
      writeLocal(KEY, empty)
      await refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Trimiterea a eșuat.')
    } finally {
      setBusy(false)
    }
  }
  const exportIt = () => {
    const blob = new Blob(
      [JSON.stringify({ atlas: 'Deva', status: 'schiță locală, netrimisă', ...form }, null, 2)],
      { type: 'application/json' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'atlas-deva-contributie.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    toast('Schiță exportată')
  }
  return (
    <main className="city-page">
      <PageHeading
        eyebrow="DEVA PENTRU COMUNITATE"
        title="Vocea comunității"
        sub="Semnalează o problemă, propune o îmbunătățire sau ajută-ne să documentăm un loc."
      />
      <div className="community-layout">
        <form className="panel-form" onSubmit={submit}>
          <div className="section-row">
            <h2>Contribuția ta</h2>
            <span className="neutral-pill">
              <ShieldCheck size={12} />
              Moderare
            </span>
          </div>
          <label>
            Tipul contribuției
            <select value={form.kind} onChange={(e) => patch('kind', e.target.value)}>
              {['Groapă', 'Iluminat defect', 'Spațiu verde', 'Propunere', 'Loc interesant', 'Observație'].map(
                (c) => (
                  <option key={c}>{c}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Titlu
            <input
              required
              minLength={5}
              maxLength={120}
              value={form.title}
              onChange={(e) => patch('title', e.target.value)}
              placeholder="Descrie pe scurt situația"
            />
          </label>
          <label>
            Locul sau adresa
            <input
              required
              minLength={3}
              maxLength={180}
              value={form.location}
              onChange={(e) => patch('location', e.target.value)}
              placeholder="Stradă, cartier sau reper cunoscut"
            />
          </label>
          <label>
            Descriere
            <textarea
              required
              minLength={15}
              maxLength={2000}
              rows={4}
              value={form.description}
              onChange={(e) => patch('description', e.target.value)}
              placeholder="Ce ai observat? Pentru un loc nou, adaugă o sursă și coordonatele, dacă le cunoști."
            />
          </label>
          <label className="photo-upload">
            <ImagePlus size={20} />
            <span>
              Adaugă o fotografie <small>Opțional · JPG, PNG sau WebP · maximum 8 MB</small>
            </span>
            <input
              aria-label="Fotografie pentru contribuție"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setBusy(true)
                try {
                  patch('photo', await preparePhoto(f))
                } catch (err) {
                  setMsg(err instanceof Error ? err.message : 'Imagine nevalidă.')
                } finally {
                  setBusy(false)
                }
              }}
            />
          </label>
          {form.photo && (
            <div className="upload-preview">
              <img src={form.photo} alt="Fotografia atașată" />
              <button type="button" aria-label="Elimină fotografia" onClick={() => patch('photo', '')}>
                <Trash2 size={15} />
              </button>
            </div>
          )}
          <label className="check-option">
            <input
              required
              type="checkbox"
              checked={form.consent}
              onChange={(e) => patch('consent', e.target.checked)}
            />
            Confirm că am dreptul să folosesc fotografia și nu includ date personale, fețe identificabile sau
            numere de înmatriculare.
          </label>
          {!configured && (
            <p className="connection-note">
              <b>Mod schiță locală.</b> Primirea contribuțiilor necesită conectarea stocării pe server. Nimic
              nu este publicat sau transmis primăriei.
            </p>
          )}
          <div className="form-actions">
            <button className="city-btn" disabled={busy} type="submit">
              {configured ? <Send size={14} /> : <Check size={14} />}{' '}
              {busy ? 'Se procesează…' : configured ? 'Trimite la moderare' : 'Salvează schița'}
            </button>
            <button
              className="city-btn outline"
              type="button"
              onClick={exportIt}
              disabled={!form.title.trim()}
            >
              <Download size={14} />
              Exportă
            </button>
          </div>
          {msg && (
            <p role="status" className="form-message">
              {msg}
            </p>
          )}
          {success && (
            <p role="status" className="success-message">
              {success}
            </p>
          )}
        </form>
        <aside>
          <div className="civic-help">
            <ShieldCheck size={24} />
            <h2>Un atlas responsabil</h2>
            <p>
              Contribuțiile primite sunt private până la verificarea de către un moderator. Informațiile
              neconfirmate nu devin automat repere pe hartă.
            </p>
            <hr />
            <h3>Sesizare oficială?</h3>
            <p>
              Atlas Deva este un ghid independent, nu registratura municipală. Folosește serviciul oficial
              pentru un număr de înregistrare.
            </p>
            <a href="https://deva24.primariadeva.ro/" target="_blank" rel="noreferrer">
              Sesizări la Primăria Deva <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>
      </div>
      <div className="section-row">
        <h2>Contribuții moderate</h2>
        <span className="neutral-pill">{reports.length} publicate</span>
      </div>
      {reports.length ? (
        <div className="notice-grid">
          {reports.map((r) => (
            <article key={r.id}>
              {r.photo && <img src={r.photo} loading="lazy" alt="Fotografie moderată" />}
              <span className="city-eyebrow">
                {r.kind} · {r.status === 'resolved' ? 'Soluționată' : 'Publicată'}
              </span>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <small>
                {r.location} · {formatDate(r.created)}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-note">
          {configured
            ? 'Nicio contribuție publicată după moderare.'
            : 'Nu este conectat un flux de contribuții publice.'}
        </p>
      )}
    </main>
  )
}
