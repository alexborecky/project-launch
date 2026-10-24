import type { CSSProperties } from 'react'
import type { PartId } from '../config'
import { PARTS, PART_ORDER, ROCKET_VIEWBOX } from './parts'
import s from './Rocket.module.css'

export interface RocketProps {
  parts: ReadonlySet<PartId>
  flame?: boolean
  smoke?: boolean
  shake?: boolean
  /** How far the rocket has climbed, in rocket units (the rocket is ~550 tall). */
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

export function Rocket({ parts, flame, smoke, shake, rise = 0, riseMs = 0, exploded, gone, className, style }: RocketProps) {
  const v = ROCKET_VIEWBOX
  return (
    <svg
      className={`${s.svg} ${className ?? ''}`}
      style={style}
      viewBox={`${v.x} ${v.y} ${v.w} ${v.h}`}
      aria-hidden="true"
      overflow="visible"
    >
      <defs>
        <linearGradient id="rk-hull" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--rk-steel-5)" />
          <stop offset=".22" stopColor="var(--rk-steel-2)" />
          <stop offset=".45" stopColor="var(--rk-steel-3)" />
          <stop offset=".7" stopColor="var(--rk-steel-4)" />
          <stop offset="1" stopColor="var(--rk-steel-5)" />
        </linearGradient>
        <linearGradient id="rk-carbon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--rk-carbon-1)" />
          <stop offset=".45" stopColor="var(--rk-carbon-2)" />
          <stop offset="1" stopColor="var(--rk-carbon-1)" />
        </linearGradient>
        <linearGradient id="rk-bell" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--rk-metal-1)" />
          <stop offset=".5" stopColor="var(--rk-metal-2)" />
          <stop offset="1" stopColor="var(--rk-metal-1)" />
        </linearGradient>
        <linearGradient id="rk-plume" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--rk-flame-1)" />
          <stop offset=".35" stopColor="var(--rk-flame-2)" />
          <stop offset="1" stopColor="var(--rk-flame-3)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rk-glow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="var(--rk-flame-2)" stopOpacity=".8" />
          <stop offset="1" stopColor="var(--rk-flame-3)" stopOpacity="0" />
        </radialGradient>
        <filter id="rk-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="rk-blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>

      <g className={`${s.smoke} ${smoke ? s.on : ''}`} filter="url(#rk-blur6)">
        <circle cx="330" cy="604" r="40" fill="var(--rk-smoke)" />
        <circle cx="470" cy="604" r="44" fill="var(--rk-smoke)" />
        <circle cx="400" cy="616" r="52" fill="var(--rk-steel-3)" />
        <circle cx="270" cy="614" r="34" fill="var(--rk-smoke)" />
        <circle cx="530" cy="614" r="34" fill="var(--rk-smoke)" />
        <circle cx="210" cy="622" r="26" fill="var(--rk-smoke)" />
        <circle cx="590" cy="622" r="26" fill="var(--rk-smoke)" />
      </g>

      <g
        className={`${s.body} ${shake ? s.shake : ''}`}
        style={{ transform: `translateY(${-rise}px)`, transitionDuration: `${riseMs}ms`, opacity: exploded || gone ? 0 : 1 }}
      >
        <g className={`${s.flame} ${flame ? s.on : ''}`}>
          <ellipse cx="400" cy="640" rx="90" ry="50" fill="url(#rk-glow)" filter="url(#rk-blur14)" />
          <path d="M372 604 Q400 790 428 604 Z" fill="url(#rk-plume)" filter="url(#rk-blur6)" />
          <path d="M384 604 Q400 700 416 604 Z" fill="var(--rk-flame-1)" />
        </g>
        {PART_ORDER.map((id) => {
          const Part = PARTS[id]
          return (
            <g key={id} data-part={id} className={`${s.part} ${parts.has(id) ? s.on : ''}`}>
              <Part />
            </g>
          )
        })}
      </g>

      <g className={`${s.boom} ${exploded ? s.on : ''}`} filter="url(#rk-blur6)" style={{ transform: `translateY(${-rise}px)` }}>
        <circle cx="400" cy="380" r="70" fill="var(--rk-flame-2)" />
        <circle cx="365" cy="345" r="48" fill="var(--rk-flame-3)" />
        <circle cx="440" cy="405" r="52" fill="var(--c-accent)" />
        <circle cx="420" cy="340" r="40" fill="var(--rk-smoke)" />
        <circle cx="400" cy="380" r="32" fill="var(--rk-flame-1)" />
      </g>
    </svg>
  )
}
