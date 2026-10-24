// What a launch looks like at a given moment. Every screen works this out from the same
// shared launch record and the (server) clock, so they all show the same thing at the same time.
import type { LaunchRecord } from './actions'
import type { Flight } from './flight'
import { ascentMs } from './trajectory'

export const COUNT_MS = 900 // each of 3, 2, 1
export const IGNITION_MS = 800
export const BOOM_MS = 1300

/** Milliseconds from the start of the countdown to when the climb begins and when the result shows. */
export function phases(launch: LaunchRecord) {
  const climbAt = COUNT_MS * 3 + IGNITION_MS
  const boomAt = climbAt + ascentMs(launch.outcome)
  const resultAt = launch.outcome.kind === 'orbit' ? boomAt : boomAt + BOOM_MS
  return { climbAt, boomAt, resultAt }
}

/**
 * The flight at server time `now`. `perfNow` is the local performance clock at that moment,
 * used to tell the trajectory map when the climb started on this screen's own clock.
 */
export function flightAt(launch: LaunchRecord | null, now: number, perfNow: number): Flight {
  if (!launch) return { phase: 'idle' }
  const t = now - launch.at
  const { climbAt, boomAt, resultAt } = phases(launch)
  const outcome = launch.outcome
  if (t < COUNT_MS * 3) return { phase: 'countdown', n: 3 - Math.floor(Math.max(0, t) / COUNT_MS), outcome }
  if (t < climbAt) return { phase: 'ignition', outcome }
  if (t < boomAt) return { phase: 'climb', outcome, startedAt: perfNow - (t - climbAt) }
  if (t < resultAt) return { phase: 'boom', outcome }
  return { phase: 'result', outcome }
}
