import { useRef, useState, type PointerEvent } from 'react'
import { AUDIO, CAMERA_SLOTS, TOPICS } from '../config'
import { pick, playNow, stopAll, usePlaying } from '../audio/player'
import type { Flight } from '../game/flight'
import { addedParts, type TopicStates } from '../game/rules'
import { useGame } from '../hooks/hooks'
import { store } from '../store/store'
import { setForcedSlot, useForcedSlot, type SlotId } from './demo'
import s from './DemoToolbar.module.css'

const lost = { kind: 'lost', altitudeKm: 21, parts: 8, odds: 0.78 } as const
const orbit = { kind: 'orbit', altitudeKm: 352, parts: 11, extras: 3 } as const
const pad = { kind: 'pad', altitudeKm: 0.01, parts: 3 } as const

/** Still frames of the launch, for showing each state without waiting. */
const STILLS: { label: string; flight: Flight }[] = [
  { label: 'Pad', flight: { phase: 'idle' } },
  { label: 'Empty', flight: { phase: 'empty' } },
  { label: 'T-2', flight: { phase: 'countdown', n: 2, outcome: orbit } },
  { label: 'Ignition', flight: { phase: 'ignition', outcome: orbit } },
  { label: 'Climb', flight: { phase: 'climb', outcome: lost } },
  { label: 'Boom', flight: { phase: 'boom', outcome: lost } },
  { label: 'Pad fail', flight: { phase: 'result', outcome: pad } },
  { label: 'Lost', flight: { phase: 'result', outcome: lost } },
  { label: 'Orbit', flight: { phase: 'result', outcome: orbit } },
]

/** Every audio file, so it can be played on demand from the toolbar. */
const SOUNDS: { label: string; src: () => string }[] = [
  ...[...new Set(Object.values(AUDIO.targeted))].map((src) => ({
    label: decodeURIComponent(src!.split('/').pop()!.replace('.mp3', '')),
    src: () => src!,
  })),
  ...AUDIO.newPart.map((src, i) => ({ label: `new-part-${i + 1}`, src: () => src })),
  { label: 'random', src: () => pick(AUDIO.random) },
  { label: 't-minus', src: () => AUDIO.countdown },
]

/** The first `n` topics in checklist order get their part added; the rest go back to Waiting. */
function topicsWithParts(n: number): TopicStates {
  return Object.fromEntries(
    TOPICS.slice(0, n).map((t) => [t.part, { status: 'added' as const, ...(t.track === 'hack' ? { decision: 'continue' as const } : {}) }]),
  )
}

interface DemoToolbarProps {
  flight: Flight
  onFlight: (f: Flight) => void
}

export function DemoToolbar({ flight, onFlight }: DemoToolbarProps) {
  const { topics } = useGame()
  const parts = addedParts(topics).length
  const slot = useForcedSlot()
  const playing = usePlaying()
  const [open, setOpen] = useState(true)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  const onGripDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onGripMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (d) setOffset({ x: d.ox + e.clientX - d.x, y: d.oy + e.clientY - d.y })
  }

  const setParts = (n: number) => {
    onFlight({ phase: 'idle' })
    void store.dispatch({ type: 'setTopics', topics: topicsWithParts(n) })
  }

  const stillKey = JSON.stringify(flight)

  return (
    <aside
      className={s.bar}
      style={{ transform: `translate(calc(-50% + ${offset.x}px), ${offset.y}px)` }}
      aria-label="Demo controls"
    >
      <div className={s.head}>
        <button
          type="button"
          className={s.grip}
          aria-label="Move the demo toolbar"
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={() => (drag.current = null)}
        >
          ⠿
        </button>
        <span className={s.title}>DEMO</span>
        <button type="button" className={s.toggle} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <div className={s.groups}>
          <div className={s.group} role="group" aria-label="Rocket parts">
            <span className={s.label}>PARTS</span>
            <div className={s.row}>
              {Array.from({ length: TOPICS.length + 1 }, (_, n) => (
                <button key={n} type="button" className={`${s.chip} ${s.num} ${n === parts ? s.on : ''}`} aria-pressed={n === parts} onClick={() => setParts(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={s.group} role="group" aria-label="Time of day">
            <span className={s.label}>TIME</span>
            <div className={s.row}>
              {[{ id: null, label: 'Clock' }, ...CAMERA_SLOTS.map((c) => ({ id: c.id, label: c.id[0].toUpperCase() + c.id.slice(1) }))].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  className={`${s.chip} ${slot === o.id ? s.on : ''}`}
                  aria-pressed={slot === o.id}
                  onClick={() => setForcedSlot(o.id as SlotId | null)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className={s.group} role="group" aria-label="Audio">
            <span className={s.label}>AUDIO</span>
            <div className={s.row}>
              {SOUNDS.map((snd) => (
                <button key={snd.label} type="button" className={s.chip} onClick={() => playNow(snd.src())}>
                  ▶ {snd.label}
                </button>
              ))}
              <button type="button" className={`${s.chip} ${playing ? s.on : ''}`} onClick={stopAll} disabled={!playing}>
                ■ Stop
              </button>
            </div>
          </div>

          <div className={s.group} role="group" aria-label="Launch stills">
            <span className={s.label}>LAUNCH</span>
            <div className={s.row}>
              {STILLS.map((st) => {
                const on = JSON.stringify(st.flight) === stillKey
                return (
                  <button key={st.label} type="button" className={`${s.chip} ${on ? s.on : ''}`} aria-pressed={on} onClick={() => onFlight(st.flight)}>
                    {st.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
