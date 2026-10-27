import { useState } from 'react'
import { scheduledLaunchAt, type GameData } from '../game/actions'
import { weatherHoldActive } from './hold'
import { useNow } from '../hooks/hooks'
import { store } from '../store/store'
import { useAct } from '../store/useAct'
import s from './WeatherHold.module.css'

/** "Weather conditions and wind are bad" with Postpone 30 / 60 minutes. */
export function WeatherHold({ game }: { game: GameData }) {
  useNow() // re-check every second
  const act = useAct()
  const at = scheduledLaunchAt(game)
  // "Keep schedule" on the automatic popup only hides it on this screen, for this launch time.
  const [dismissedFor, setDismissedFor] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const active = weatherHoldActive(game, store.serverNow())
  const open = active && (game.weatherHold || dismissedFor !== at)
  if (!open) return null

  const postpone = async (minutes: number) => {
    setBusy(true)
    await act({ type: 'postpone', minutes })
    setBusy(false)
  }

  const keep = () => {
    if (game.weatherHold) void act({ type: 'weatherHold', on: false })
    else setDismissedFor(at)
  }

  return (
    <div className={s.backdrop} role="presentation">
      <section className={s.modal} role="alertdialog" aria-modal="true" aria-labelledby="wx-title" aria-describedby="wx-text">
        <p className={s.kicker}>
          <span className={s.dot} aria-hidden="true" /> RANGE SAFETY · WEATHER
        </p>
        <h2 id="wx-title" className={s.title}>WEATHER HOLD</h2>
        <p id="wx-text" className={s.text}>
          Weather conditions over the pad are unfavourable. Wind gusts exceed the launch limits.
        </p>
        <dl className={s.readings}>
          <div><dt>WIND</dt><dd>46 km/h ↗ SW, gusting 61</dd></div>
          <div><dt>CONDITIONS</dt><dd>NO GO</dd></div>
        </dl>
        <div className={s.actions}>
          <button type="button" className={s.primary} disabled={busy} onClick={() => postpone(30)} autoFocus>
            Postpone 30 min
          </button>
          <button type="button" className={s.primary} disabled={busy} onClick={() => postpone(60)}>
            Postpone 60 min
          </button>
        </div>
        <button type="button" className={s.keep} disabled={busy} onClick={keep}>
          Keep schedule
        </button>
      </section>
    </div>
  )
}
