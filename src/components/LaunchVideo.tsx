import { useEffect, useRef } from 'react'
import { LAUNCH_VIDEO } from '../config'
import { useMuted } from '../hooks/muted'
import { store } from '../store/store'
import s from './LaunchVideo.module.css'

interface LaunchVideoProps {
  src: string
  /** Is this the clip being shown right now? Both clips stay loaded so the launch starts without a pause. */
  active: boolean
  /** Server time (ms) the clip started. Every screen seeks to the same moment, even if it joins late. */
  startedAt: number | null
  /** For still frames without a live launch (demo toolbar): where in the clip to show, in ms. */
  stillAt: number
  reducedMotion: boolean
  /** Length of this clip, ms. */
  durationMs?: number
  preload?: 'auto' | 'metadata'
}

export function LaunchVideo({ src, active, startedAt, stillAt, reducedMotion, durationMs = LAUNCH_VIDEO.durationMs, preload = 'auto' }: LaunchVideoProps) {
  const video = useRef<HTMLVideoElement>(null)
  const muted = useMuted()

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (!active) {
      v.pause()
      return
    }
    const end = durationMs / 1000 - 0.05
    const elapsed = startedAt == null ? null : (store.serverNow() - startedAt) / 1000
    // Still frame: demo stills, a launch that already ended, or reduced motion.
    if (elapsed == null || elapsed >= end || reducedMotion) {
      v.currentTime = elapsed == null ? stillAt / 1000 : end
      v.pause()
      return
    }
    v.currentTime = Math.max(0, elapsed)
    v.muted = muted
    // Browsers block sound until someone has clicked on the page; then play silently instead.
    v.play().catch(() => {
      v.muted = true
      void v.play().catch(() => undefined)
    })
    // Muting mid-clip is handled below, so `muted` isn't a dependency here.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [active, startedAt, stillAt, reducedMotion, durationMs])

  useEffect(() => {
    if (video.current && muted) video.current.muted = true
  }, [muted])

  return (
    <video
      ref={video}
      className={`${s.video} ${active ? s.on : ''}`}
      src={src}
      preload={preload}
      playsInline
      aria-hidden={!active}
    />
  )
}
