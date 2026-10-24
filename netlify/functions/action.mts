// POST /api/action: apply one step (see src/game/actions.ts) to the shared game.
import type { Action } from '../../src/game/actions.ts'
import { applyAndSave } from '../lib/save.mts'
import { gameStore, json, missingCodes, roleFor } from '../lib/shared.mts'

export default async (req: Request) => {
  const role = roleFor(req)
  if (role === 'misconfigured') {
    const missing = missingCodes().join(' and ')
    return json(
      {
        error: `The server can't see ${missing}. In Netlify, check the name is spelled exactly like that, its scopes include Functions, and it applies to Production. Then trigger a new deploy.`,
      },
      500,
    )
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
