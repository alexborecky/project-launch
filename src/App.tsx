import { Board } from './components/Board'
import { ConfirmProvider } from './components/Confirm'
import { IS_DEMO } from './demo/demo'
import { DemoToolbar } from './demo/DemoToolbar'
import { useLaunch } from './game/useLaunch'

export default function App() {
  const { flight, setFlight, launch, reset } = useLaunch()

  return (
    <ConfirmProvider>
      <Board flight={flight} onLaunch={launch} onReturn={reset} />
      {IS_DEMO && <DemoToolbar flight={flight} onFlight={setFlight} />}
    </ConfirmProvider>
  )
}
