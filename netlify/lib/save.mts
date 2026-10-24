// Read, apply, save, retry: the heart of the shared save. Kept apart from Netlify so it can be tested.
import { EMPTY_GAME, applyAction, type Action, type ActionResult, type GameData, type Role } from '../../src/game/actions.ts'

/** The two Netlify Blobs calls we use, so a test can pass in a fake. */
export interface BlobLike {
  getWithMetadata(key: string, opts: { type: 'json' }): Promise<{ data: unknown; etag?: string } | null>
  setJSON(key: string, data: unknown, opts?: { onlyIfMatch?: string; onlyIfNew?: boolean }): Promise<{ modified: boolean }>
}

export const KEY = 'state'
const ATTEMPTS = 5

export async function readGame(store: BlobLike): Promise<{ state: GameData; etag?: string; exists: boolean }> {
  const blob = await store.getWithMetadata(KEY, { type: 'json' })
  if (!blob) return { state: EMPTY_GAME, exists: false }
  return { state: { ...EMPTY_GAME, ...(blob.data as Partial<GameData>) }, etag: blob.etag, exists: true }
}

export type SaveResult = ActionResult | { ok: false; status: 503; error: string; busy: true }

// Saves made by this server process go one at a time. That's what protects local testing, where
// there are no etags. On Netlify each process has its own queue and the etag check guards between them.
let queue: Promise<unknown> = Promise.resolve()

export function applyAndSave(
  store: BlobLike,
  action: Action,
  env: { role: Role; now: () => number; random: () => number },
): Promise<SaveResult & { latest?: GameData }> {
  const run = queue.then(() => saveOnce(store, action, env))
  queue = run.catch(() => undefined)
  return run
}

/** One save attempt loop, outside the queue (a second server process behaves like this). */
export async function saveOnce(
  store: BlobLike,
  action: Action,
  env: { role: Role; now: () => number; random: () => number },
): Promise<SaveResult & { latest?: GameData }> {
  for (let i = 0; i < ATTEMPTS; i++) {
    const { state, etag, exists } = await readGame(store)
    const result = applyAction(state, action, { now: env.now(), random: env.random, role: env.role })
    if (!result.ok) return { ...result, latest: state }

    // Save only if nobody else saved since we read. Netlify's local test server sends no
    // version tag (etag), so there we fall back to a plain save; the real service always sends one.
    const write = etag
      ? await store.setJSON(KEY, result.state, { onlyIfMatch: etag })
      : exists
        ? await store.setJSON(KEY, result.state)
        : await store.setJSON(KEY, result.state, { onlyIfNew: true })
    if (write.modified) return result
    // Someone else saved a moment ago: go round again on top of their change.
  }
  return { ok: false, status: 503, error: 'The board is busy. Try again.', busy: true }
}
