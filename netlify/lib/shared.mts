// Shared helpers for the Netlify functions. Not a function itself (it lives outside netlify/functions).
import { getStore } from '@netlify/blobs'
import type { Role } from '../../src/game/actions.ts'
import type { BlobLike } from './save.mts'

/** One record holds the whole game. Strong consistency: every read sees the latest write. */
export const gameStore = () => getStore({ name: 'project-sofa-launch', consistency: 'strong' }) as unknown as BlobLike

/** Which code the request carries. Codes live in Netlify environment variables, never in the app. */
export function roleFor(req: Request): Role | 'misconfigured' {
  const team = process.env.TEAM_CODE
  const admin = process.env.ADMIN_CODE
  if (!team || !admin) return 'misconfigured'
  const code = req.headers.get('x-team-code') ?? ''
  if (code === admin) return 'admin'
  if (code === team) return 'team'
  return 'viewer'
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
