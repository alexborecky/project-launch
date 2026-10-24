import { CAMERA_SLOTS, LAUNCH_AT_PRAGUE, TIME_ZONE } from '../config'

export interface WallClock {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(timeZone: string) {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
    })
    formatters.set(timeZone, f)
  }
  return f
}

/** The wall-clock time in a time zone at a given instant. */
export function wallClock(date: Date, timeZone = TIME_ZONE): WallClock {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: +parts.year, month: +parts.month, day: +parts.day,
    hour: +parts.hour % 24, minute: +parts.minute, second: +parts.second,
  }
}

/** Minutes east of UTC for a time zone at a given instant (e.g. 60 for CET). */
export function utcOffsetMinutes(date: Date, timeZone = TIME_ZONE): number {
  const w = wallClock(date, timeZone)
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000)
}

/** Converts a wall-clock time in a time zone to a real instant, using the zone's own rules. */
export function zonedTimeToDate(t: Omit<WallClock, 'second'> & { second?: number }, timeZone = TIME_ZONE): Date {
  const guess = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second ?? 0)
  // Two passes settle the offset even right next to a daylight-saving change.
  let ts = guess - utcOffsetMinutes(new Date(guess), timeZone) * 60000
  ts = guess - utcOffsetMinutes(new Date(ts), timeZone) * 60000
  return new Date(ts)
}

export const LAUNCH_AT = zonedTimeToDate(LAUNCH_AT_PRAGUE).getTime()

export function utcOffsetLabel(date: Date, timeZone = TIME_ZONE): string {
  const m = utcOffsetMinutes(date, timeZone)
  const sign = m < 0 ? '−' : '+'
  const h = Math.floor(Math.abs(m) / 60)
  const rest = Math.abs(m) % 60
  return `UTC${sign}${h}${rest ? ':' + String(rest).padStart(2, '0') : ''}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export function formatClock(date: Date, timeZone = TIME_ZONE): string {
  const w = wallClock(date, timeZone)
  return `${pad2(w.hour)}:${pad2(w.minute)}:${pad2(w.second)}`
}

/** "3d 07:13:36", or "07:13:36" under a day, "00:00:00" once reached. */
export function formatCountdown(msLeft: number): string {
  const s = Math.max(0, Math.floor(msLeft / 1000))
  const d = Math.floor(s / 86400)
  const hms = `${pad2(Math.floor((s % 86400) / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`
  return d ? `${d}d ${hms}` : hms
}

export type CameraSlot = (typeof CAMERA_SLOTS)[number]

/** "16:20" → minutes since midnight. */
const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Which camera image belongs to a time of day (Prague). */
export function cameraSlotAt(hour: number, minute = 0, slots: readonly CameraSlot[] = CAMERA_SLOTS): CameraSlot {
  const now = hour * 60 + minute
  const sorted = [...slots].sort((a, b) => minutesOf(a.from) - minutesOf(b.from))
  let current = sorted[sorted.length - 1] // before the first slot of the day, the last one (night) still runs
  for (const s of sorted) if (now >= minutesOf(s.from)) current = s
  return current
}
