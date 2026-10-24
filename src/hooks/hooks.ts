import { useEffect, useState, useSyncExternalStore } from 'react'
import { IS_DEMO } from '../demo/demo'
import { store, type GameData, type SyncStatus } from '../store/store'

export function useGame(): GameData {
  return useSyncExternalStore(store.subscribe, store.get)
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(store.subscribe, store.status)
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

/** God mode: `#godmode` in the URL, and always on in the demo. */
export const useGodMode = () => useHash() === '#godmode' || IS_DEMO

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
