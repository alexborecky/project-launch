import { Board } from './components/Board'
import { ConfirmProvider } from './components/Confirm'
import { PreviewSwitcher, initialPreviewFlight, isPreview } from './components/Preview'
import { useLaunch } from './game/useLaunch'

export default function App() {
  const preview = isPreview()
  const { flight, setFlight, launch, reset } = useLaunch(preview ? initialPreviewFlight() : undefined)

  return (
    <ConfirmProvider>
      <Board flight={flight} onLaunch={launch} onReturn={reset} />
      {preview && <PreviewSwitcher current={flight} onPick={setFlight} />}
    </ConfirmProvider>
  )
}
