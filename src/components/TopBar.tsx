import { MISSION_ID } from '../config'
import { LAUNCH_AT, formatCountdown } from '../game/time'
import liveDot from '../assets/figma/live-dot.svg'
import s from './TopBar.module.css'

interface TopBarProps {
  now: Date
  status: string
  godMode: boolean
  onReset: () => void
}

export function TopBar({ now, status, godMode, onReset }: TopBarProps) {
  return (
    <header className={s.bar}>
      <div className={s.brand}>
        <h1 className={s.name}>Project Hack</h1>
        <div className={s.sub}>
          <span>LAUNCH CONTROL SYSTEM</span>
          <span>OPERATIONAL</span>
        </div>
      </div>

      {godMode && (
        <div className={s.god} role="group" aria-label="God mode controls">
          <span className={s.godLabel}>◆ GOD MODE</span>
          <button type="button" className={s.reset} onClick={onReset}>
            RESET
          </button>
        </div>
      )}

      <div className={s.chips}>
        <div className={s.chip}>
          <span className={s.chipLabel}>MISSION ID</span>
          <span className={s.chipValue}>{MISSION_ID}</span>
        </div>
        <div className={s.chip} role="timer" aria-label="Time to launch">
          <span className={s.chipLabel}>T-MINUS</span>
          <span className={`${s.chipValue} ${s.accent}`}>{formatCountdown(LAUNCH_AT - now.getTime())}</span>
        </div>
        <div className={s.chip} role="status">
          <span className={s.chipLabel}>STATUS</span>
          <span className={`${s.chipValue} ${s.accent}`}>{status}</span>
          <img src={liveDot} alt="" className={s.dot} width={18} height={18} />
        </div>
      </div>
    </header>
  )
}
