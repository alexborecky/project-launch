// The one place game data is read and written. Today it's localStorage;
// a shared backend can replace `createLocalStore` without touching components.
import type { PartId } from '../config'
import type { TopicState, TopicStates } from '../game/rules'

export interface GameData {
  topics: TopicStates
  /** Launch Sequence step 3, ticked by the facilitator in god mode. */
  goNoGo: boolean
}

export interface GameStore {
  get(): GameData
  setTopic(part: PartId, state: TopicState): void
  setGoNoGo(value: boolean): void
  /** Every topic back to Waiting, rocket cleared. */
  reset(): void
  subscribe(listener: () => void): () => void
}

const EMPTY: GameData = { topics: {}, goNoGo: false }

export function createLocalStore(key = 'project-hack:v1'): GameStore {
  const listeners = new Set<() => void>()

  const read = (): GameData => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
    } catch {
      return EMPTY
    }
  }

  let data = read()

  const write = (next: GameData) => {
    data = next
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // storage full or blocked: keep working in memory
    }
    listeners.forEach((l) => l())
  }

  // Keep other tabs on the same machine in sync (e.g. god mode in a second tab).
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      data = read()
      listeners.forEach((l) => l())
    })
  }

  return {
    get: () => data,
    setTopic: (part, state) => write({ ...data, topics: { ...data.topics, [part]: state } }),
    setGoNoGo: (value) => write({ ...data, goNoGo: value }),
    reset: () => write(EMPTY),
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const store = createLocalStore()
