// When the weather hold is on. Pure, so it can be tested without a browser.
import { scheduledLaunchAt, type GameData } from '../game/actions'

/** The popup appears this long before the scheduled launch time. */
export const WEATHER_WARNING_MS = 60_000

/**
 * Is the weather hold on? Either turned on by hand (god mode, shared with every screen), or
 * automatically in the last minute before the scheduled launch time. Never during a launch.
 */
export function weatherHoldActive(game: GameData, serverNow: number) {
  if (game.launch) return false
  const at = scheduledLaunchAt(game)
  return !!game.weatherHold || (serverNow >= at - WEATHER_WARNING_MS && serverNow < at)
}
