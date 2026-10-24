import { useState } from 'react'
import earthLimb from '../assets/figma/earth-limb.svg'
import limbGlow from '../assets/figma/limb-glow.png'
import ringOuter from '../assets/figma/map-ring-outer.svg'
import ringInner from '../assets/figma/map-ring-inner.png'
import mapSweep from '../assets/figma/map-sweep.svg'
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
  altitudeKm: number
  velocityKms: number
}

export function TrajectoryMap({ altitudeKm, velocityKms }: TrajectoryMapProps) {
  const [zoom, setZoom] = useState(0)

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

          <img src={ringOuter} alt="" width={140} height={140} className={s.abs} style={{ left: 96.44, top: 46.9 }} />
          <img src={ringInner} alt="" width={92} height={92} className={s.abs} style={{ left: 120.44, top: 70.9 }} />
          <div className={s.sweep} style={{ left: 96.44, top: 46.9 }}>
            <img src={mapSweep} alt="" width={50.2149} height={70} className={s.abs} style={{ left: 70, top: 0 }} />
          </div>

          <img src={trajectory} alt="" width={322} height={262} className={s.abs} style={{ left: -1, top: -1 }} />

          <Node ring={nodeRing} dot={nodeDot} x={68.28} y={207} label="PAD 39A" />
          <Node ring={nodeRing} dot={nodeDot} x={87.6} y={163.92} label="STAGE 1" />
          <img src={maxqOuter} alt="" width={32} height={32} className={s.abs} style={{ left: 150.44, top: 100.9 }} />
          <img src={maxqInner} alt="" width={20} height={20} className={s.abs} style={{ left: 156.44, top: 106.9 }} />
          <img src={maxqDot} alt="" width={23} height={23} className={s.abs} style={{ left: 154.94, top: 105.4 }} />
          <span className={`${s.nodeLabel} ${s.maxq}`} style={{ left: 188.44, top: 109.9 }}>MAX-Q</span>
          <Node ring={nodeRingDim} dot={nodeDotDim} x={190.64} y={53.88} label="STAGE 2" dim />
          <img src={target} alt="" width={14} height={14} className={s.abs} style={{ left: 243.16, top: 18.2 }} />
          <span className={`${s.nodeLabel} ${s.orbit}`} style={{ left: 262.16, top: 18.2 }}>ORBIT</span>
        </div>

        <p className={s.readout} aria-live="off">
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
