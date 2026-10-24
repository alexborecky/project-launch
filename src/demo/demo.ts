// Demo mode: the same app plus a floating toolbar for jumping between build states,
// times of day and launch states. On in the demo build (`npm run build:demo`) and with `?demo` in dev.
import { useSyncExternalStore } from 'react'
import { CAMERA_SLOTS } from '../config'

export const IS_DEMO = import.meta.env.MODE === 'demo' || new URLSearchParams(location.search).has('demo')

export type SlotId = (typeof CAMERA_SLOTS)[number]['id']

// Forced time of day. null = follow the Prague clock. `?camera=night` still works for quick links.
let forcedSlot: SlotId | null = CAMERA_SLOTS.find((c) => c.id === new URLSearchParams(location.search).get('camera'))?.id ?? null
const listeners = new Set<() => void>()

export function setForcedSlot(id: SlotId | null) {
  forcedSlot = id
  listeners.forEach((l) => l())
}

export function useForcedSlot(): SlotId | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => forcedSlot,
  )
}
