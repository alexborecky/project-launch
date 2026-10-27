// Launch Conditions data. Fake for now, drifting slowly around the designed values.
// To use real Prague weather later, replace the body of `getConditions`.
import { LAUNCH_AT } from '../game/time'

export interface Conditions {
  windKmh: number
  windDir: string
  tempC: number
  humidity: number
  visibility: string
  /** Text after "OPEN · " */
  window: string
}

const wave = (t: number, periodS: number, phase = 0) => Math.sin((t / 1000 / periodS) * Math.PI * 2 + phase)

export function getConditions(now: Date, drift = true, launchAt = LAUNCH_AT): Conditions {
  const t = drift ? now.getTime() : 0
  // The weather window closes an hour after launch.
  const left = Math.max(0, launchAt + 3600_000 - now.getTime())
  const h = Math.floor(left / 3600_000)
  const m = Math.floor((left % 3600_000) / 60_000)
  return {
    windKmh: Math.round(12 + 2.5 * wave(t, 97) + 0.8 * wave(t, 23, 1)),
    windDir: 'SW',
    tempC: Math.round(18 + 0.7 * wave(t, 600, 2)),
    humidity: Math.round(46 + 3 * wave(t, 300, 4)),
    visibility: '10+ km',
    window: h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h ${String(m).padStart(2, '0')}m`,
  }
}
