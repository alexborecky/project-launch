import { describe, expect, it } from 'vitest'
import { EMPTY_GAME } from '../game/actions'
import { LAUNCH_AT } from '../game/time'
import { weatherHoldActive } from './WeatherHold'

describe('weatherHoldActive', () => {
  it('comes on in the last minute before the launch time, and not before', () => {
    expect(weatherHoldActive(EMPTY_GAME, LAUNCH_AT - 61_000)).toBe(false)
    expect(weatherHoldActive(EMPTY_GAME, LAUNCH_AT - 60_000)).toBe(true)
    expect(weatherHoldActive(EMPTY_GAME, LAUNCH_AT - 1)).toBe(true)
    expect(weatherHoldActive(EMPTY_GAME, LAUNCH_AT)).toBe(false)
  })

  it('follows a postponed launch time', () => {
    const later = { ...EMPTY_GAME, launchAt: LAUNCH_AT + 30 * 60_000 }
    expect(weatherHoldActive(later, LAUNCH_AT - 30_000)).toBe(false)
    expect(weatherHoldActive(later, LAUNCH_AT + 29 * 60_000 + 30_000)).toBe(true)
  })

  it('can be turned on by hand, but never during a launch', () => {
    expect(weatherHoldActive({ ...EMPTY_GAME, weatherHold: true }, 0)).toBe(true)
    const flying = { ...EMPTY_GAME, weatherHold: true, launch: { id: 1, at: 0, outcome: { kind: 'empty' as const } } }
    expect(weatherHoldActive(flying, 0)).toBe(false)
  })
})
