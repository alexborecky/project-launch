import { useCallback, useEffect, useState } from 'react'
import { useGame } from '../hooks/hooks'
import { store } from '../store/store'
import { useAct } from '../store/useAct'
import { addedParts } from './rules'
import type { Flight } from './flight'
import { flightAt, phases } from './timeline'

const EMPTY_MESSAGE_MS = 6400

/**
 * The launch on screen. A launch is a shared record with a start time (see actions.ts), and every screen
 * works out the same countdown, climb and result from it. Rolled once, on the server or in this browser.
 */
export function useLaunch() {
  const game = useGame()
  const act = useAct()
  const [clock, setClock] = useState(() => ({ server: store.serverNow(), perf: performance.now() }))
  // A flight shown without a saved launch (the empty-pad shake, demo stills). Dropped by the next saved change.
  const [override, setOverrideState] = useState<{ flight: Flight; version: number } | null>(null)

  const launchRecord = game.launch
  useEffect(() => {
    if (!launchRecord) return
    const end = launchRecord.at + phases(launchRecord).resultAt + 200
    const tick = () => setClock({ server: store.serverNow(), perf: performance.now() })
    const id = setInterval(() => {
      tick()
      if (store.serverNow() > end) clearInterval(id)
    }, 50)
    return () => clearInterval(id)
  }, [launchRecord])

  const live = override && override.version === game.version ? override.flight : null
  const flight = live ?? flightAt(launchRecord, clock.server, clock.perf)

  const setOverride = useCallback((f: Flight | null) => setOverrideState(f ? { flight: f, version: store.get().version } : null), [])

  const launch = useCallback(async () => {
    if (addedParts(store.get().topics).length === 0) {
      setOverride({ phase: 'empty' })
      setTimeout(() => setOverrideState((o) => (o?.flight.phase === 'empty' ? null : o)), EMPTY_MESSAGE_MS)
      return
    }
    setOverride(null)
    await act({ type: 'launch' })
  }, [act, setOverride])

  /** Back to the pad. The parts stay on the rocket. */
  const returnToPad = useCallback(async () => {
    setOverride(null)
    if (store.get().launch) await act({ type: 'return' })
  }, [act, setOverride])

  return { flight, setOverride, launch, returnToPad }
}
