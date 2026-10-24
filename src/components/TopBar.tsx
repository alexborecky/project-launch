import { useEffect, useRef, useState } from 'react'
import { MISSION_ID } from '../config'
import { LAUNCH_AT, formatCountdown } from '../game/time'
import liveDot from '../assets/figma/live-dot.svg'
import s from './TopBar.module.css'

interface TopBarProps {
  now: Date
  status: string
  godMode: boolean
  /** God mode Reset button (asks in a dialog). */
  onReset: () => void
  /** Complete reset, already confirmed in the Mission ID popover. */
  onFullReset: () => void
}

export function TopBar({ now, status, godMode, onReset, onFullReset }: TopBarProps) {
  return (
    <header className={s.bar}>
      <div className={s.brand}>
        <h1 className={s.name}>Project Launch</h1>
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
        <MissionChip onReset={onFullReset} />
        <div className={s.chip} role="timer" aria-label="Time to launch">
          <span className={s.chipLabel}>T-MINUS</span>
          <span className={`${s.chipValue} ${s.accent} ${s.countdown}`}>{formatCountdown(LAUNCH_AT - now.getTime())}</span>
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

/** Mission ID chip. Double-click it to open a small confirm for a complete reset. */
function MissionChip({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancel.current?.focus()
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrap} className={s.missionWrap}>
      <button
        type="button"
        className={`${s.chip} ${s.mission}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-description="Double-click for a complete reset"
        onDoubleClick={() => setOpen(true)}
      >
        <span className={s.chipLabel}>MISSION ID</span>
        <span className={s.chipValue}>{MISSION_ID}</span>
      </button>
      {open && (
        <div className={s.popover} role="dialog" aria-label="Complete reset">
          <p className={s.popTitle}>COMPLETE RESET?</p>
          <p className={s.popText}>All topics go back to Waiting, the rocket is cleared and any launch returns to the pad. This can't be undone.</p>
          <div className={s.popActions}>
            <button ref={cancel} type="button" className={s.popCancel} onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={s.popReset}
              onClick={() => {
                setOpen(false)
                onReset()
              }}
            >
              Reset everything
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
