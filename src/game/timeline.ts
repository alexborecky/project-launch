// What a launch looks like at a given moment. Every screen works this out from the same
// shared launch record and the (server) clock, so they all show the same thing at the same time.
import { LAUNCH_COUNTDOWN, LAUNCH_VIDEO } from '../config'
import type { LaunchRecord } from './actions'
import type { Flight } from './flight'
import { ascentMs } from './trajectory'

/** The clip starts on "liftoff", right after the 5…1 countdown. */
export const VIDEO_AT = LAUNCH_COUNTDOWN.liftoffMs

/** The countdown number (5…1) showing `t` ms after the countdown started. */
export function countdownNumber(t: number): number {
  const marks = LAUNCH_COUNTDOWN.marksMs
  let i = 0
  while (i + 1 < marks.length && t >= marks[i + 1]) i++
  return marks.length - i
}

/**
 * Milliseconds from the start of the countdown to each phase. After the countdown everything follows
 * the launch clip: ignition until lift-off, the climb, the explosion in the fail clip, and the result
 * when the clip ends.
 */
export function phases(launch: LaunchRecord) {
  const climbAt = VIDEO_AT + LAUNCH_VIDEO.liftoffAtMs
  const boomAt = climbAt + ascentMs(launch.outcome)
  const resultAt = VIDEO_AT + LAUNCH_VIDEO.durationMs
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
  if (t < VIDEO_AT) return { phase: 'countdown', n: countdownNumber(t), outcome }
  if (t < climbAt) return { phase: 'ignition', outcome }
  if (t < boomAt) return { phase: 'climb', outcome, startedAt: perfNow - (t - climbAt) }
  if (t < resultAt) return { phase: 'boom', outcome }
  return { phase: 'result', outcome }
}
