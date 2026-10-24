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

/** Where files in /public are served from ("/" in dev, "./" in the demo build, so it works from any folder). */
// The cast keeps this file loadable by the Netlify server functions too, where import.meta.env doesn't exist.
const PUBLIC: string = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

/** Camera photos are 1536 × 1024 and all share one framing. */
export const PHOTO_SIZE = { w: 1536, h: 1024 }

/**
 * Rocket artwork: 12 transparent layers per lighting set, each 256 × 1536, stacked in order.
 * Adding a part to the rocket shows the next layer, whichever topic it came from.
 */
export const ROCKET_LAYERS = {
  base: `${PUBLIC}rocket-48-construction-layers`,
  canvas: { w: 256, h: 1536 },
  /** Where the engine nozzles end inside the layer canvas (the flame starts here). */
  nozzle: { x: 128, y: 1487 },
  files: [
    '01-primary-truss.png',
    '02-propellant-tanks.png',
    '03-upper-stage-tanks.png',
    '04-feed-lines-and-cables.png',
    '05-avionics-and-payload-bay.png',
    '06-thrust-frame-and-finishing-hardware.png',
    '07-engine-cluster.png',
    '08-aft-skirt.png',
    '09-lower-booster-shell.png',
    '10-main-booster-shell.png',
    '11-upper-stage-and-interstage.png',
    '12-fairing-and-final-surface.png',
  ],
}

/**
 * Prague time (HH:MM). Each slot runs from its `from` time until the next slot starts (night wraps past midnight).
 * `rocket` is the lighting folder in ROCKET_LAYERS. `placement` is where the 256 × 1536 layer canvas
 * goes in the photo, in photo pixels, matched to the reference renders (nose tip and engines line up).
 */
export const CAMERA_SLOTS = [
  {
    id: 'day',
    from: '07:00',
    image: `${PUBLIC}camera/launchpad-day.png`,
    rocket: 'day',
    placement: { left: 550.4, top: 69.9, width: 110.6, height: 754.2 },
  },
  {
    id: 'dusk',
    from: '16:20',
    image: `${PUBLIC}camera/launchpad-dusk.png`,
    rocket: 'dusk',
    placement: { left: 550.4, top: 69.9, width: 110.6, height: 754.2 },
  },
  {
    id: 'night',
    from: '17:30',
    image: `${PUBLIC}camera/launchpad-night.png`,
    rocket: 'night', // 'black-night' is the alternative near-black set
    placement: { left: 552.4, top: 102, width: 106.5, height: 720.4 },
  },
] as const

/**
 * Launch clips, played in the camera view after the countdown. Both are 10 s, 1920 × 1080, with sound.
 * `boomAtMs` is when the rocket explodes in the fail clip; the trajectory map stops there.
 * `liftoffAtMs` is roughly when the rocket leaves the pad in both clips.
 */
export const LAUNCH_VIDEO = {
  success: `${PUBLIC}videos/launch-success.mp4`,
  fail: `${PUBLIC}videos/launch-failed.mp4`,
  durationMs: 10_000,
  liftoffAtMs: 1500,
  boomAtMs: 5200,
}

/**
 * Radio audio in public/audio/. One file plays at a time; they queue up.
 * - `targeted`: plays 5–10 s after someone starts that topic. Topics without a file stay silent.
 * - `newPart`: played in turn (1, 2, 3, 1…) each time a part is added to the rocket.
 * - `random`: background chatter, about every 20 minutes.
 * - `countdown`: plays with the launch countdown (see LAUNCH_COUNTDOWN).
 */
const AUDIO_DIR = `${PUBLIC}audio`
export const AUDIO = {
  targeted: {
    engine: `${AUDIO_DIR}/targeted/headless-api.mp3`,
    tank: `${AUDIO_DIR}/targeted/assign-weights.mp3`,
    body: `${AUDIO_DIR}/targeted/color-scheme.mp3`,
    paint: `${AUDIO_DIR}/targeted/color-scheme.mp3`,
    window: `${AUDIO_DIR}/targeted/template-versioning.mp3`,
    nose: `${AUDIO_DIR}/targeted/sofa-3g.mp3`,
    boosterR: `${AUDIO_DIR}/targeted/grpc-layer.mp3`,
  } as Partial<Record<PartId, string>>,
  newPart: [1, 2, 3].map((n) => `${AUDIO_DIR}/targeted/new-part-${n}.mp3`),
  // File names must not contain # or ?, or Netlify refuses the deploy (see scripts/check-filenames.mjs).
  random: [1, 2, 3, 4].map((n) => `${AUDIO_DIR}/random/radio-chatter-${n}.mp3`),
  countdown: `${AUDIO_DIR}/targeted/t-minus-countdown.mp3`,
  targetedDelayMs: [5_000, 10_000],
  newPartDelayMs: 800,
  // About every 20 minutes (18–22 min apart), so a 20-hour day doesn't get chatty.
  randomGapMs: [18 * 60_000, 22 * 60_000],
}

/**
 * The launch countdown, timed to t-minus-countdown.mp3 ("T-minus five, four, three, two, one, liftoff").
 * `marksMs`: when 5, 4, 3, 2 and 1 appear. `liftoffMs`: when the launch clip starts.
 * Measured from the audio's loudness; nudge these if the numbers and the voice drift apart.
 */
export const LAUNCH_COUNTDOWN = {
  marksMs: [0, 2400, 3600, 4850, 5850],
  liftoffMs: 6300,
}

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
