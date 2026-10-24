import { describe, expect, it } from 'vitest'
import { WAYPOINTS, altitudeAt, positionAt, speedAt } from './trajectory'

const orbit = { kind: 'orbit', altitudeKm: 300, parts: 10, extras: 2 } as const
const lost = { kind: 'lost', altitudeKm: 20, parts: 6, odds: 0.7 } as const
const at = (id: string) => WAYPOINTS.find((w) => w.id === id)!.at

describe('altitudeAt', () => {
  it('runs from 0 to the outcome altitude', () => {
    expect(altitudeAt(orbit, 0)).toBe(0)
    expect(altitudeAt(orbit, 1)).toBe(300)
    expect(altitudeAt(lost, 1)).toBe(20)
  })

  it('climbs faster later on', () => {
    expect(altitudeAt(orbit, 0.5)).toBeLessThan(150)
  })
})

describe('positionAt', () => {
  it('starts at the pad and passes through the milestones', () => {
    expect(positionAt(0)).toEqual(at('pad'))
    expect(positionAt(10).x).toBeCloseTo(at('stage1').x)
    expect(positionAt(25).y).toBeCloseTo(at('maxq').y)
  })

  it('ends at orbit for a successful launch', () => {
    const p = positionAt(300, 300)
    expect(p.x).toBeCloseTo(at('orbit').x)
    expect(p.y).toBeCloseTo(at('orbit').y)
  })

  it('stops between stage 1 and stage 2 for a typical failure', () => {
    const p = positionAt(20)
    expect(p.y).toBeLessThan(at('stage1').y)
    expect(p.y).toBeGreaterThan(at('stage2').y)
  })
})

describe('speedAt', () => {
  it('is 0 on the pad and about orbital speed high up', () => {
    expect(speedAt(0)).toBe(0)
    expect(speedAt(400)).toBeCloseTo(7.8)
  })
})
