// POST /api/action: apply one step (see src/game/actions.ts) to the shared game.
import type { Action } from '../../src/game/actions.ts'
import { applyAndSave } from '../lib/save.mts'
import { gameStore, json, roleFor } from '../lib/shared.mts'

export default async (req: Request) => {
  const role = roleFor(req)
  if (role === 'misconfigured') {
    return json({ error: 'The server has no codes yet. Set TEAM_CODE and ADMIN_CODE in Netlify.' }, 500)
  }

  let action: Action
  try {
    action = (await req.json()) as Action
  } catch {
    return json({ error: 'Bad request.' }, 400)
  }

  const result = await applyAndSave(gameStore(), action, { role, now: Date.now, random: Math.random })
  if (result.ok) return json({ state: result.state, serverNow: Date.now() })
  const { status, error } = result
  return json({ error, need: 'need' in result ? result.need : undefined, state: result.latest, serverNow: Date.now() }, status)
}

export const config = { path: '/api/action', method: 'POST' }
