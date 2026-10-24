import { describe, expect, it } from 'vitest'
import { EMPTY_GAME, applyAction, type Action, type GameData, type Role } from './actions'

const env = (role: Role = 'admin', random = () => 0.1) => ({ now: 1000, random, role })
const run = (state: GameData, actions: Action[], role: Role = 'admin') =>
  actions.reduce((s, a) => {
    const r = applyAction(s, a, env(role))
    if (!r.ok) throw new Error(r.error)
    return r.state
  }, state)

describe('applyAction', () => {
  it('moves a topic through its steps and counts versions', () => {
    const s = run(EMPTY_GAME, [
      { type: 'topic', part: 'engine', step: { type: 'start' } },
      { type: 'topic', part: 'engine', step: { type: 'finish' } },
      { type: 'topic', part: 'engine', step: { type: 'add' } },
    ], 'team')
    expect(s.topics.engine).toEqual({ status: 'added' })
    expect(s.version).toBe(3)
  })

  it('keeps changes from two people on different topics', () => {
    const a = run(EMPTY_GAME, [{ type: 'topic', part: 'engine', step: { type: 'start' } }], 'team')
    const b = run(a, [{ type: 'topic', part: 'tank', step: { type: 'start' } }], 'team')
    expect(Object.keys(b.topics)).toEqual(['engine', 'tank'])
  })

  it('rejects a step that is no longer possible', () => {
    const s = run(EMPTY_GAME, [{ type: 'topic', part: 'engine', step: { type: 'start' } }], 'team')
    const r = applyAction(s, { type: 'topic', part: 'engine', step: { type: 'start' } }, env('team'))
    expect(r).toMatchObject({ ok: false, status: 409 })
  })

  it('checks codes', () => {
    expect(applyAction(EMPTY_GAME, { type: 'topic', part: 'engine', step: { type: 'start' } }, env('viewer'))).toMatchObject({ ok: false, need: 'team' })
    expect(applyAction(EMPTY_GAME, { type: 'reset' }, env('team'))).toMatchObject({ ok: false, need: 'admin' })
  })

  it('rolls the launch once and refuses a second launch until return', () => {
    const built = run(EMPTY_GAME, [{ type: 'setTopics', topics: { engine: { status: 'added' }, tank: { status: 'added' } } }])
    const r = applyAction(built, { type: 'launch' }, env())
    expect(r.ok && r.state.launch).toMatchObject({ at: 1000, outcome: { kind: 'pad' } })
    if (!r.ok) return
    expect(applyAction(r.state, { type: 'launch' }, env())).toMatchObject({ ok: false, status: 409 })
    const back = run(r.state, [{ type: 'return' }])
    expect(back.launch).toBeNull()
    expect(back.topics.engine).toEqual({ status: 'added' })
  })

  it('will not launch an empty pad', () => {
    expect(applyAction(EMPTY_GAME, { type: 'launch' }, env())).toMatchObject({ ok: false, status: 400 })
  })

  it('reset clears everything', () => {
    const s = run(EMPTY_GAME, [{ type: 'setTopics', topics: { engine: { status: 'added' } } }, { type: 'goNoGo', value: true }, { type: 'reset' }])
    expect(s).toMatchObject({ topics: {}, goNoGo: false, launch: null })
  })
})
