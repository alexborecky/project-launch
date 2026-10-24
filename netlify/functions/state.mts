// GET /api/state?since=<version>: the current game. Anyone can read it.
// If the caller already has the latest version, answers 204 with no body, which keeps polling cheap.
import { readGame } from '../lib/save.mts'
import { gameStore, json } from '../lib/shared.mts'

export default async (req: Request) => {
  const since = Number(new URL(req.url).searchParams.get('since') ?? -1)
  const { state } = await readGame(gameStore())
  if (state.version === since) return new Response(null, { status: 204, headers: { 'x-server-now': String(Date.now()) } })
  return json({ state, serverNow: Date.now() })
}

export const config = { path: '/api/state', method: 'GET' }
