import { useEffect, useState, useSyncExternalStore } from 'react'
import { TOPICS } from '../config'
import { store, type GameData } from '../store/store'

/** `?demo` (design review only) shows a nearly complete rocket without touching saved data; `?demo=5` shows 5 parts. */
const demoParam = new URLSearchParams(location.search).get('demo')
const DEMO: GameData | null =
  demoParam != null
    ? { topics: Object.fromEntries(TOPICS.slice(0, Number(demoParam) || 11).map((t) => [t.part, { status: 'added' as const }])), goNoGo: true }
    : null

export function useGame(): GameData {
  const data = useSyncExternalStore(store.subscribe, store.get)
  return DEMO ?? data
}

/** Current time, updated every `ms`. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => matchMedia(query).matches,
  )
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')

function useHash(): string {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('hashchange', cb)
      return () => window.removeEventListener('hashchange', cb)
    },
    () => location.hash,
  )
}

export const useGodMode = () => useHash() === '#godmode'

/** Calls `fn` on every animation frame with the time in ms. */
export function useFrame(fn: (t: number, dt: number) => void, active = true) {
  useEffect(() => {
    if (!active) return
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      fn(t, Math.min(100, t - last))
      last = t
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [fn, active])
}
