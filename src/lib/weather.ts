import { useEffect, useState } from 'react'
export const meteoUrl =
  'https://api.open-meteo.com/v1/forecast?latitude=45.878&longitude=22.914&current=temperature_2m,weather_code,wind_speed_10m&timezone=GMT'
export type Weather = { temperature: number; code: number; wind: number; time: string }
// Actual Open-Meteo response, kept with its timestamp; never passed off as a fresh reading.
const last: Weather = { temperature: 13.2, code: 3, wind: 1.8, time: '2026-11-19T12:00:00Z' }
let value: Weather | null = Date.parse(last.time) <= Date.now() + 900000 ? last : null,
  pending: Promise<Weather> | null = null,
  fetched = 0
export function sky(code: number) {
  return code === 0
    ? 'Cer senin'
    : code < 3
      ? 'Parțial noros'
      : code === 3
        ? 'Cer acoperit'
        : code < 50
          ? 'Ceață'
          : code < 60
            ? 'Burniță'
            : code < 70
              ? 'Ploaie'
              : code < 80
                ? 'Ninsoare'
                : code < 90
                  ? 'Averse'
                  : 'Furtună'
}
async function load() {
  if (pending) return pending
  if (value && Date.now() - fetched < 600000) return value
  pending = (async () => {
    const r = await fetch(meteoUrl, { signal: AbortSignal.timeout(8500) })
    if (!r.ok) throw Error()
    const d = (await r.json()).current
    const time = d.time + 'Z'
    if (
      !Number.isFinite(d.temperature_2m) ||
      !Number.isFinite(d.weather_code) ||
      !Number.isFinite(d.wind_speed_10m) ||
      !Number.isFinite(Date.parse(time)) ||
      Date.parse(time) > Date.now() + 900000
    )
      throw Error()
    value = { temperature: d.temperature_2m, code: d.weather_code, wind: d.wind_speed_10m, time }
    fetched = Date.now()
    return value
  })().finally(() => {
    pending = null
  })
  return pending
}
export function useWeather() {
  const [w, setW] = useState(value),
    [loading, setLoading] = useState(!value),
    [error, setError] = useState(false),
    [tick, retry] = useState(0),
    [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let active = true
    const fetchIt = () => {
      load()
        .then((v) => {
          if (active) {
            setW(v)
            setError(false)
          }
        })
        .catch(() => {
          if (active) setError(true)
        })
        .finally(() => {
          if (active) {
            setLoading(false)
            setNow(Date.now())
          }
        })
    }
    fetchIt()
    const timer = setInterval(fetchIt, 900000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [tick])
  return {
    w,
    loading,
    error,
    stale: !!w && (error || now - Date.parse(w.time) > 7200000),
    retry: () => {
      fetched = 0
      setLoading(true)
      retry((n) => n + 1)
    },
  }
}
