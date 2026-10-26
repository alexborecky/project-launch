import { describe, expect, it } from 'vitest'
import { WAYPOINTS, altitudeAfterMs, positionAt, speedAt, timeToAltitudeMs } from './trajectory'

const at = (id: string) => WAYPOINTS.find((w) => w.id === id)!.at

describe('map flight profile', () => {
  it('starts slowly and speeds up, like a real launch', () => {
    expect(altitudeAfterMs(0)).toBe(0)
    expect(timeToAltitudeMs(25) / 1000).toBeGreaterThan(50) // Max-Q after about a minute
    expect(timeToAltitudeMs(25) / 1000).toBeLessThan(70)
    expect(timeToAltitudeMs(300) / 1000).toBe(200)
  })

  it('reaches the altitude it was asked for', () => {
    expect(altitudeAfterMs(timeToAltitudeMs(352))).toBeCloseTo(352)
    expect(altitudeAfterMs(timeToAltitudeMs(20))).toBeCloseTo(20)
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
