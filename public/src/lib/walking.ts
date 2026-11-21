import { metersPerUnit } from './local-geography'
import type { Point } from './local-geography'
import type { Place } from './places'
import type { WalkingResult } from './atlas-store'
type Graph = { nodes: number[][]; adj: [number, number][][] }
let cached: Promise<Graph> | null = null
async function graph(): Promise<Graph> {
  if (!cached)
    cached = (async () => {
      const r = await fetch('/map/walk-network.json', { signal: AbortSignal.timeout(12000) })
      if (!r.ok) throw Error('Rețeaua pietonală nu a putut fi încărcată.')
      const d = (await r.json()) as { nodes: number[][]; paths: number[][] }
      const adj: [number, number][][] = d.nodes.map(() => [])
      for (const [one, ...ids] of d.paths)
        for (let i = 1; i < ids.length; i++) {
          const a = ids[i - 1],
            b = ids[i],
            ds = Math.hypot(d.nodes[a][0] - d.nodes[b][0], d.nodes[a][1] - d.nodes[b][1]) * metersPerUnit
          adj[a].push([b, ds])
          if (!one) adj[b].push([a, ds])
        }
      return { nodes: d.nodes, adj }
    })().catch((e) => {
      cached = null
      throw e
    })
  return cached
}
function shortest(g: Graph, s: number, d: number) {
  const cost = new Float64Array(g.nodes.length).fill(Infinity),
    prev = new Int32Array(g.nodes.length).fill(-1)
  cost[s] = 0
  const heap: [number, number][] = [[s, 0]]
  while (heap.length) {
    const [v, dist] = heap[0],
      last = heap.pop()!
    if (heap.length) {
      let k = 0
      while (k * 2 + 1 < heap.length) {
        let j = k * 2 + 1
        if (j + 1 < heap.length && heap[j + 1][1] < heap[j][1]) j++
        if (heap[j][1] >= last[1]) break
        heap[k] = heap[j]
        k = j
      }
      heap[k] = last
    }
    if (dist > cost[v]) continue
    if (v === d) break
    for (const [w, n] of g.adj[v]) {
      const nd = dist + n
      if (nd >= cost[w]) continue
      cost[w] = nd
      prev[w] = v
      let k = heap.length
      heap.push([w, nd])
      while (k) {
        const parent = (k - 1) >> 1
        if (heap[parent][1] <= nd) break
        heap[k] = heap[parent]
        k = parent
      }
      heap[k] = [w, nd]
    }
  }
  if (!Number.isFinite(cost[d]))
    throw Error(
      'Aceste opriri nu sunt conectate în rețeaua pietonală disponibilă. Încearcă alte locuri; nu trasăm segmente fictive.',
    )
  const path: number[] = []
  for (let j = d; j !== -1; j = prev[j]) path.push(j)
  return { cost: cost[d], path: path.reverse() }
}
export async function calculateWalk(stops: Place[]): Promise<WalkingResult> {
  if (stops.length < 2 || stops.length > 6) throw Error('Alege între două și șase opriri.')
  if (stops.some((p) => p.representative))
    throw Error(
      'Centrul unei rezervații nu este o intrare pietonală confirmată. Alege Parcul Bejan în locul Pădurii Bejan.',
    )
  const g = await graph()
  let snap = 0
  const ids = stops.map((p) => {
    let best = -1,
      dist = Infinity
    g.nodes.forEach(([x, y], i) => {
      const dd = Math.hypot(x - p.x, y - p.y) * metersPerUnit
      if (dd < dist) {
        dist = dd
        best = i
      }
    })
    if (dist > 180) throw Error(`Nu există un acces pietonal cartografiat suficient de aproape de ${p.name}.`)
    snap = Math.max(snap, dist)
    return best
  })
  let meters = 0
  const points: Point[] = []
  for (let i = 1; i < ids.length; i++) {
    const v = shortest(g, ids[i - 1], ids[i])
    meters += v.cost
    points.push(...v.path.map((n) => ({ x: g.nodes[n][0], y: g.nodes[n][1] })))
  }
  return {
    meters: Math.round(meters),
    minutes: Math.max(1, Math.round(meters / 70)),
    points,
    stops: stops.map((p) => p.id),
    snap: Math.round(snap),
  }
}
