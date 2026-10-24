// The rocket on the pad: a stack of PNG construction layers, plus flame, smoke and explosion.
// Everything is drawn in the layer canvas's own units (256 × 1536), so effects line up with the art.
import type { CSSProperties } from 'react'
import { ROCKET_LAYERS } from '../config'
import s from './Rocket.module.css'

export interface RocketProps {
  /** Lighting folder inside ROCKET_LAYERS.base, e.g. "day". */
  theme: string
  /** How many layers to show, from the bottom of the stack (0–12). */
  layers: number
  flame?: boolean
  smoke?: boolean
  shake?: boolean
  /** How far the rocket has climbed, in rocket heights. */
  rise?: number
  /** Duration of the move to `rise`, ms. 0 = jump. */
  riseMs?: number
  /** Show the fireball. */
  exploded?: boolean
  /** Hide the rocket (after it blew up). */
  gone?: boolean
  className?: string
  style?: CSSProperties
}

const { w: W, h: H } = ROCKET_LAYERS.canvas
const N = ROCKET_LAYERS.nozzle

export function Rocket({ theme, layers, flame, smoke, shake, rise = 0, riseMs = 0, exploded, gone, className, style }: RocketProps) {
  const lift: CSSProperties = { transform: `translateY(${-rise * 100}%)`, transitionDuration: `${riseMs}ms` }
  const id = `rk-${theme}` // SVG filter ids must be unique per rocket on the page

  return (
    <div className={`${s.rocket} ${className ?? ''}`} style={style} aria-hidden="true">
      {/* Smoke stays on the pad. */}
      <svg className={`${s.fx} ${s.smoke} ${smoke ? s.on : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        </defs>
        <g filter={`url(#${id}-blur)`}>
          {/* Overlapping clouds that billow out sideways along the pad. */}
          {[
            [128, 1470, 150], [10, 1460, 130], [246, 1460, 130], [-130, 1480, 120], [386, 1480, 120],
            [-280, 1495, 105], [536, 1495, 105], [-420, 1505, 90], [676, 1505, 90], [128, 1400, 110],
          ].map(([cx, cy, r]) => (
            <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={r * 1.5} ry={r} fill="var(--rk-smoke)" />
          ))}
        </g>
      </svg>

      <div className={`${s.body} ${shake ? s.shake : ''}`} style={{ ...lift, opacity: exploded || gone ? 0 : 1 }}>
        <svg className={`${s.fx} ${s.flame} ${flame ? s.on : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${id}-plume`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--rk-flame-1)" />
              <stop offset=".35" stopColor="var(--rk-flame-2)" />
              <stop offset="1" stopColor="var(--rk-flame-3)" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="var(--rk-flame-2)" stopOpacity=".85" />
              <stop offset="1" stopColor="var(--rk-flame-3)" stopOpacity="0" />
            </radialGradient>
            <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
          </defs>
          <g className={s.flicker} style={{ transformOrigin: `${N.x}px ${N.y}px` }}>
            <ellipse cx={N.x} cy={N.y + 80} rx="300" ry="140" fill={`url(#${id}-glow)`} filter={`url(#${id}-soft)`} />
            <path d={`M${N.x - 70} ${N.y - 8} Q${N.x} ${N.y + 900} ${N.x + 70} ${N.y - 8} Z`} fill={`url(#${id}-plume)`} filter={`url(#${id}-soft)`} />
            <path d={`M${N.x - 38} ${N.y - 8} Q${N.x} ${N.y + 420} ${N.x + 38} ${N.y - 8} Z`} fill="var(--rk-flame-1)" />
          </g>
        </svg>

        {ROCKET_LAYERS.files.map((file, i) => (
          <img
            key={file}
            className={`${s.layer} ${i < layers ? s.on : ''}`}
            src={`${ROCKET_LAYERS.base}/${theme}/${file}`}
            alt=""
            draggable={false}
          />
        ))}
      </div>

      <div className={s.boomWrap} style={lift}>
        <svg className={`${s.fx} ${s.boom} ${exploded ? s.on : ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <filter id={`${id}-boom`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16" /></filter>
          </defs>
          <g filter={`url(#${id}-boom)`}>
            <circle cx="128" cy="760" r="150" fill="var(--rk-flame-2)" />
            <circle cx="70" cy="680" r="105" fill="var(--rk-flame-3)" />
            <circle cx="200" cy="830" r="110" fill="var(--c-accent)" />
            <circle cx="170" cy="660" r="90" fill="var(--rk-smoke)" />
            <circle cx="128" cy="760" r="70" fill="var(--rk-flame-1)" />
          </g>
        </svg>
      </div>
    </div>
  )
}
