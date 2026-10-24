import { ALTITUDE, ODDS, REQUIRED_PART, TOPICS, VIABILITY, type PartId, type Topic } from '../config'

export type TopicStatus = 'waiting' | 'progress' | 'done' | 'added'
export type Decision = 'kill' | 'continue' | 'backlog'

export interface TopicState {
  status: TopicStatus
  /** Hack topics only. Kill is a normal, successful outcome. */
  decision?: Decision
}

export type TopicStates = Partial<Record<PartId, TopicState>>

export const statusOf = (states: TopicStates, part: PartId): TopicStatus => states[part]?.status ?? 'waiting'

export function addedParts(states: TopicStates, topics: Topic[] = TOPICS): Topic[] {
  return topics.filter((t) => statusOf(states, t.part) === 'added')
}

export function odds(states: TopicStates, topics: Topic[] = TOPICS): number {
  const added = addedParts(states, topics)
  if (!added.some((t) => t.part === REQUIRED_PART)) return 0
  const sum = added.reduce((acc, t) => acc + t.weight, 0)
  return Math.min(ODDS.max, ODDS.base + sum)
}

export function coreAdded(states: TopicStates, topics: Topic[] = TOPICS): number {
  return addedParts(states, topics).filter((t) => t.type === 'core').length
}

export function isViable(states: TopicStates, topics: Topic[] = TOPICS): boolean {
  // Small epsilon so 0.6 built from float sums (e.g. 0.05 + 0.55) still counts as 60%.
  return coreAdded(states, topics) >= VIABILITY.minCoreParts && odds(states, topics) >= VIABILITY.minOdds - 1e-9
}

export type Outcome =
  | { kind: 'empty' }
  | { kind: 'pad'; altitudeKm: number; parts: number }
  | { kind: 'lost'; altitudeKm: number; parts: number; odds: number }
  | { kind: 'orbit'; altitudeKm: number; parts: number; extras: number }

/** Decides how a launch ends. `random` returns 0..1 and is injectable for tests. */
export function rollOutcome(states: TopicStates, random: () => number = Math.random, topics: Topic[] = TOPICS): Outcome {
  const added = addedParts(states, topics)
  const parts = added.length
  if (parts === 0) return { kind: 'empty' }
  if (!isViable(states, topics)) return { kind: 'pad', altitudeKm: ALTITUDE.pad(random()), parts }
  const p = odds(states, topics)
  if (random() < p) {
    const extras = added.filter((t) => t.type === 'extra').length
    return { kind: 'orbit', altitudeKm: ALTITUDE.success(extras, random()), parts, extras }
  }
  return { kind: 'lost', altitudeKm: ALTITUDE.failure(parts, random()), parts, odds: p }
}

// ---- topic state changes ----

export type TopicAction =
  | { type: 'start' }
  | { type: 'finish'; decision?: Decision }
  | { type: 'add' }
  | { type: 'remove' }

/** Returns the next state, or null if the action isn't allowed from the current state. */
export function nextTopicState(topic: Topic, current: TopicState | undefined, action: TopicAction): TopicState | null {
  const status = current?.status ?? 'waiting'
  switch (action.type) {
    case 'start':
      return status === 'waiting' ? { status: 'progress' } : null
    case 'finish':
      if (status !== 'progress') return null
      if (topic.track === 'hack') return action.decision ? { status: 'done', decision: action.decision } : null
      return { status: 'done' }
    case 'add':
      return status === 'done' ? { ...current, status: 'added' } : null
    case 'remove':
      return status === 'added' ? { ...current, status: 'done' } : null
  }
}
