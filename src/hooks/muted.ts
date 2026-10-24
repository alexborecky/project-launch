// The speaker toggle in Communications: one setting for the voice and the launch clips. Remembered per device.
import { useSyncExternalStore } from 'react'

const MUTE_KEY = 'project-hack:muted'
const listeners = new Set<() => void>()

let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // ignore
  }
  listeners.forEach((l) => l())
}

/** Current value, for code outside React (the audio player). */
export const isMuted = () => muted

/** Called whenever the speaker toggle changes. */
export function onMutedChange(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => muted,
  )
}
