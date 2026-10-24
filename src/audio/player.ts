// The radio: plays one audio file at a time and queues the rest, so two sounds never overlap.
// While a launch is on (countdown voice + launch clip), everything else waits until it's over.
// Respects the Communications speaker toggle.
import { useSyncExternalStore } from 'react'
import { isMuted, onMutedChange } from '../hooks/muted'

const MAX_QUEUE = 3
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let current: HTMLAudioElement | null = null
let currentSrc: string | null = null
const queue: string[] = []
/** True during a launch: queued messages wait, nothing new starts. */
let held = false

function start(src: string, offsetSec = 0) {
  const audio = new Audio(src)
  current = audio
  currentSrc = src
  audio.currentTime = offsetSec
  audio.onended = next
  audio.onerror = next
  emit()
  // Browsers block sound until someone has clicked on the page. Then this message is simply skipped.
  audio.play().catch(next)
}

function next() {
  current = null
  currentSrc = null
  const src = held ? undefined : queue.shift()
  if (src && !isMuted()) start(src)
  else emit()
}

/** Plays after whatever is playing now (and after a launch). Ignored while muted, or when the queue is already full. */
export function enqueue(src: string) {
  if (isMuted()) return
  if (!current && !held) return start(src)
  if (src === currentSrc || queue.includes(src) || queue.length >= MAX_QUEUE) return
  queue.push(src)
}

/**
 * Stops whatever is playing and plays this right away (demo buttons, waveform click).
 * During a launch it's ignored, unless it's the launch's own countdown (`launch: true`).
 */
export function playNow(src: string, offsetSec = 0, opts: { launch?: boolean } = {}) {
  if (held && !opts.launch) return
  stopCurrent()
  if (!isMuted()) start(src, offsetSec)
}

/** A launch starts (true) or ends (false). While on, the radio stays quiet; queued messages play afterwards. */
export function holdForLaunch(on: boolean) {
  held = on
  if (on) stopCurrent()
  else if (!current) next()
}

function stopCurrent() {
  if (current) {
    current.onended = null
    current.onerror = null
    current.pause()
  }
  current = null
  currentSrc = null
  emit()
}

export function stopAll() {
  queue.length = 0
  stopCurrent()
}

export const isPlaying = () => current != null
export const isHeld = () => held

// Muting stops whatever is playing.
onMutedChange(() => {
  if (isMuted()) stopAll()
})

/** True while a message is playing; drives the waveform and ON AIR. */
export function usePlaying(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => current != null,
  )
}

export const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]
