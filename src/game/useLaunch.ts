import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/hooks'
import { store } from '../store/store'
import { climbFor, type Flight } from './flight'
import { rollOutcome } from './rules'

const COUNT_MS = 900
const IGNITION_MS = 800
const BOOM_MS = 1300
const EMPTY_SHAKE_MS = 1400
const EMPTY_MESSAGE_MS = 5000

/** Runs a launch from countdown to result. The outcome is rolled at the start. */
export function useLaunch(initial: Flight = { phase: 'idle' }) {
  const [flight, setFlight] = useState<Flight>(initial)
  const reducedMotion = useReducedMotion()
  const run = useRef(0)

  useEffect(() => () => void run.current++, [])

  const launch = useCallback(async () => {
    const id = ++run.current
    const wait = (ms: number) => new Promise<boolean>((r) => setTimeout(() => r(run.current === id), ms))

    const outcome = rollOutcome(store.get().topics)
    if (outcome.kind === 'empty') {
      setFlight({ phase: 'empty' })
      if (!(await wait(EMPTY_SHAKE_MS + EMPTY_MESSAGE_MS))) return
      setFlight({ phase: 'idle' })
      return
    }

    if (!reducedMotion) {
      for (const n of [3, 2, 1]) {
        setFlight({ phase: 'countdown', n, outcome })
        if (!(await wait(COUNT_MS))) return
      }
    }
    setFlight({ phase: 'ignition', outcome })
    if (!(await wait(IGNITION_MS))) return
    setFlight({ phase: 'climb', outcome })
    if (!(await wait(reducedMotion ? 0 : climbFor(outcome).ms))) return
    if (outcome.kind !== 'orbit') {
      setFlight({ phase: 'boom', outcome })
      if (!(await wait(BOOM_MS))) return
    }
    setFlight({ phase: 'result', outcome })
  }, [reducedMotion])

  /** Back to the pad. The parts stay on the rocket. */
  const reset = useCallback(() => {
    run.current++
    setFlight({ phase: 'idle' })
  }, [])

  return { flight, setFlight, launch, reset }
}
