import type { Outcome } from './rules'

/** What the camera viewport is showing right now. Not saved: a reload returns to the pad. */
export type Flight =
  | { phase: 'idle' }
  | { phase: 'empty' }
  | { phase: 'film'; outcome: Outcome }
  | { phase: 'countdown'; n: number; outcome: Outcome }
  | { phase: 'ignition'; outcome: Outcome }
  | { phase: 'climb'; outcome: Outcome; /** performance.now() when the climb began */ startedAt?: number }
  | { phase: 'boom'; outcome: Outcome }
  | { phase: 'result'; outcome: Outcome }

export type Ended = Extract<Outcome, { kind: 'pad' | 'lost' | 'orbit' }>

/** How high the rocket climbs on screen, in rocket heights, and how long it takes. */
export function climbFor(outcome: Outcome): { rise: number; ms: number } {
  switch (outcome.kind) {
    case 'orbit': return { rise: 2.6, ms: 3600 } // well out of the top of the picture
    case 'lost': return { rise: 0.08 + outcome.parts * 0.025, ms: 1800 } // explodes still in view
    case 'pad': return { rise: 0.015, ms: 500 } // a few metres
    case 'empty': return { rise: 0, ms: 0 }
  }
}

export function modeLabel(flight: Flight): string {
  switch (flight.phase) {
    case 'idle':
    case 'empty':
      return 'PRE-LAUNCH'
    case 'film':
      return 'BROADCAST'
    case 'countdown':
      return 'COUNTDOWN'
    case 'ignition':
      return 'IGNITION'
    case 'climb':
    case 'boom':
      return 'ASCENT'
    case 'result':
      return flight.outcome.kind === 'orbit' ? 'IN ORBIT' : 'VEHICLE LOST'
  }
}

export function resultText(outcome: Outcome, totalParts: number, corePartsNeeded: number, coreTotal: number, minOddsPct: number) {
  switch (outcome.kind) {
    case 'empty':
      return { title: 'THE PAD IS EMPTY', body: 'Add parts to the rocket first.' }
    case 'pad':
      return {
        title: 'EXPLODED ON THE PAD',
        body: `Not enough of the rocket was ready to survive ignition. It needs its engine, ${corePartsNeeded} of ${coreTotal} core parts and at least ${minOddsPct}% odds.`,
      }
    case 'lost':
      return {
        title: 'VEHICLE LOST',
        body: `It broke apart at ${outcome.altitudeKm} km. The odds were ${Math.round(outcome.odds * 100)}%, not this time.`,
      }
    case 'orbit':
      return {
        title: 'LAUNCH SUCCESSFUL',
        body: `Reached ${outcome.altitudeKm} km with ${outcome.parts} of ${totalParts} parts.`,
      }
  }
}
