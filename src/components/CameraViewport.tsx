import { CAMERA_SLOTS, LAUNCH_VIDEO, PHOTO_SIZE, TOPICS, VIABILITY } from '../config'
import { climbFor, modeLabel, resultText, type Flight } from '../game/flight'
import { VIDEO_AT } from '../game/timeline'
import { cameraSlotAt, formatClock, utcOffsetLabel, wallClock } from '../game/time'
import { Rocket } from '../rocket/Rocket'
import { useForcedSlot } from '../demo/demo'
import { LaunchVideo } from './LaunchVideo'
import camDot from '../assets/figma/cam-dot.svg'
import zoomDot from '../assets/figma/zoom-dot.svg'
import s from './CameraViewport.module.css'

const HEADING = [
  ['N', 8], ['15', 5], ['30', 5], ['NE', 8], ['60', 5], ['75', 5], ['E', 8], ['105', 5], ['120', 5], ['SE', 8],
] as const

const PITCH = ['120', '60', '0', '-60', '-120']

const CORE_TOTAL = TOPICS.filter((t) => t.type === 'core').length


interface CameraViewportProps {
  now: Date
  flight: Flight
  /** Parts on the rocket; each one shows the next construction layer. */
  layers: number
  /** Server time the launch was pressed, or null for still frames (demo toolbar). */
  launchStart: number | null
  reducedMotion: boolean
}

/** Where in the clip a still frame sits, for the demo toolbar's launch stills. */
const STILL_AT: Partial<Record<Flight['phase'], number>> = { ignition: 800, climb: 3500, boom: 6500, result: LAUNCH_VIDEO.durationMs }

const pct = (v: number, of: number) => `${(v / of) * 100}%`

