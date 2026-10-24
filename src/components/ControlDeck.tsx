import { useCallback, useRef, type MouseEvent } from 'react'
import { useFrame } from '../hooks/hooks'
import gaugeTrack from '../assets/figma/gauge-track.svg'
import gaugeDisc from '../assets/figma/gauge-disc.png'
import radarBase from '../assets/figma/radar-base.png'
import ring1 from '../assets/figma/radar-ring-1.svg'
import ring2 from '../assets/figma/radar-ring-2.svg'
import ring3 from '../assets/figma/radar-ring-3.svg'
import diagA from '../assets/figma/radar-ring-4a.svg'
import diagB from '../assets/figma/radar-ring-4b.svg'
import axisH from '../assets/figma/radar-axis-h.svg'
import axisV from '../assets/figma/radar-axis-v.svg'
import sweepLine from '../assets/figma/radar-sweep.svg'
import s from './ControlDeck.module.css'

interface ControlDeckProps {
  odds: number
  parts: number
  total: number
  reducedMotion: boolean
}

export function ControlDeck({ odds, parts, total, reducedMotion }: ControlDeckProps) {
  return (
    <section className={s.deck} aria-label="Control deck">
      <div className={s.cell}>
        <h3 className={s.label}>PROGRESS</h3>
        <Gauge value={odds} text={`${Math.round(odds * 100)}%`} name="Chance of a successful launch" reducedMotion={reducedMotion} />
        <p className={s.caption}>ASSEMBLY</p>
      </div>
      <div className={s.cell}>
        <h3 className={s.label}>PARTS</h3>
        <Gauge value={parts / total} text={`${parts}/${total}`} name="Parts added to the rocket" reducedMotion={reducedMotion} />
        <p className={s.caption}>INTEGRATED</p>
      </div>
      <div className={s.cell}>
        <h3 className={s.label}>RADAR</h3>
        <Radar reducedMotion={reducedMotion} />
        <p className={s.caption}>ONLINE</p>
      </div>
    </section>
  )
}

// Arc sits in the middle of the 104px track ring (outer r 52, inner r 48.36).
const R = 50.18
const C = 2 * Math.PI * R

function Gauge({ value, text, name, reducedMotion }: { value: number; text: string; name: string; reducedMotion: boolean }) {
  const arc = useRef<SVGCircleElement>(null)

  // A tiny wobble around the real value so the board feels alive. The number never wobbles.
  const wobble = useCallback(
    (t: number) => {
      const j = value > 0 ? Math.sin(t / 1300) * 0.008 + Math.sin(t / 470) * 0.004 : 0
      const v = Math.max(0, Math.min(1, value + j))
      arc.current?.setAttribute('stroke-dashoffset', (C * (1 - v)).toFixed(2))
    },
    [value],
  )
  useFrame(wobble, !reducedMotion)

  return (
    <div className={s.gauge} role="img" aria-label={`${name}: ${text}`}>
      <img src={gaugeTrack} alt="" width={104} height={104} className={s.layer} />
      <svg className={s.arc} viewBox="0 0 104 104" aria-hidden="true">
        <circle
          ref={arc}
          cx="52"
          cy="52"
          r={R}
          fill="none"
          stroke="var(--c-accent)"
          strokeWidth="3.64"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.min(1, value))}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <img src={gaugeDisc} alt="" width={80} height={80} className={s.disc} />
      <span className={s.value}>{text}</span>
    </div>
  )
}

interface Blip {
  angle: number // radians, 0 = right, clockwise
  dist: number // 0..1
  life: number
  el: SVGCircleElement | null
}

// The sweep line in Figma points up-right, i.e. -45°.
const SWEEP_OFFSET = -Math.PI / 4

const START_BLIPS = [
  { angle: -2.35, dist: 0.62, life: 1 },
  { angle: 0.9, dist: 0.42, life: 0.3 },
  { angle: 2.6, dist: 0.74, life: 0.3 },
]

