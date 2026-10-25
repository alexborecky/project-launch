import { useLayoutEffect, useState } from 'react'
import { TOPICS } from '../config'
import type { Flight } from '../game/flight'
import { addedParts, isViable, odds as oddsOf, statusOf } from '../game/rules'
import { LAUNCH_AT } from '../game/time'
import { useGame, useGodMode, useNow, useReducedMotion, useSyncStatus } from '../hooks/hooks'
import { useAct } from '../store/useAct'
import { CameraViewport } from './CameraViewport'
import { Checklist } from './Checklist'
import { Communications } from './Communications'
import { useConfirm } from './Confirm'
import { ControlDeck } from './ControlDeck'
import { LaunchButton } from './LaunchButton'
import { LaunchSequence, type Step } from './LaunchSequence'
import { LaunchConditions, SystemStatus } from './SidePanels'
import { TopBar } from './TopBar'
import { TrajectoryMap } from './TrajectoryMap'
import s from './Board.module.css'

const DESIGN_W = 1440
const DESIGN_H = 900
/** Below this scale the board would get too small to read, so the panels stack and scroll instead. */
const MIN_SCALE = 0.78

/** Fits the 1440 × 900 board to the window. Extra width goes to the centre column. */
/**
 * The window's layout size. On phones, innerWidth reports the zoomed-out width when the page is wider
 * than the screen (as the 1440px board is on its first paint), so use the layout viewport instead.
 */
const viewport = () => ({
  w: document.documentElement.clientWidth || innerWidth,
  h: document.documentElement.clientHeight || innerHeight,
})

function computeFit() {
  const { w, h } = viewport()
  const scale = Math.min(w / DESIGN_W, h / DESIGN_H)
  const compact = scale < MIN_SCALE
  return compact ? { scale: 1, width: w, compact } : { scale, width: w / scale, compact }
}

function useFit() {
  // Worked out before the first paint, so phones never see (and zoom out to) the 1440px board.
  const [fit, setFit] = useState(computeFit)
  useLayoutEffect(() => {
    const update = () => {
      const next = computeFit()
      setFit(next)
      document.body.classList.toggle('compact', next.compact)
    }
    update()
    // ResizeObserver also catches size changes that don't fire a window resize event.
    const ro = new ResizeObserver(update)
    ro.observe(document.documentElement)
    return () => ro.disconnect()
  }, [])
  return fit
}

interface BoardProps {
  /** What the camera viewport shows (see useLaunch). */
  flight: Flight
  onLaunch: () => void
  onReturn: () => void
}

export function Board({ flight, onLaunch, onReturn }: BoardProps) {
  const fit = useFit()
  const now = useNow()
  const game = useGame()
  const godMode = useGodMode()
  const reducedMotion = useReducedMotion()
  const confirm = useConfirm()
  const act = useAct()
  const link = useSyncStatus()

  const added = addedParts(game.topics)
  const odds = oddsOf(game.topics)
  const viable = isViable(game.topics)
  const locked = !godMode && now.getTime() < LAUNCH_AT
  const inFlight = flight.phase !== 'idle' && flight.phase !== 'empty' && flight.phase !== 'result'
  const launched = flight.phase === 'result'

  const anyActivity = TOPICS.some((t) => statusOf(game.topics, t.part) !== 'waiting')
  const status =
    flight.phase === 'result'
      ? flight.outcome.kind === 'orbit' ? 'IN ORBIT' : 'VEHICLE LOST'
      : inFlight ? 'LAUNCHING' : anyActivity ? 'IN PROGRESS' : 'STANDBY'

  const steps: Step[] = [
    { label: 'Assemble rocket parts', state: added.length > 0 ? 'checked' : 'pending' },
    { label: 'Integrate all systems', state: viable ? 'checked' : 'pending' },
    {
      label: 'Final go / no-go poll',
      state: game.goNoGo ? 'checked' : 'pending',
      onToggle: godMode ? () => void act({ type: 'goNoGo', value: !game.goNoGo }) : undefined,
    },
    { label: 'Launch', state: launched ? 'checked' : locked ? 'locked' : 'pending' },
  ]

  const reset = async () => {
    const ok = await confirm({
      title: 'Reset everything?',
      message: 'All topics go back to Waiting and the rocket is cleared, for god mode and regular mode alike.',
      confirmLabel: 'Reset',
    })
    if (ok) {
      await act({ type: 'reset' })
    }
  }

  const buttonMode = locked ? 'locked' : inFlight ? 'busy' : launched ? 'return' : 'ready'

  return (
    <div
      className={`${s.board} ${fit.compact ? s.compact : ''}`}
      style={fit.compact ? undefined : { width: fit.width, transform: `scale(${fit.scale})` }}
    >
      <TopBar
        now={now}
        status={status}
        godMode={godMode}
        onReset={reset}
        onFullReset={() => void act({ type: 'reset' })}
      />
      <main className={s.main}>
        <div className={s.side}>
          <div className={s.grow}><Checklist locked={inFlight} /></div>
          <div className={s.conditions}><LaunchConditions now={now} drift={!reducedMotion} /></div>
        </div>
        <div className={s.centre}>
          <CameraViewport
            now={now}
            flight={flight}
            layers={added.length}
            launchStart={game.launch && flight.phase !== 'idle' ? game.launch.at : null}
            reducedMotion={reducedMotion}
          />
          <div className={s.deckRow}>
            <ControlDeck odds={odds} parts={added.length} total={TOPICS.length} reducedMotion={reducedMotion} />
            <LaunchSequence steps={steps} />
          </div>
          <LaunchButton mode={buttonMode} onClick={launched ? onReturn : onLaunch} />
        </div>
        <div className={s.side}>
          <div className={s.status}><SystemStatus link={link} /></div>
          <div className={s.grow}><TrajectoryMap flight={flight} reducedMotion={reducedMotion} /></div>
          <div className={s.comms}><Communications reducedMotion={reducedMotion} /></div>
        </div>
      </main>
    </div>
  )
}
