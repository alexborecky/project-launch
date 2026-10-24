// When to play what: watches the game and plays the matching radio message.
import { useEffect, useRef } from 'react'
import { AUDIO, TOPICS } from '../config'
import type { GameData } from '../game/actions'
import { statusOf, type TopicStates } from '../game/rules'
import { store } from '../store/store'
import { phases } from '../game/timeline'
import { enqueue, holdForLaunch, isHeld, isPlaying, pick, playNow } from './player'

const between = ([min, max]: number[]) => min + Math.random() * (max - min)

const NEW_PART_KEY = 'project-hack:new-part-index'

/** new-part-1, then 2, then 3, then 1 again… Remembered on this device so a refresh carries on. */
function nextNewPart(): string {
  let i = 0
  try {
    i = Number(localStorage.getItem(NEW_PART_KEY)) || 0
    localStorage.setItem(NEW_PART_KEY, String((i + 1) % AUDIO.newPart.length))
  } catch {
    // storage blocked: always the first one
  }
  return AUDIO.newPart[i % AUDIO.newPart.length]
}

/**
 * - A topic moves from Waiting to In Progress → its message plays 2 s later (if it has one).
 * - A part is added → the next "new part" message in turn (1, 2, 3, 1…). Many parts at once (demo) → just one.
 * - A launch starts → the radio goes quiet until the launch clip ends; the countdown voice plays
 *   (unless this screen joined late). Messages triggered meanwhile wait and play afterwards.
 * Only one sound ever plays at a time.
 * - About every 20 minutes (18–22) → random radio chatter, if nothing else is playing.
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
    if (added) timers.current.push(setTimeout(() => enqueue(nextNewPart()), AUDIO.newPartDelayMs))
  }, [game.topics])

  // Launch: hold the radio from the countdown until the launch clip has finished
  const launch = game.launch
  useEffect(() => {
    if (!launch) return
    const elapsed = store.serverNow() - launch.at
    const remaining = phases(launch).resultAt - elapsed
    if (remaining <= 0) return // an old launch, already over
    holdForLaunch(true)
    if (elapsed < 1500) playNow(AUDIO.countdown, Math.max(0, elapsed) / 1000, { launch: true })
    const release = setTimeout(() => holdForLaunch(false), remaining)
    return () => {
      clearTimeout(release)
      holdForLaunch(false) // returned to the pad or reset
    }
    // Only a new launch (id) matters, not every re-render with the same launch.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [launch?.id])

  // Random chatter
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const schedule = () => {
      id = setTimeout(() => {
        if (!isPlaying() && !isHeld()) enqueue(pick(AUDIO.random))
        schedule()
      }, between(AUDIO.randomGapMs))
    }
    schedule()
    return () => clearTimeout(id)
  }, [])
}
