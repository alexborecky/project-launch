import { CAMERA_SLOTS, ROCKET_PLACEMENT, TOPICS, VIABILITY, type PartId } from '../config'
import { climbFor, modeLabel, resultText, type Flight } from '../game/flight'
import { cameraSlotForHour, formatClock, utcOffsetLabel, wallClock } from '../game/time'
import { ROCKET_VIEWBOX } from '../rocket/parts'
import { Rocket } from '../rocket/Rocket'
import camDot from '../assets/figma/cam-dot.svg'
import zoomDot from '../assets/figma/zoom-dot.svg'
import s from './CameraViewport.module.css'

const HEADING = [
  ['N', 8], ['15', 5], ['30', 5], ['NE', 8], ['60', 5], ['75', 5], ['E', 8], ['105', 5], ['120', 5], ['SE', 8],
] as const

const PITCH = ['120', '60', '0', '-60', '-120']

const CORE_TOTAL = TOPICS.filter((t) => t.type === 'core').length

/** `?camera=dusk` forces a camera slot, for checking images without waiting for the clock. */
const FORCED_SLOT = CAMERA_SLOTS.find((c) => c.id === new URLSearchParams(location.search).get('camera'))

interface CameraViewportProps {
  now: Date
  flight: Flight
  parts: ReadonlySet<PartId>
}

export function CameraViewport({ now, flight, parts }: CameraViewportProps) {
  const slot = FORCED_SLOT ?? cameraSlotForHour(wallClock(now).hour)
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

  // Rocket height in % of the viewport → scale its 554-unit-tall drawing to match.
  const rocketStyle = {
    left: `${ROCKET_PLACEMENT.x}%`,
    bottom: `${ROCKET_PLACEMENT.bottom}%`,
    height: `${ROCKET_PLACEMENT.height}%`,
    aspectRatio: `${ROCKET_VIEWBOX.w} / ${ROCKET_VIEWBOX.h}`,
  }

  return (
    <section className={s.view} aria-label="Pad camera">
      {/* The scene has the photo's proportions and covers the viewport, so the rocket stays pinned to the pad. */}
      <div className={s.scene}>
        {/* All slots stay loaded; the current one fades in over the others. */}
        {CAMERA_SLOTS.map((c) => (
          <img
            key={c.id}
            className={`${s.photo} ${c.id === slot.id ? s.photoOn : ''}`}
            src={c.image}
            alt={c.id === slot.id ? `Camera view of the launch pad (${c.id})` : ''}
            aria-hidden={c.id !== slot.id}
          />
        ))}

        <Rocket
        className={s.rocket}
        style={rocketStyle}
        parts={flight.phase === 'empty' ? new Set() : parts}
        flame={burning}
        smoke={flight.phase !== 'idle' && flight.phase !== 'empty' && flight.phase !== 'countdown'}
        shake={burning || flight.phase === 'empty'}
        rise={climbing ? climb.rise : 0}
        riseMs={climbing ? climb.ms : 0}
        exploded={flight.phase === 'boom' && lostVehicle}
        gone={lostVehicle}
        />
      </div>

      <div className={s.vignette} aria-hidden="true" />
      {flight.phase === 'boom' && outcome?.kind !== 'orbit' && <div className={s.flash} aria-hidden="true" />}

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

      {parts.size === 0 && flight.phase === 'idle' && (
        <p className={s.emptyHint}>The pad is empty. Finish a topic and add its part to the rocket.</p>
      )}
    </section>
  )
}
