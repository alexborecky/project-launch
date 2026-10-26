// Where the rocket is on the Trajectory Map during a launch.
// Pure functions: progress 0..1 in, altitude / speed / map position out.
import { LAUNCH_VIDEO } from '../config'
import type { Outcome } from './rules'

export interface Point {
  x: number
  y: number
}

/**
 * Map milestones, in the map canvas's own coordinates (centres of the Figma markers),
 * with the altitude each one stands for. Orbit's altitude is the outcome's own.
 */
export const WAYPOINTS: { id: string; at: Point; km: number }[] = [
  { id: 'pad', at: { x: 76.28, y: 215 }, km: 0 },
  { id: 'stage1', at: { x: 95.6, y: 171.92 }, km: 10 },
  { id: 'maxq', at: { x: 166.94, y: 116.9 }, km: 25 },
  { id: 'stage2', at: { x: 198.64, y: 61.88 }, km: 70 },
  { id: 'orbit', at: { x: 250.16, y: 25.2 }, km: 120 },
]

/**
 * How long the camera's climb phase lasts, in ms, matched to the launch clips: success climbs until
 * the clip ends, a failure until the explosion. (The trajectory map flies its own, slower profile.)
 */
export function ascentMs(outcome: Outcome): number {
  return outcome.kind === 'orbit'
    ? LAUNCH_VIDEO.durationMs - LAUNCH_VIDEO.liftoffAtMs
    : LAUNCH_VIDEO.boomAtMs - LAUNCH_VIDEO.liftoffAtMs
}

/** Final altitude (km) the marker climbs to for an outcome. */
export function finalAltitude(outcome: Outcome): number {
  return outcome.kind === 'empty' ? 0 : outcome.altitudeKm
}

/**
 * The map's flight profile: steady acceleration, roughly like a real orbital launch.
 * Stage 1 (10 km) ≈ 0:37, Max-Q (25 km) ≈ 0:58, stage 2 (70 km) ≈ 1:37, 300 km at 3:20.
 */
export const MAP_PROFILE = { refKm: 300, refMs: 200_000 }

/** Altitude (km) `ms` after lift-off. */
export function altitudeAfterMs(ms: number): number {
  return MAP_PROFILE.refKm * (Math.max(0, ms) / MAP_PROFILE.refMs) ** 2
}

/** How long (ms) after lift-off the rocket reaches `km`: its whole flight on the map. */
export function timeToAltitudeMs(km: number): number {
  return MAP_PROFILE.refMs * Math.sqrt(Math.max(0, km) / MAP_PROFILE.refKm)
}

/** A plausible speed for an altitude, in km/s (about 7.8 km/s at orbit). */
export function speedAt(km: number): number {
  return 7.8 * Math.min(1, km / 200) ** 0.6
}

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3)
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) }
}

/** Map position for an altitude: a smooth curve through the milestones. Above orbit's altitude it stays at orbit. */
export function positionAt(km: number, orbitKm = WAYPOINTS[WAYPOINTS.length - 1].km): Point {
  const pts = WAYPOINTS.map((w, i) => ({ ...w, km: i === WAYPOINTS.length - 1 ? Math.max(orbitKm, WAYPOINTS[i - 1].km + 1) : w.km }))
  if (km <= 0) return pts[0].at
  for (let i = 0; i < pts.length - 1; i++) {
    if (km <= pts[i + 1].km) {
      const t = (km - pts[i].km) / (pts[i + 1].km - pts[i].km)
      const p0 = pts[Math.max(0, i - 1)].at
      const p3 = pts[Math.min(pts.length - 1, i + 2)].at
      return catmullRom(p0, pts[i].at, pts[i + 1].at, p3, t)
    }
  }
  return pts[pts.length - 1].at
}

/** Points along the flown path up to an altitude, for drawing the trail. */
export function trailTo(km: number, orbitKm?: number, steps = 40): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => positionAt((km * i) / steps, orbitKm))
}
