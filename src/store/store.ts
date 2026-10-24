// The one place game data is read and written. Two versions share one interface:
// - local: saved in this browser (the demo, and `npm run dev`)
// - shared: saved on Netlify and synced between every screen (the Netlify site, `npm run netlify`)
// Every change is an Action applied by `applyAction`, in the browser or on the server.
import { IS_DEMO } from '../demo/demo'
import { EMPTY_GAME, applyAction, type Action, type GameData, type Role } from '../game/actions'

export type { GameData } from '../game/actions'

/** local = this browser only · connecting/synced/offline = shared save on Netlify */
export type SyncStatus = 'local' | 'connecting' | 'synced' | 'offline'

export type DispatchResult = { ok: true } | { ok: false; error: string; need?: Role; offline?: boolean }

export interface GameStore {
  get(): GameData
  status(): SyncStatus
  /** Best guess at the server's clock, so every screen plays a launch at the same moment. */
  serverNow(): number
  dispatch(action: Action): Promise<DispatchResult>
  subscribe(listener: () => void): () => void
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: keep working in memory
  }
}

// ---------------------------------------------------------------- local

export function createLocalStore(key: string): GameStore {
  const listeners = new Set<() => void>()
  const read = (): GameData => ({ ...EMPTY_GAME, ...readJSON<Partial<GameData>>(key) })
  let data = read()
  const emit = () => listeners.forEach((l) => l())

  // Keep other tabs on the same machine in sync (e.g. god mode in a second tab).
  window.addEventListener('storage', (e) => {
    if (e.key !== key) return
    data = read()
    emit()
  })

  return {
    get: () => data,
    status: () => 'local',
    serverNow: () => Date.now(),
    async dispatch(action) {
      // Everything is allowed locally: there's no one to check codes against.
      const result = applyAction(data, action, { now: Date.now(), random: Math.random, role: 'admin' })
      if (!result.ok) return { ok: false, error: result.error }
      data = result.state
      writeJSON(key, data)
      emit()
      return { ok: true }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// ---------------------------------------------------------------- shared

const CODE_KEY = 'project-hack:code'

/** The team or admin code this browser uses for changes. Remembered on this device. */
export const savedCode = () => readJSON<string>(CODE_KEY) ?? ''
export const saveCode = (code: string) => writeJSON(CODE_KEY, code.trim())

const POLL_MS = 3000
/** Laptops with the board in a background tab check less often. */
const POLL_HIDDEN_MS = 20000

export function createSharedStore(cacheKey: string): GameStore {
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  // The last state the server confirmed. Shown straight away after a refresh, even offline.
  let confirmed: GameData = { ...EMPTY_GAME, ...readJSON<Partial<GameData>>(cacheKey) }
  // A change this screen has made but the server hasn't answered yet. Shown instantly.
  let pending: GameData | null = null
  let status: SyncStatus = 'connecting'
  let offset = 0 // server clock minus local clock

  const setStatus = (s: SyncStatus) => {
    if (s !== status) {
      status = s
      emit()
    }
  }

  const accept = (state: GameData, serverNow: number | undefined, sentAt: number) => {
    if (serverNow) offset = serverNow - (sentAt + Date.now()) / 2
    if (state.version !== confirmed.version || JSON.stringify(state) !== JSON.stringify(confirmed)) {
      confirmed = state
      writeJSON(cacheKey, confirmed)
      emit()
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  const poll = async () => {
    clearTimeout(timer)
    const sentAt = Date.now()
    try {
      const res = await fetch(`/api/state?since=${confirmed.version}`, { cache: 'no-store' })
      if (res.status === 204) {
        const now = Number(res.headers.get('x-server-now'))
        if (now) offset = now - (sentAt + Date.now()) / 2
      } else if (res.ok) {
        const body = (await res.json()) as { state: GameData; serverNow: number }
        accept(body.state, body.serverNow, sentAt)
      } else {
        throw new Error(String(res.status))
      }
      setStatus('synced')
    } catch {
      setStatus('offline')
    }
    timer = setTimeout(poll, document.hidden ? POLL_HIDDEN_MS : POLL_MS)
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void poll()
  })
  window.addEventListener('online', () => void poll())
  void poll()

  return {
    get: () => pending ?? confirmed,
    status: () => status,
    serverNow: () => Date.now() + offset,
    async dispatch(action) {
      // Show topic steps instantly; launches and resets wait for the server's answer.
      if (action.type === 'topic') {
        const guess = applyAction(confirmed, action, { now: Date.now(), random: Math.random, role: 'admin' })
        if (guess.ok) {
          pending = guess.state
          emit()
        }
      }
      const sentAt = Date.now()
      try {
        const res = await fetch('/api/action', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-team-code': savedCode() },
          body: JSON.stringify(action),
        })
        const body = (await res.json()) as { state?: GameData; serverNow?: number; error?: string; need?: Role }
        pending = null
        if (body.state) accept(body.state, body.serverNow, sentAt)
        emit()
        setStatus('synced')
        return res.ok ? { ok: true } : { ok: false, error: body.error ?? 'Something went wrong.', need: body.need }
      } catch {
        pending = null
        emit()
        setStatus('offline')
        return { ok: false, offline: true, error: 'No connection to the board. Check the Wi-Fi and try again.' }
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// ---------------------------------------------------------------- which one

/** The Netlify build sets VITE_SYNC=1. The demo always stays local. */
export const SHARED = import.meta.env.VITE_SYNC === '1' && !IS_DEMO

export const store: GameStore = SHARED
  ? createSharedStore('project-hack:shared-cache')
  : createLocalStore(IS_DEMO ? 'project-hack:demo' : 'project-hack:v1')
