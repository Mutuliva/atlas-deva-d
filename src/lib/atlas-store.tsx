import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { categories, places as base } from './places'
import type { Place } from './places'
import { project } from './local-geography'
import { scheduledEvents } from './city-data'
import type { CityEvent, Contribution } from './city-data'

import { api, readLocal, writeLocal } from './client'
export type ManagedPlace = Omit<Place, 'x' | 'y'>
interface PublicData {
  configured: boolean
  adminConfigured: boolean
  locations: ManagedPlace[]
  events: CityEvent[]
  deleted: string[]
  reports: Contribution[]
}
const blank: PublicData = {
  configured: false,
  adminConfigured: false,
  locations: [],
  events: [],
  deleted: [],
  reports: [],
}
export interface WalkingResult {
  points: { x: number; y: number }[]
  meters: number
  minutes: number
  stops: string[]
  snap: number
}
interface AtlasState {
  places: Place[]
  events: CityEvent[]
  reports: Contribution[]
  configured: boolean
  adminConfigured: boolean
  refresh: () => Promise<void>
  saved: string[]
  toggleSave: (id: string) => void
  routeIds: string[]
  setRouteIds: (s: string[]) => void
  walk: WalkingResult | null
  setWalk: (w: WalkingResult | null) => void
  toast: (s: string) => void
  dark: boolean
  toggleTheme: () => void
}
const C = createContext<AtlasState | null>(null)
// The context is intentionally shared by the existing map and the new city sections.
// eslint-disable-next-line react-refresh/only-export-components
export const useAtlas = () => {
  const s = useContext(C)
  if (!s) throw new Error('Atlas context missing')
  return s
}
const stringList = (k: string) => {
  const a = readLocal<unknown>(k, [])
  return Array.isArray(a) ? [...new Set(a.filter((x): x is string => typeof x === 'string'))] : []
}
export function AtlasProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PublicData>(blank),
    [saved, setSaved] = useState(() => stringList('deva-atlas:locuri-salvate:v1')),
    [routeIds, routeSet] = useState(() => stringList('deva-atlas:traseu:v1').slice(0, 6)),
    [walk, setWalk] = useState<WalkingResult | null>(null)
  const [msg, toast] = useState(''),
    [dark, setDark] = useState(() => readLocal<string>('deva-atlas:theme', 'light') === 'dark')
  const refresh = useCallback(async () => {
    try {
      const result = await api<PublicData>('public')
      if (
        !Array.isArray(result.locations) ||
        !Array.isArray(result.events) ||
        !Array.isArray(result.reports) ||
        !Array.isArray(result.deleted)
      )
        throw Error()
      setSnapshot(result)
    } catch {
      setSnapshot(blank)
    }
  }, [])
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0)
    return () => clearTimeout(timer)
  }, [refresh])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    writeLocal('deva-atlas:theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => {
    writeLocal('deva-atlas:locuri-salvate:v1', saved)
  }, [saved])
  useEffect(() => {
    writeLocal('deva-atlas:traseu:v1', routeIds)
  }, [routeIds])
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => toast(''), 2800)
    return () => clearTimeout(t)
  }, [msg])
  const places = useMemo(() => {
    const m = new Map(base.map((p) => [p.id, p]))
    for (const p of snapshot.locations)
      if (p.category in categories && Number.isFinite(p.lat) && Number.isFinite(p.lon))
        m.set(p.id, { ...p, ...project(p.lat, p.lon) })
    return [...m.values()].filter((p) => !snapshot.deleted.includes(p.id))
  }, [snapshot])
  const events = useMemo(() => {
    const m = new Map(scheduledEvents.map((e) => [e.id, e]))
    for (const e of snapshot.events) m.set(e.id, e)
    return [...m.values()]
      .filter((e) => !snapshot.deleted.includes(e.id))
      .sort((a, b) => a.start.localeCompare(b.start))
  }, [snapshot])
  const toggleSave = (id: string) => {
    const old = saved.includes(id)
    setSaved((s) => (s.includes(id) ? s.filter((i) => i !== id) : [...s, id]))
    toast(old ? 'Loc eliminat din favorite' : 'Loc adăugat în favorite')
  }
  const setRouteIds = (v: string[]) => {
    routeSet([...new Set(v)].slice(0, 6))
    setWalk(null)
  }
  return (
    <C.Provider
      value={{
        places,
        events,
        reports: snapshot.reports,
        configured: snapshot.configured,
        adminConfigured: snapshot.adminConfigured,
        refresh,
        saved,
        toggleSave,
        routeIds,
        setRouteIds,
        walk,
        setWalk,
        toast,
        dark,
        toggleTheme: () => setDark((d) => !d),
      }}
    >
      {children}
      {msg && (
        <div className="toast" role="status">
          {msg}
        </div>
      )}
    </C.Provider>
  )
}
