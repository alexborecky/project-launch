// Design review only: open the app with ?preview to step through launch states
// that aren't in Figma. Not shown in normal use.
import type { Flight } from '../game/flight'
import s from './Preview.module.css'

// oxlint-disable-next-line react/only-export-components
export const isPreview = () => new URLSearchParams(location.search).has('preview')

const lost = { kind: 'lost', altitudeKm: 21, parts: 8, odds: 0.78 } as const
const orbit = { kind: 'orbit', altitudeKm: 352, parts: 11, extras: 3 } as const
const pad = { kind: 'pad', altitudeKm: 0.01, parts: 3 } as const

const STATES: { id: string; label: string; flight: Flight }[] = [
  { id: 'idle', label: 'Idle', flight: { phase: 'idle' } },
  { id: 'empty', label: 'Empty pad', flight: { phase: 'empty' } },
  { id: 'countdown', label: 'Countdown', flight: { phase: 'countdown', n: 2, outcome: orbit } },
  { id: 'ignition', label: 'Ignition', flight: { phase: 'ignition', outcome: orbit } },
  { id: 'climb', label: 'Climb', flight: { phase: 'climb', outcome: lost } },
  { id: 'boom', label: 'Explosion', flight: { phase: 'boom', outcome: lost } },
  { id: 'pad', label: 'Result: pad', flight: { phase: 'result', outcome: pad } },
  { id: 'lost', label: 'Result: lost', flight: { phase: 'result', outcome: lost } },
  { id: 'orbit', label: 'Result: orbit', flight: { phase: 'result', outcome: orbit } },
]

/** `?preview=orbit` opens straight on that state. */
// oxlint-disable-next-line react/only-export-components
export const initialPreviewFlight = (): Flight =>
  STATES.find((st) => st.id === new URLSearchParams(location.search).get('preview'))?.flight ?? { phase: 'idle' }

export function PreviewSwitcher({ current, onPick }: { current: Flight; onPick: (f: Flight) => void }) {
  return (
    <nav className={s.bar} aria-label="Preview launch states">
      <span className={s.title}>PREVIEW</span>
      {STATES.map((st) => (
        <button
          key={st.label}
          type="button"
          className={`${s.item} ${JSON.stringify(st.flight) === JSON.stringify(current) ? s.on : ''}`}
          onClick={() => onPick(st.flight)}
        >
          {st.label}
        </button>
      ))}
    </nav>
  )
}
