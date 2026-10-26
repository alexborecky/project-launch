import { describe, expect, it } from 'vitest'
import { TOPICS, type PartId } from '../config'
import { isViable, nextTopicState, odds, rollOutcome, type TopicStates } from './rules'

const withAdded = (...parts: PartId[]): TopicStates =>
  Object.fromEntries(parts.map((p) => [p, { status: 'added' as const }]))

const seq = (...values: number[]) => {
  let i = 0
  return () => values[i++ % values.length]
}

const topic = (part: PartId) => TOPICS.find((t) => t.part === part)!

describe('odds', () => {
  it('is 0 with no parts on the rocket', () => {
    expect(odds({})).toBe(0)
  })

  it('counts every added part, even without the engine', () => {
    // the live board on 26 Oct: fins + shield
    expect(odds(withAdded('fins', 'shield'))).toBeCloseTo(0.05 + 0.09 + 0.03)
  })

  it('stays below the 60% a launch needs without the engine', () => {
    const all = TOPICS.map((t) => t.part).filter((p) => p !== 'engine')
    expect(odds(withAdded(...all))).toBe(0.45)
    expect(isViable(withAdded(...all))).toBe(false)
  })

  it('is base + engine weight with only the engine', () => {
    expect(odds(withAdded('engine'))).toBeCloseTo(0.17)
  })

  it('sums weights of added parts only', () => {
    const states: TopicStates = { ...withAdded('engine', 'body'), paint: { status: 'done' } }
    expect(odds(states)).toBeCloseTo(0.05 + 0.12 + 0.16)
  })

  it('caps at 97%', () => {
    expect(odds(withAdded(...TOPICS.map((t) => t.part)))).toBe(0.97)
  })
})

describe('isViable', () => {
  it('needs 4 of 7 core parts', () => {
    // 3 core, but odds high enough: engine .12 + body .16 + paint .16 + all extras .15 = .64
    expect(isViable(withAdded('engine', 'body', 'paint', 'boosterL', 'boosterR', 'antenna', 'shield', 'patch'))).toBe(false)
  })

  it('needs at least 60% odds', () => {
    // 4 core: .05 + .12 + .09 + .09 + .09 = .44
    expect(isViable(withAdded('engine', 'tank', 'fins', 'window'))).toBe(false)
  })

  it('accepts exactly 60%', () => {
    // .05 + .12 + .16 + .09 + .09 + .09 = .60
    expect(isViable(withAdded('engine', 'body', 'tank', 'fins', 'window'))).toBe(true)
  })
})

describe('rollOutcome', () => {
  it('reports an empty pad', () => {
    expect(rollOutcome({}, seq(0)).kind).toBe('empty')
  })

  it('explodes on the pad when not viable, whatever the roll', () => {
    const o = rollOutcome(withAdded('engine', 'tank'), seq(0))
    expect(o.kind).toBe('pad')
    if (o.kind === 'pad') expect(o.altitudeKm).toBeLessThan(0.1)
  })

  const viable = withAdded('engine', 'body', 'paint', 'tank', 'boosterL')

  it('reaches orbit when the roll is below the odds', () => {
    // odds = .05 + .12 + .16 + .16 + .09 + .03 = .61; roll .2 < .61; altitude random 0.5
    const o = rollOutcome(viable, seq(0.2, 0.5))
    expect(o).toEqual({ kind: 'orbit', altitudeKm: 120 + 70 * 1 + 20, parts: 5, extras: 1 })
  })

  it('breaks apart when the roll is at or above the odds', () => {
    const o = rollOutcome(viable, seq(0.9, 0))
    expect(o.kind).toBe('lost')
    if (o.kind === 'lost') {
      expect(o.altitudeKm).toBe(Math.round((80 + 26 * 5) / 9))
      expect(o.odds).toBeCloseTo(0.61)
    }
  })

  it('breaks apart higher with more parts', () => {
    const more = withAdded('engine', 'body', 'paint', 'tank', 'fins', 'window', 'nose')
    const a = rollOutcome(viable, seq(0.99, 0))
    const b = rollOutcome(more, seq(0.99, 0))
    expect(a.kind === 'lost' && b.kind === 'lost' && b.altitudeKm > a.altitudeKm).toBe(true)
  })
})

describe('nextTopicState', () => {
  it('walks a crunch topic through all states', () => {
    const t = topic('engine')
    const a = nextTopicState(t, undefined, { type: 'start' })
    expect(a).toEqual({ status: 'progress' })
    const b = nextTopicState(t, a!, { type: 'finish' })
    expect(b).toEqual({ status: 'done' })
    const c = nextTopicState(t, b!, { type: 'add' })
    expect(c).toEqual({ status: 'added' })
    expect(nextTopicState(t, c!, { type: 'remove' })).toEqual({ status: 'done' })
  })

  it('requires a decision for hack topics, and Kill still earns the part', () => {
    const t = topic('body')
    expect(nextTopicState(t, { status: 'progress' }, { type: 'finish' })).toBeNull()
    const done = nextTopicState(t, { status: 'progress' }, { type: 'finish', decision: 'kill' })
    expect(done).toEqual({ status: 'done', decision: 'kill' })
    expect(nextTopicState(t, done!, { type: 'add' })).toEqual({ status: 'added', decision: 'kill' })
  })

  it('rejects jumps', () => {
    expect(nextTopicState(topic('engine'), undefined, { type: 'add' })).toBeNull()
  })
})
