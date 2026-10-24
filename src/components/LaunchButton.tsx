import lock from '../assets/figma/button-lock.svg'
import s from './LaunchButton.module.css'

interface LaunchButtonProps {
  mode: 'locked' | 'ready' | 'busy' | 'return'
  onClick: () => void
}

export function LaunchButton({ mode, onClick }: LaunchButtonProps) {
  const label = mode === 'return' ? 'RETURN TO PAD' : 'LAUNCH ROCKET'
  return (
    <button
      type="button"
      className={`${s.button} ${s[mode]}`}
      disabled={mode === 'locked' || mode === 'busy'}
      onClick={onClick}
      aria-describedby={mode === 'locked' ? 'launch-lock-note' : undefined}
    >
      {mode === 'locked' && <img src={lock} alt="" width={14} height={14} />}
      <span>{label}</span>
      {mode === 'locked' && (
        <span id="launch-lock-note" className="sr-only">
          Locked until Tuesday 27 October, 17:00 Prague time
        </span>
      )}
    </button>
  )
}