function Radar({ reducedMotion }: { reducedMotion: boolean }) {
  const rotor = useRef<HTMLDivElement>(null)
  const sweep = useRef(SWEEP_OFFSET)
  const blips = useRef<Blip[]>(START_BLIPS.map((b) => ({ ...b, el: null })))
  const layer = useRef<SVGGElement>(null)

  const draw = useCallback((_t: number, dt: number) => {
    sweep.current = (sweep.current + (dt / 1000) * 1.4) % (Math.PI * 2)
    if (rotor.current) rotor.current.style.transform = `rotate(${sweep.current - SWEEP_OFFSET}rad)`
    for (const b of blips.current) {
      const diff = (((sweep.current - b.angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      if (diff < 0.1) b.life = 1
      b.life = Math.max(0.08, b.life - (dt / 1000) * 0.35)
      b.el?.setAttribute('opacity', b.life.toFixed(2))
    }
  }, [])
  useFrame(draw, !reducedMotion)

  const addBlip = (angle: number, dist: number) => {
    const ns = 'http://www.w3.org/2000/svg'
    const el = document.createElementNS(ns, 'circle')
    el.setAttribute('cx', String(52 + Math.cos(angle) * 52 * dist))
    el.setAttribute('cy', String(52 + Math.sin(angle) * 52 * dist))
    el.setAttribute('r', '3.2')
    el.setAttribute('fill', 'var(--c-accent)')
    layer.current?.appendChild(el)
    blips.current.push({ angle, dist, life: 1, el })
    if (blips.current.length > 10) blips.current.shift()?.el?.remove()
  }

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    // Keyboard clicks have no position: drop a contact somewhere random.
    if (e.detail === 0) return addBlip(Math.random() * Math.PI * 2, 0.25 + Math.random() * 0.65)
    const x = ((e.clientX - r.left) / r.width) * 2 - 1
    const y = ((e.clientY - r.top) / r.height) * 2 - 1
    const d = Math.hypot(x, y)
    if (d <= 1) addBlip(Math.atan2(y, x), d)
  }

  return (
    <button type="button" className={s.radar} onClick={onClick} aria-label="Radar. Click to add a contact">
      <div ref={rotor} className={s.rotor}>
        <img src={radarBase} alt="" className={s.radarBase} />
        <img src={sweepLine} alt="" width={37.0171} height={37.0171} className={s.sweepLine} />
      </div>
      <img src={ring1} alt="" width={26.0623} height={26.0623} className={s.ring} style={{ left: 38.97, top: 38.97 }} />
      <img src={ring2} alt="" width={52.1246} height={52.1246} className={s.ring} style={{ left: 25.94, top: 25.94 }} />
      <img src={ring3} alt="" width={78.1869} height={78.1869} className={s.ring} style={{ left: 12.91, top: 12.91 }} />
      <img src={diagA} alt="" width={73.5075} height={73.5075} className={s.ring} style={{ left: 15.25, top: 15.25 }} />
      <img src={diagB} alt="" width={73.5075} height={73.5075} className={s.ring} style={{ left: 15.25, top: 15.25 }} />
      <img src={axisH} alt="" width={103.924} height={0.0899893} className={s.ring} style={{ left: 0.04, top: 51.96 }} />
      <img src={axisV} alt="" width={0.0899893} height={103.924} className={s.ring} style={{ left: 51.96, top: 0.04 }} />
      <svg className={s.blips} viewBox="0 0 104 104" aria-hidden="true">
        <g ref={layer} style={{ filter: 'drop-shadow(0 0 3px rgba(226, 83, 25, 0.9))' }}>
          {START_BLIPS.map((b, i) => (
            <circle
              key={i}
              ref={(el) => {
                const live = blips.current.find((x) => x.angle === b.angle)
                if (live) live.el = el
              }}
              cx={52 + Math.cos(b.angle) * 52 * b.dist}
              cy={52 + Math.sin(b.angle) * 52 * b.dist}
              r="3.2"
              fill="var(--c-accent)"
              opacity={b.life}
            />
          ))}
        </g>
      </svg>
    </button>
  )
}
