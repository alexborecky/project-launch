import { useLayoutEffect, useState } from 'react'
import { TOPICS } from '../config'
import type { Flight } from '../game/flight'
import { addedParts, isViable, odds as oddsOf, statusOf } from '../game/rules'
import { LAUNCH_AT } from '../game/time'
import { useGame, useGodMode, useNow, useReducedMotion } from '../hooks/hooks'
import { store } from '../store/store'
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
function useFit() {
  const [fit, setFit] = useState({ scale: 1, width: DESIGN_W, compact: false })
  useLayoutEffect(() => {
    const update = () => {
      const scale = Math.min(innerWidth / DESIGN_W, innerHeight / DESIGN_H)
      const compact = scale < MIN_SCALE
      setFit(compact ? { scale: 1, width: innerWidth, compact } : { scale, width: innerWidth / scale, compact })
      document.body.classList.toggle('compact', compact)
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
      onToggle: godMode ? () => store.setGoNoGo(!game.goNoGo) : undefined,
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
      store.reset()
      onReturn()
    }
  }

  const buttonMode = locked ? 'locked' : inFlight ? 'busy' : launched ? 'return' : 'ready'

  return (
    <div
      className={`${s.board} ${fit.compact ? s.compact : ''}`}
      style={fit.compact ? undefined : { width: fit.width, transform: `scale(${fit.scale})` }}
    >
      <TopBar now={now} status={status} godMode={godMode} onReset={reset} />
      <main className={s.main}>
        <div className={s.side}>
          <div className={s.grow}><Checklist locked={inFlight} /></div>
          <div className={s.conditions}><LaunchConditions now={now} drift={!reducedMotion} /></div>
        </div>
        <div className={s.centre}>
          <CameraViewport now={now} flight={flight} layers={added.length} />
          <div className={s.deckRow}>
            <ControlDeck odds={odds} parts={added.length} total={TOPICS.length} reducedMotion={reducedMotion} />
            <LaunchSequence steps={steps} />
          </div>
          <LaunchButton mode={buttonMode} onClick={launched ? onReturn : onLaunch} />
        </div>
        <div className={s.side}>
          <div className={s.status}><SystemStatus /></div>
          <div className={s.grow}><TrajectoryMap flight={flight} reducedMotion={reducedMotion} /></div>
          <div className={s.comms}><Communications reducedMotion={reducedMotion} /></div>
        </div>
      </main>
    </div>
  )
}
