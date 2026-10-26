import { useEffect, useState } from 'react'
import { LAUNCH_VIDEO } from '../config'
import type { LaunchRecord } from '../game/actions'
import type { Flight } from '../game/flight'
import { VIDEO_AT } from '../game/timeline'
import { altitudeAfterMs, finalAltitude, positionAt, speedAt, timeToAltitudeMs, trailTo } from '../game/trajectory'
import { store } from '../store/store'
import earthLimb from '../assets/figma/earth-limb.svg'
import limbGlow from '../assets/figma/limb-glow.png'
import trajectory from '../assets/figma/trajectory.svg'
import nodeRing from '../assets/figma/node-ring.svg'
import nodeDot from '../assets/figma/node-dot.svg'
import nodeRingDim from '../assets/figma/node-ring-dim.svg'
import nodeDotDim from '../assets/figma/node-dot-dim.svg'
import maxqOuter from '../assets/figma/maxq-ring-outer.svg'
import maxqInner from '../assets/figma/maxq-ring-inner.svg'
import maxqDot from '../assets/figma/maxq-dot.svg'
import target from '../assets/figma/target.svg'
import s from './TrajectoryMap.module.css'

const ZOOM = [1, 1.25, 1.5]
const GRID = Array.from({ length: 13 }, (_, i) => 11 + i * 24)
const ROWS = Array.from({ length: 11 }, (_, i) => 11 + i * 24)

interface TrajectoryMapProps {
  flight: Flight
  /** The shared launch record, so every screen flies the same route at the same time. */
  launch: LaunchRecord | null
  reducedMotion: boolean
}

/** Where the rocket is on the map: altitude and whether it has finished flying. */
function useMapFlight(flight: Flight, launch: LaunchRecord | null, reducedMotion: boolean) {
  const outcome = 'outcome' in flight ? flight.outcome : launch?.outcome ?? null
  const finalKm = outcome ? finalAltitude(outcome) : 0
  const flightMs = timeToAltitudeMs(finalKm)
  // The map starts flying when the rocket leaves the pad in the launch clip.
  const liftoff = launch ? launch.at + VIDEO_AT + LAUNCH_VIDEO.liftoffAtMs : null

  const [now, setNow] = useState(() => store.serverNow())
  const flying = liftoff != null && !reducedMotion
  // A plain timer rather than animation frames, so it keeps going in a background tab. It stops once landed.
  useEffect(() => {
    if (!flying) return
    const id = setInterval(() => {
      const t = store.serverNow()
      setNow(t)
      if (t - liftoff > flightMs + 500) clearInterval(id)
    }, 100)
    return () => clearInterval(id)
  }, [flying, liftoff, flightMs])

  if (!outcome) return { km: 0, done: false, flying: false }
  if (liftoff == null) {
    // Still frames from the demo toolbar
    if (flight.phase === 'climb') return { km: finalKm / 2, done: false, flying: true }
    if (flight.phase === 'boom' || flight.phase === 'result') return { km: finalKm, done: true, flying: true }
    return { km: 0, done: false, flying: false }
  }
  const elapsed = now - liftoff
  if (elapsed < 0) return { km: 0, done: false, flying: false } // film, countdown, ignition: still on the pad
  if (reducedMotion || elapsed >= flightMs) return { km: finalKm, done: true, flying: true }
  return { km: altitudeAfterMs(elapsed), done: false, flying: true }
}

