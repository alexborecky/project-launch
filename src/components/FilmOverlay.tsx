import { LAUNCH_FILM } from '../config'
import type { Flight } from '../game/flight'
import { useReducedMotion } from '../hooks/hooks'
import { LaunchVideo } from './LaunchVideo'
import s from './FilmOverlay.module.css'

/** Phones only fetch the film when it plays, instead of preloading ~28 MB. */
const FILM_PRELOAD = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches ? 'metadata' : 'auto'

/**
 * The short film that opens a launch: the whole window, black around it, no interface on top.
 * It closes by itself when the film ends and the countdown takes over on the board.
 */
export function FilmOverlay({ flight, launchStart }: { flight: Flight; launchStart: number | null }) {
  const reducedMotion = useReducedMotion()
  const showing = flight.phase === 'film'
  return (
    <div className={`${s.overlay} ${showing ? s.on : ''}`} aria-hidden={!showing}>
      <LaunchVideo
        src={LAUNCH_FILM.src}
        active={showing}
        startedAt={flight.phase === 'film' && launchStart != null ? launchStart : null}
        stillAt={10_000}
        durationMs={LAUNCH_FILM.durationMs}
        reducedMotion={reducedMotion}
        preload={FILM_PRELOAD}
        className={s.film}
      />
    </div>
  )
}