export function CameraViewport({ now, flight, layers, launchStart, reducedMotion }: CameraViewportProps) {
  const videoStart = launchStart == null ? null : launchStart + VIDEO_AT
  const forced = useForcedSlot() // demo toolbar or ?camera=
  const slot = CAMERA_SLOTS.find((c) => c.id === forced) ?? cameraSlotAt(wallClock(now).hour, wallClock(now).minute)
  const outcome = 'outcome' in flight ? flight.outcome : null
  const climb = outcome ? climbFor(outcome) : { rise: 0, ms: 0 }
  const climbing = flight.phase === 'climb' || flight.phase === 'boom' || flight.phase === 'result'
  const lostVehicle = (flight.phase === 'boom' || flight.phase === 'result') && outcome?.kind !== 'orbit'
  const burning = flight.phase === 'ignition' || flight.phase === 'climb'
  const message =
    flight.phase === 'empty'
      ? resultText({ kind: 'empty' }, TOPICS.length, VIABILITY.minCoreParts, CORE_TOTAL, VIABILITY.minOdds * 100)
      : flight.phase === 'result'
        ? resultText(flight.outcome, TOPICS.length, VIABILITY.minCoreParts, CORE_TOTAL, VIABILITY.minOdds * 100)
        : null
  const success = flight.phase === 'result' && flight.outcome.kind === 'orbit'
  const showClip = outcome != null && outcome.kind !== 'empty' && ['ignition', 'climb', 'boom', 'result'].includes(flight.phase)


  return (
    <section className={s.view} aria-label="Pad camera">
      {/* The scene has the photo's proportions and covers the viewport, so the rocket stays pinned to the pad. */}
      <div className={s.scene}>
        {/* Every time of day stays loaded: its photo plus the rocket lit to match. The current one fades in over the others. */}
        {CAMERA_SLOTS.map((c) => (
          <div key={c.id} className={`${s.slot} ${c.id === slot.id ? s.slotOn : ''}`} aria-hidden={c.id !== slot.id}>
            <img className={s.photo} src={c.image} alt={c.id === slot.id ? `Camera view of the launch pad (${c.id})` : ''} />
            <Rocket
              theme={c.rocket}
              style={{
                left: pct(c.placement.left, PHOTO_SIZE.w),
                top: pct(c.placement.top, PHOTO_SIZE.h),
                width: pct(c.placement.width, PHOTO_SIZE.w),
                height: pct(c.placement.height, PHOTO_SIZE.h),
              }}
              layers={flight.phase === 'empty' ? 0 : layers}
              flame={burning}
              smoke={['ignition', 'climb', 'boom', 'result'].includes(flight.phase)}
              shake={burning || flight.phase === 'empty'}
              rise={climbing ? climb.rise : 0}
              riseMs={climbing ? climb.ms : 0}
              exploded={flight.phase === 'boom' && lostVehicle}
              gone={lostVehicle}
            />
          </div>
        ))}
      </div>

      {/* After the countdown the matching launch clip takes over the camera view. */}
      {(['success', 'fail'] as const).map((clip) => (
        <LaunchVideo
          key={clip}
          src={LAUNCH_VIDEO[clip]}
          active={showClip && (clip === 'success') === (outcome?.kind === 'orbit')}
          startedAt={videoStart}
          stillAt={STILL_AT[flight.phase] ?? 0}
          reducedMotion={reducedMotion}
        />
      ))}

      <div className={s.vignette} aria-hidden="true" />

      <div className={s.camChip}>
        <img src={camDot} alt="" width={6} height={6} />
        <span>CAM-02 · IR MODE</span>
      </div>

      <div className={s.heading} aria-hidden="true">
        {HEADING.map(([label, tick], i) => (
          <span key={label} className={s.headingMark} style={{ left: 20 + i * 40 }}>
            <span className={s.headingLabel}>{label}</span>
            <span className={s.headingTick} style={{ height: tick }} />
          </span>
        ))}
        <span className={s.headingBar} />
        <span className={s.headingPointer} />
      </div>

      <div className={s.clock}>
        <span className={s.time}>{formatClock(now)}</span>
        <span className={s.zone}>{utcOffsetLabel(now)}</span>
      </div>

      <div className={s.pitch} aria-hidden="true">
        <span className={s.pitchLine} />
        {PITCH.map((label, i) => (
          <span key={label} className={s.pitchMark} style={{ top: i * 65 }}>
            <span className={s.pitchLabel}>{label}</span>
            <span className={s.pitchTick} />
          </span>
        ))}
        {/* Tilts up towards 60° while the rocket climbs. */}
        <span className={s.pitchMarker} style={climbing ? { top: 58, transitionDuration: `${climb.ms}ms` } : undefined} />
      </div>

      <div className={s.zoomRail} aria-hidden="true">
        <span className={s.zoomLabel}>1.2x</span>
        <span className={s.zoomLine} />
        <img src={zoomDot} alt="" width={24} height={24} className={s.zoomDot} />
      </div>

      <div className={s.coords}>
        <span className={s.hudLabel}>COORDINATES</span>
        <span className={s.coordValue}>{'28.6083 N   80.6041 W'}</span>
      </div>

      <div className={s.mode}>
        <span className={s.hudLabel}>MODE</span>
        <span className={s.modeValue}>{modeLabel(flight)}</span>
      </div>

      {flight.phase === 'countdown' && (
        <div className={s.countdown} aria-live="assertive">
          <span className={s.countdownLabel}>T-MINUS</span>
          <span key={flight.n} className={s.countdownNum}>{flight.n}</span>
        </div>
      )}

      <div className={s.resultSlot} role="status" aria-live="polite">
        {message && (
          <div className={`${s.result} ${success ? s.ok : s.bad}`}>
            <span className={s.hudLabel}>{flight.phase === 'empty' ? 'PAD CHECK' : 'MISSION RESULT'}</span>
            <strong className={s.resultTitle}>{message.title}</strong>
            <span className={s.resultBody}>{message.body}</span>
          </div>
        )}
      </div>

      {layers === 0 && flight.phase === 'idle' && (
        <p className={s.emptyHint}>The pad is empty. Finish a topic and add its part to the rocket.</p>
      )}
    </section>
  )
}
