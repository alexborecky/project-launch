import { Board } from './components/Board'
import { IS_DEMO } from './demo/demo'
import { DemoToolbar } from './demo/DemoToolbar'
import { useAudioCues } from './audio/useAudioCues'
import { useLaunch } from './game/useLaunch'
import { useGame } from './hooks/hooks'

export default function App() {
  const { flight, setOverride, launch, returnToPad } = useLaunch()
  useAudioCues(useGame())

  return (
    <>
      <Board flight={flight} onLaunch={launch} onReturn={returnToPad} />
      {IS_DEMO && <DemoToolbar flight={flight} onFlight={(f) => setOverride(f.phase === 'idle' ? null : f)} />}
    </>
  )
}
