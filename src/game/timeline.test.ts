import { describe, expect, it } from 'vitest'
import type { LaunchRecord } from './actions'
import { COUNT_MS, flightAt, phases } from './timeline'

const lost: LaunchRecord = { id: 1, at: 10_000, outcome: { kind: 'lost', altitudeKm: 20, parts: 6, odds: 0.7 } }
const orbit: LaunchRecord = { id: 2, at: 10_000, outcome: { kind: 'orbit', altitudeKm: 300, parts: 12, extras: 5 } }

describe('flightAt', () => {
  it('is idle without a launch', () => {
    expect(flightAt(null, 0, 0)).toEqual({ phase: 'idle' })
  })

  it('counts down 3, 2, 1', () => {
    expect(flightAt(lost, 10_000, 0)).toMatchObject({ phase: 'countdown', n: 3 })
    expect(flightAt(lost, 10_000 + COUNT_MS + 1, 0)).toMatchObject({ phase: 'countdown', n: 2 })
    expect(flightAt(lost, 10_000 + COUNT_MS * 2 + 1, 0)).toMatchObject({ phase: 'countdown', n: 1 })
  })

  it('reports when the climb started on the local clock', () => {
    const { climbAt } = phases(lost)
    const f = flightAt(lost, 10_000 + climbAt + 500, 99_000)
    expect(f).toMatchObject({ phase: 'climb', startedAt: 98_500 })
  })

  it('explodes before the result on a failure, but not on orbit', () => {
    expect(flightAt(lost, 10_000 + phases(lost).boomAt + 1, 0).phase).toBe('boom')
    expect(flightAt(orbit, 10_000 + phases(orbit).boomAt + 1, 0).phase).toBe('result')
  })

  it('shows the result to a screen that opens much later', () => {
    expect(flightAt(lost, 10_000 + 3_600_000, 0)).toMatchObject({ phase: 'result', outcome: { kind: 'lost' } })
  })
})

describe('launch clip timing', () => {
  it('shows the result when the 10 s clip ends, for success and failure alike', () => {
    expect(phases(orbit).resultAt).toBe(COUNT_MS * 3 + 10_000)
    expect(phases(lost).resultAt).toBe(COUNT_MS * 3 + 10_000)
  })

  it('explodes when the fail clip does', () => {
    expect(phases(lost).boomAt).toBe(COUNT_MS * 3 + 5200)
  })
})
