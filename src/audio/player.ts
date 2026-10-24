// The radio: plays one audio file at a time and queues the rest. Respects the Communications speaker toggle.
import { useSyncExternalStore } from 'react'
import { isMuted, onMutedChange } from '../hooks/muted'

const MAX_QUEUE = 3
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

let current: HTMLAudioElement | null = null
let currentSrc: string | null = null
const queue: string[] = []

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
  const src = queue.shift()
  if (src && !isMuted()) start(src)
  else emit()
}

/** Plays after whatever is playing now. Ignored while muted, or when the queue is already full. */
export function enqueue(src: string) {
  if (isMuted()) return
  if (!current) return start(src)
  if (src === currentSrc || queue.includes(src) || queue.length >= MAX_QUEUE) return
  queue.push(src)
}

/** Stops everything and plays this right away (the launch countdown, demo buttons). */
export function playNow(src: string, offsetSec = 0) {
  stopAll()
  if (!isMuted()) start(src, offsetSec)
}

export function stopAll() {
  queue.length = 0
  if (current) {
    current.onended = null
    current.onerror = null
    current.pause()
  }
  current = null
  currentSrc = null
  emit()
}

export const isPlaying = () => current != null

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
