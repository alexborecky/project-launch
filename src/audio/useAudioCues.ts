// When to play what: watches the game and plays the matching radio message.
import { useEffect, useRef } from 'react'
import { AUDIO, TOPICS } from '../config'
import type { GameData } from '../game/actions'
import { statusOf, type TopicStates } from '../game/rules'
import { store } from '../store/store'
import { enqueue, isPlaying, pick, playNow } from './player'

const between = ([min, max]: number[]) => min + Math.random() * (max - min)

/**
 * - A topic moves from Waiting to In Progress → its message plays 5–10 s later (if it has one).
 * - A part is added → one of the "new part" messages plays. Many parts at once (demo, reset) → just one.
 * - A launch starts → the countdown plays, unless this screen joined after it began.
 * - Every 30–90 s → random radio chatter, if nothing else is playing.
 * Changes seen when the page first loads don't count, so a refresh stays quiet.
 */
export function useAudioCues(game: GameData) {
  const previous = useRef<TopicStates | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Topic started / part added
  useEffect(() => {
    const before = previous.current
    previous.current = game.topics
    if (!before) return
    const now = game.topics

    for (const t of TOPICS) {
      const file = AUDIO.targeted[t.part]
      if (file && statusOf(before, t.part) === 'waiting' && statusOf(now, t.part) === 'progress') {
        timers.current.push(setTimeout(() => enqueue(file), between(AUDIO.targetedDelayMs)))
      }
    }

    const added = TOPICS.some((t) => statusOf(before, t.part) !== 'added' && statusOf(now, t.part) === 'added')
    if (added) timers.current.push(setTimeout(() => enqueue(pick(AUDIO.newPart)), AUDIO.newPartDelayMs))
  }, [game.topics])

  // Launch countdown
  const launchId = game.launch?.id
  const launchAt = game.launch?.at
  useEffect(() => {
    if (launchAt == null) return
    const late = store.serverNow() - launchAt
    if (late < 1500) playNow(AUDIO.countdown, Math.max(0, late) / 1000)
  }, [launchId, launchAt])

  // Random chatter
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const schedule = () => {
      id = setTimeout(() => {
        if (!isPlaying()) enqueue(pick(AUDIO.random))
        schedule()
      }, between(AUDIO.randomGapMs))
    }
    schedule()
    return () => clearTimeout(id)
  }, [])
}
