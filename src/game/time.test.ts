import { describe, expect, it } from 'vitest'
import { LAUNCH_AT, cameraSlotAt, formatClock, formatCountdown, utcOffsetLabel, zonedTimeToDate } from './time'

describe('launch time', () => {
  it('is 27 Oct 2026 17:00 CET, which is 16:00 UTC', () => {
    expect(new Date(LAUNCH_AT).toISOString()).toBe('2026-10-27T16:00:00.000Z')
  })

  it('uses summer time before 25 Oct', () => {
    expect(zonedTimeToDate({ year: 2026, month: 10, day: 24, hour: 17, minute: 0 }).toISOString()).toBe('2026-10-24T15:00:00.000Z')
  })
})

describe('utcOffsetLabel', () => {
  it('shows UTC+2 in summer and UTC+1 during the hackathon', () => {
    expect(utcOffsetLabel(new Date('2026-10-24T12:00:00Z'))).toBe('UTC+2')
    expect(utcOffsetLabel(new Date('2026-10-27T12:00:00Z'))).toBe('UTC+1')
  })
})

describe('formatting', () => {
  it('formats the countdown', () => {
    expect(formatCountdown(((3 * 24 + 7) * 3600 + 13 * 60 + 36) * 1000)).toBe('3d 07:13:36')
    expect(formatCountdown(59_000)).toBe('00:00:59')
    expect(formatCountdown(-5)).toBe('00:00:00')
  })

  it('shows Prague clock time', () => {
    expect(formatClock(new Date('2026-10-27T13:22:48Z'))).toBe('14:22:48')
  })
})

describe('cameraSlotAt', () => {
  it('maps Prague times to slots: day 07:00, dusk 16:20, night 17:30', () => {
    expect(cameraSlotAt(3, 0).id).toBe('night')
    expect(cameraSlotAt(6, 59).id).toBe('night')
    expect(cameraSlotAt(7, 0).id).toBe('day')
    expect(cameraSlotAt(16, 19).id).toBe('day')
    expect(cameraSlotAt(16, 20).id).toBe('dusk')
    expect(cameraSlotAt(17, 0).id).toBe('dusk') // launch time
    expect(cameraSlotAt(17, 29).id).toBe('dusk')
    expect(cameraSlotAt(17, 30).id).toBe('night')
    expect(cameraSlotAt(23, 59).id).toBe('night')
  })
})
