import { describe, expect, it } from 'vitest'
import { applyAndSave, readGame, saveOnce, type BlobLike } from './save.mts'

/** Behaves like Netlify Blobs: every write gets a new etag, conditional writes check it. */
function fakeStore(opts: { etags?: boolean; interfere?: (store: BlobLike) => Promise<void> } = {}) {
  let value: unknown = null
  let etag = 0
  let interfering = false
  const store: BlobLike = {
    async getWithMetadata() {
      if (value == null) return null
      const read = { data: structuredClone(value), etag: opts.etags === false ? undefined : `"${etag}"` }
      // Simulate someone else saving right after we read.
      if (opts.interfere && !interfering) {
        interfering = true
        await opts.interfere(store)
      }
      return read
    },
    async setJSON(_key, data, o) {
      if (o?.onlyIfNew && value != null) return { modified: false }
      if (o?.onlyIfMatch && o.onlyIfMatch !== `"${etag}"`) return { modified: false }
      value = structuredClone(data)
      etag++
      return { modified: true }
    },
  }
  return store
}

const env = { role: 'team' as const, now: () => 1, random: () => 0.5 }
const start = (part: 'engine' | 'tank') => ({ type: 'topic' as const, part, step: { type: 'start' as const } })

describe('applyAndSave', () => {
  it('saves one change after another', async () => {
    const store = fakeStore()
    await applyAndSave(store, start('engine'), env)
    await applyAndSave(store, start('tank'), env)
    const { state } = await readGame(store)
    expect(state.version).toBe(2)
    expect(Object.keys(state.topics)).toEqual(['engine', 'tank'])
  })

  it('keeps both changes when someone else saves in between', async () => {
    const store = fakeStore({
      // Another Netlify process saving at the same moment (it has its own queue).
      interfere: async (s) => {
        await saveOnce(s, start('tank'), env)
      },
    })
    await applyAndSave(store, start('engine'), env) // first write: creates the record
    await applyAndSave(store, { type: 'topic', part: 'engine', step: { type: 'finish' } }, env) // tank sneaks in here
    const { state } = await readGame(store)
    expect(state.topics).toEqual({ engine: { status: 'done' }, tank: { status: 'progress' } })
  })

  it('works on the local test server, which sends no etags', async () => {
    const store = fakeStore({ etags: false })
    await applyAndSave(store, start('engine'), env)
    const r = await applyAndSave(store, start('tank'), env)
    expect(r.ok).toBe(true)
  })

  it('passes rule errors through with the latest state', async () => {
    const store = fakeStore()
    await applyAndSave(store, start('engine'), env)
    const r = await applyAndSave(store, start('engine'), env)
    expect(r).toMatchObject({ ok: false, status: 409, latest: { version: 1 } })
  })
})