export function TrajectoryMap({ flight, launch, reducedMotion }: TrajectoryMapProps) {
  const [zoom, setZoom] = useState(0)
  const outcome = 'outcome' in flight ? flight.outcome : launch?.outcome ?? null
  const orbitKm = outcome?.kind === 'orbit' ? outcome.altitudeKm : undefined
  const map = useMapFlight(flight, launch, reducedMotion)
  const altitudeKm = map.km
  const velocityKms = map.flying ? speedAt(altitudeKm) : 0
  // The pulsing dot: on PAD 39A before launch, then riding along the route.
  const marker = positionAt(altitudeKm, orbitKm)
  const lost = outcome != null && outcome.kind !== 'orbit' && map.done
  const arrived = outcome?.kind === 'orbit' && map.done

  return (
    <section className={s.panel} aria-label="Trajectory map">
      <header className={s.header}>
        <h2 className={s.title}>Trajectory Map</h2>
        <span className={s.live}>LIVE</span>
      </header>
      <div className={s.canvas}>
        <div className={s.world} style={{ transform: `scale(${ZOOM[zoom]})` }}>
          {GRID.map((x) => <span key={`x${x}`} className={s.gridV} style={{ left: x }} />)}
          {ROWS.map((y) => <span key={`y${y}`} className={s.gridH} style={{ top: y }} />)}

          <img src={earthLimb} alt="" width={640} height={640} className={s.abs} style={{ left: -160, top: 207 }} />
          <img src={limbGlow} alt="" width={620} height={620} className={s.abs} style={{ left: -150, top: 227 }} />
          <img src={limbGlow} alt="" width={620} height={620} className={s.abs} style={{ left: -150, top: 237 }} />

          <img src={trajectory} alt="" width={322} height={262} className={s.abs} style={{ left: -1, top: -1 }} />

          <Node ring={nodeRing} dot={nodeDot} x={68.28} y={207} label="PAD 39A" />
          <Node ring={nodeRing} dot={nodeDot} x={87.6} y={163.92} label="STAGE 1" />
          <Node ring={nodeRing} dot={nodeDot} x={158.94} y={108.9} label="MAX-Q" />
          <Node ring={nodeRingDim} dot={nodeDotDim} x={190.64} y={53.88} label="STAGE 2" dim />
          <img src={target} alt="" width={14} height={14} className={`${s.abs} ${arrived ? s.arrived : ''}`} style={{ left: 243.16, top: 18.2 }} />
          <span className={`${s.nodeLabel} ${s.orbit}`} style={{ left: 262.16, top: 18.2 }}>ORBIT</span>

          {map.flying && (
            <svg className={s.trail} viewBox="0 0 322 262" aria-hidden="true">
              <polyline points={trailTo(altitudeKm, orbitKm).map((p) => `${p.x},${p.y}`).join(' ')} />
            </svg>
          )}
          {lost ? (
            <>
              <span className={s.burst} style={{ left: marker.x, top: marker.y }} aria-hidden="true" />
              <span className={`${s.nodeLabel} ${s.lostLabel}`} style={{ left: marker.x + 12, top: marker.y + 6 }}>
                SIGNAL LOST
              </span>
            </>
          ) : (
            <span className={s.marker} style={{ left: marker.x, top: marker.y }} aria-hidden="true">
              <img src={maxqOuter} alt="" width={32} height={32} className={s.markerOuter} />
              <img src={maxqInner} alt="" width={20} height={20} className={s.markerInner} />
              <img src={maxqDot} alt="" width={23} height={23} className={s.markerDot} />
            </span>
          )}
        </div>

        <p className={s.readout} role="status" aria-live="off" aria-label={`Altitude ${Math.round(altitudeKm)} kilometres, speed ${velocityKms.toFixed(1)} kilometres per second`}>
          ALT {altitudeKm < 10 ? altitudeKm.toFixed(1) : Math.round(altitudeKm)} km · V {velocityKms.toFixed(1)} km/s
        </p>

        <div className={s.zoom}>
          <button type="button" className={s.zoomBtn} aria-label="Zoom in" disabled={zoom === ZOOM.length - 1} onClick={() => setZoom((z) => z + 1)}>
            +
          </button>
          <button type="button" className={s.zoomBtn} aria-label="Zoom out" disabled={zoom === 0} onClick={() => setZoom((z) => z - 1)}>
            –
          </button>
        </div>
      </div>
    </section>
  )
}

function Node({ ring, dot, x, y, label, dim }: { ring: string; dot: string; x: number; y: number; label: string; dim?: boolean }) {
  return (
    <>
      <img src={ring} alt="" width={16} height={16} className={s.abs} style={{ left: x, top: y }} />
      <img src={dot} alt="" width={5} height={5} className={s.abs} style={{ left: x + 5.5, top: y + 5.5 }} />
      <span className={`${s.nodeLabel} ${dim ? s.dim : ''}`} style={{ left: x + 22, top: y + 1 }}>{label}</span>
    </>
  )
}
