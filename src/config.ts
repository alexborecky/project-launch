// Everything you might want to tweak lives here: topics, hidden weights, the
// launch time, outcome formulas, camera images and the fake ambient values.

export type Track = 'crunch' | 'hack'
export type PartType = 'core' | 'extra'

export type PartId =
  | 'engine' | 'tank' | 'fins' | 'body' | 'paint' | 'window' | 'nose'
  | 'boosterL' | 'boosterR' | 'antenna' | 'shield' | 'patch'

export interface Topic {
  /** Shown on screen, keep exactly as written. */
  name: string
  track: Track
  /** Hidden from the team. */
  part: PartId
  /** Hidden from the team. How much this part adds to the launch odds. */
  weight: number
  type: PartType
}

export const TOPICS: Topic[] = [
  { name: 'Headless API', track: 'crunch', part: 'engine', weight: 0.12, type: 'core' },
  { name: 'Assign cost weights', track: 'crunch', part: 'tank', weight: 0.09, type: 'core' },
  { name: 'Přesun sofa balíčků', track: 'crunch', part: 'fins', weight: 0.09, type: 'core' },
  { name: 'Barevná schémata, koncept', track: 'hack', part: 'body', weight: 0.16, type: 'core' },
  { name: 'Barevná schémata, dev', track: 'hack', part: 'paint', weight: 0.16, type: 'core' },
  { name: 'Verzování šablony', track: 'hack', part: 'window', weight: 0.09, type: 'core' },
  { name: 'Sofa a 3G na jednom projektu', track: 'hack', part: 'nose', weight: 0.09, type: 'core' },
  { name: 'Dohledávání produktů', track: 'hack', part: 'boosterL', weight: 0.03, type: 'extra' },
  { name: 'Go+gRPC vrstva', track: 'hack', part: 'boosterR', weight: 0.03, type: 'extra' },
  { name: 'Canvas a zkreslení', track: 'hack', part: 'antenna', weight: 0.03, type: 'extra' },
  { name: 'Standalone editor bez devenvu', track: 'hack', part: 'shield', weight: 0.03, type: 'extra' },
  { name: 'AI v editoru', track: 'hack', part: 'patch', weight: 0.03, type: 'extra' },
]

/** This part must be on the rocket, or the odds are 0. */
export const REQUIRED_PART: PartId = 'engine'

export const TIME_ZONE = 'Europe/Prague'

/** Launch unlocks at this wall-clock time in Prague (converted with real time-zone rules). */
export const LAUNCH_AT_PRAGUE = { year: 2026, month: 10, day: 27, hour: 17, minute: 0 }

export const MISSION_ID = 'PH-2610-24'

export const ODDS = {
  base: 0.05,
  max: 0.97,
}

export const VIABILITY = {
  /** Core parts needed on the rocket. */
  minCoreParts: 4,
  /** Minimum odds needed. */
  minOdds: 0.6,
}

/** Altitudes in km. `random` is 0..1. */
export const ALTITUDE = {
  success: (extras: number, random: number) => 120 + 70 * extras + Math.round(random * 40),
  /** Viable launch that still broke apart: higher the more parts it had. */
  failure: (parts: number, random: number) => Math.max(2, Math.round((80 + 26 * parts) / 9 + random * 3)),
  /** Not viable: explodes a few metres up. */
  pad: (random: number) => 0.005 + random * 0.01,
}

/** Prague hours. Each slot runs from its `from` hour until the next slot starts. */
export const CAMERA_SLOTS = [
  { id: 'dawn', from: 5, image: '/camera/dawn.jpg' },
  { id: 'day', from: 8, image: '/camera/day.jpg' },
  { id: 'dusk', from: 16, image: '/camera/dusk.jpg' },
  { id: 'night', from: 18, image: '/camera/night.jpg' },
] as const

/**
 * Where the rocket stands in the camera photo, as % of the photo (all images share one framing, 3:2).
 * `x` is the rocket's centre, `bottom` its base, `height` its height.
 */
export const ROCKET_PLACEMENT = { x: 36.6, bottom: 19.6, height: 47 }

/** Every 25 to 60 seconds. */
export const VOICE = { text: 'Hello, World', minGapMs: 25_000, maxGapMs: 60_000, pitch: 0.7, rate: 0.85 }

export const SYSTEM_STATUS = [
  ['CORE API', 'ONLINE'],
  ['BUILD PIPELINE', 'STABLE'],
  ['EDITOR', 'READY'],
  ['gRPC LINK', 'STRONG'],
  ['LINK', '256-BIT ENCRYPTED'],
] as const

export const COMMS = [
  ['CHANNEL', 'TEAM-OPS-1'],
  ['FREQUENCY', '2405.500 MHz'],
  ['ENCRYPTION', 'AES-256'],
] as const
