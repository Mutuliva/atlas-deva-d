export function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
export function writeLocal(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
    return true
  } catch {
    return false
  }
}
export async function api<T>(action: string, body?: unknown, csrf?: string): Promise<T> {
  let r: Response
  try {
    r = await fetch(`/api/atlas?action=${encodeURIComponent(action)}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(csrf ? { 'X-Atlas-CSRF': csrf } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(14000),
    })
  } catch {
    throw new Error('Nu a fost primită confirmarea serverului. Verifică rețeaua și reîncearcă.')
  }
  if (!r.headers.get('content-type')?.includes('application/json'))
    throw new Error('Serviciul de publicare nu este conectat.')
  const v = await r.json()
  if (!r.ok) throw new Error(v.error || 'Operațiunea nu a reușit. Reîncearcă.')
  return v
}
