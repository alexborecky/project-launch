// Every change to the game goes through `applyAction`: the browser uses it for local saving,
// and the Netlify function uses the very same code for the shared save. Pure: no storage, no clock.
import { TOPICS, type PartId } from '../config'
import { nextTopicState, rollOutcome, type Outcome, type TopicAction, type TopicStates } from './rules'
import { LAUNCH_AT } from './time'

export interface LaunchRecord {
  /** Increases with every launch, so screens can tell a new launch from one they've seen. */
  id: number
  /** Server time (ms) when the countdown started. Every screen plays the launch from this moment. */
  at: number
  outcome: Outcome
}

export interface GameData {
  /** Increases with every saved change. */
  version: number
  topics: TopicStates
  /** Launch Sequence step 3, ticked by the facilitator. */
  goNoGo: boolean
  /** The current launch, until someone returns the rocket to the pad. */
  launch: LaunchRecord | null
  /** When the launch unlocks (server ms), after any postponements. Missing = the original time (config). */
  launchAt?: number | null
  /** The weather popup, turned on by hand in god mode. */
  weatherHold?: boolean
}

/** When the launch unlocks: the original time, or later if it was postponed. */
export const scheduledLaunchAt = (state: GameData) => state.launchAt ?? LAUNCH_AT

export const EMPTY_GAME: GameData = { version: 0, topics: {}, goNoGo: false, launch: null, launchAt: null, weatherHold: false }

export type Action =
  | { type: 'topic'; part: PartId; step: TopicAction }
  | { type: 'goNoGo'; value: boolean }
  | { type: 'launch' }
  | { type: 'return' }
  | { type: 'reset' }
  /** Demo toolbar only: set every topic at once. */
  | { type: 'setTopics'; topics: TopicStates }
  /** Bad weather: move the launch time later, for everyone. */
  | { type: 'postpone'; minutes: number }
  /** Show or hide the weather popup by hand (god mode). */
  | { type: 'weatherHold'; on: boolean }

export type Role = 'viewer' | 'team' | 'admin'

/** Who may do what. The team code moves topics along; the admin code does everything. */
export const NEEDS: Record<Action['type'], Role> = {
  topic: 'team',
  goNoGo: 'admin',
  launch: 'admin',
  return: 'admin',
  reset: 'admin',
  setTopics: 'admin',
  postpone: 'admin',
  weatherHold: 'admin',
}

const RANK: Record<Role, number> = { viewer: 0, team: 1, admin: 2 }
export const canDo = (role: Role, action: Action) => RANK[role] >= RANK[NEEDS[action.type]]

export type ActionResult =
  | { ok: true; state: GameData }
  | { ok: false; status: number; error: string; need?: Role }

export function applyAction(
  state: GameData,
  action: Action,
  env: { now: number; random: () => number; role: Role },
): ActionResult {
  if (!canDo(env.role, action)) {
    const need = NEEDS[action.type]
    return { ok: false, status: 403, need, error: need === 'admin' ? 'This needs the admin code.' : 'This needs the team code.' }
  }
  const next = (patch: Partial<GameData>): ActionResult => ({ ok: true, state: { ...state, ...patch, version: state.version + 1 } })

  switch (action.type) {
    case 'topic': {
      const topic = TOPICS.find((t) => t.part === action.part)
      if (!topic) return { ok: false, status: 400, error: 'Unknown topic.' }
      const updated = nextTopicState(topic, state.topics[action.part], action.step)
      // Usually means someone else moved this topic a moment ago.
      if (!updated) return { ok: false, status: 409, error: `“${topic.name}” has already moved on. The board now shows its latest state.` }
      return next({ topics: { ...state.topics, [action.part]: updated } })
    }
    case 'goNoGo':
      return next({ goNoGo: action.value })
    case 'launch': {
      if (state.launch) return { ok: false, status: 409, error: 'The rocket has already launched. Return it to the pad first.' }
      const outcome = rollOutcome(state.topics, env.random)
      if (outcome.kind === 'empty') return { ok: false, status: 400, error: 'The pad is empty. Add parts first.' }
      return next({ launch: { id: state.version + 1, at: env.now, outcome } })
    }
    case 'return':
      return next({ launch: null })
    case 'reset':
      return next({ topics: {}, goNoGo: false, launch: null })
    case 'setTopics':
      return next({ topics: action.topics, launch: null })
    case 'postpone': {
      if (![30, 60].includes(action.minutes)) return { ok: false, status: 400, error: 'Postpone by 30 or 60 minutes.' }
      // From the scheduled time, or from now if that has already passed.
      const from = Math.max(scheduledLaunchAt(state), env.now)
      return next({ launchAt: from + action.minutes * 60_000, weatherHold: false })
    }
    case 'weatherHold':
      return next({ weatherHold: action.on })
  }
}
