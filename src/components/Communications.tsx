import { useCallback, useRef } from 'react'
import { AUDIO, COMMS } from '../config'
import { pick, playNow, usePlaying } from '../audio/player'
import { useFrame } from '../hooks/hooks'
import { setMuted, useMuted } from '../hooks/muted'
import liveDot from '../assets/figma/live-dot.svg'
import speakerOn from '../assets/figma/speaker.svg'
import speakerOff from '../assets/speaker-off.svg'
import { KvRow, Panel } from './Panel'
import s from './Communications.module.css'

// Bar heights and colours from the Figma waveform (19:448).
const A = 'var(--c-accent)', G = 'var(--c-dim)', W = 'rgba(233, 230, 226, 0.85)'
const BARS: [number, string][] = [
  [7, A], [8, A], [10, A], [11, G], [15, A], [15, W], [19, A], [18, A], [19, A], [18, A], [14, A], [16, G],
  [11, A], [11, A], [9, A], [9, A], [9, G], [11, A], [14, A], [15, W], [20, A], [20, G], [25, G], [31, A],
  [35, A], [39, W], [27, A], [31, A], [22, A], [28, W], [26, A], [17, A], [14, G], [11, A], [9, A], [10, A],
  [9, W], [13, G], [17, G], [19, W], [21, A], [21, A], [22, A], [29, W], [23, G], [19, A], [25, A], [17, G],
  [18, G], [16, A], [12, W], [12, A], [8, A], [8, W], [7, G], [7, G], [7, A], [7, A],
]

export function Communications({ reducedMotion }: { reducedMotion: boolean }) {
  const muted = useMuted()
  const speaking = usePlaying()
  const speak = () => playNow(pick(AUDIO.random))
  const bars = useRef<(HTMLSpanElement | null)[]>([])

  const animate = useCallback((t: number) => {
    const env = 0.55 + 0.45 * Math.abs(Math.sin(t / 110))
    bars.current.forEach((el, i) => {
      if (!el) return
      const shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.37 + t / 90))
      const h = 2 + (BARS[i][0] - 2) * env * shape * (0.7 + Math.random() * 0.6)
      el.style.height = `${Math.min(44, h).toFixed(1)}px`
    })
  }, [])

  const live = speaking && !muted
  useFrame(animate, live && !reducedMotion)

  const badge = muted ? 'MUTED' : live ? 'ON AIR' : 'STANDBY'

  return (
    <Panel
      title="COMMUNICATIONS"
      className={s.panel}
      badge={
        <>
          {live && <img src={liveDot} alt="" width={18} height={18} className={s.dot} />}
          <span className={live ? undefined : s.idle}>{badge}</span>
        </>
      }
    >
      {COMMS.map(([label, value]) => (
        <KvRow key={label} label={label} value={value} />
      ))}
      <div className={s.wrap}>
        <div className={s.channel}>
          <button
            type="button"
            className={`${s.toggle} ${muted ? s.toggleOff : ''}`}
            aria-pressed={!muted}
            aria-label={muted ? 'Unmute voice transmissions' : 'Mute voice transmissions'}
            onClick={() => setMuted(!muted)}
          >
            <img src={muted ? speakerOff : speakerOn} alt="" width={16} height={16} />
          </button>
          <button type="button" className={s.wave} aria-label="Play transmission now" onClick={speak} disabled={muted}>
            {BARS.map(([h, color], i) => (
              <span
                key={i}
                ref={(el) => {
                  bars.current[i] = el
                }}
                className={s.bar}
                style={{ background: color, height: live ? (reducedMotion ? h : 2) : 2 }}
              />
            ))}
          </button>
        </div>
      </div>
    </Panel>
  )
}
