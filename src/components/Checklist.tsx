import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { TOPICS, type PartId, type Topic } from '../config'
import { addedParts, type Decision, type TopicAction, type TopicState } from '../game/rules'
import { useGame } from '../hooks/hooks'
import { useAct } from '../store/useAct'
import { useConfirm } from './Confirm'
import { Panel } from './Panel'
import s from './Checklist.module.css'

const DECISIONS: { id: Decision; label: string }[] = [
  { id: 'kill', label: 'Kill' },
  { id: 'continue', label: 'Continue' },
  { id: 'backlog', label: 'Backlog' },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

function statusText(state: TopicState | undefined): string {
  switch (state?.status ?? 'waiting') {
    case 'waiting': return 'WAITING'
    case 'progress': return '● IN PROGRESS'
    case 'done': return `✓ DONE${state?.decision ? ' · ' + state.decision.toUpperCase() : ''}`
    case 'added': return '✓ PART ADDED'
  }
}

export function Checklist({ locked }: { locked: boolean }) {
  const { topics } = useGame()
  const [openState, setOpen] = useState<PartId | null>(null)
  const open = locked ? null : openState // no menus during a launch
  const ready = addedParts(topics).length

  return (
    <Panel title="PRE-LAUNCH CHECKLIST" badge={`${pad2(ready)} / ${pad2(TOPICS.length)} READY`} className={s.panel}>
      <ol className={s.list}>
        {TOPICS.map((topic, i) => (
          <TaskRow
            key={topic.part}
            index={i + 1}
            topic={topic}
            state={topics[topic.part]}
            open={open === topic.part}
            disabled={locked}
            onToggle={(v) => setOpen(v ? topic.part : null)}
          />
        ))}
      </ol>
    </Panel>
  )
}

interface TaskRowProps {
  index: number
  topic: Topic
  state: TopicState | undefined
  open: boolean
  disabled: boolean
  onToggle: (open: boolean) => void
}

/** Figma component "HUD/Task Row" (17:348), opening as an accordion with the actions for its current state. */
function TaskRow({ index, topic, state, open, disabled, onToggle }: TaskRowProps) {
  const status = state?.status ?? 'waiting'
  const itemRef = useRef<HTMLLIElement>(null)
  const rowRef = useRef<HTMLButtonElement>(null)
  const confirm = useConfirm()
  const save = useAct()

  // Clicking anywhere outside this item closes it. Clicks in the confirm dialog don't count.
  useEffect(() => {
    if (!open) return
    itemRef.current?.scrollIntoView({ block: 'nearest' })
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element
      if (itemRef.current?.contains(target) || target.closest('dialog')) return
      onToggle(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, onToggle])

  // Actions keep the item open, so the next step is right there.
  const act = async (action: TopicAction) => {
    if (action.type === 'remove') {
      const ok = await confirm({
        title: 'Take the part off?',
        message: `“${topic.name}” goes back to Done and its part leaves the rocket.`,
        confirmLabel: 'Remove part',
      })
      if (!ok) return
    }
    await save({ type: 'topic', part: topic.part, step: action })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.preventDefault()
      onToggle(false)
      rowRef.current?.focus()
    }
  }

  const panelId = `task-panel-${topic.part}`

  return (
    <li ref={itemRef} className={`${s.item} ${open ? s.itemOpen : ''}`} onKeyDown={onKeyDown}>
      <button
        ref={rowRef}
        type="button"
        className={`${s.row} ${s[status]} ${open ? s.open : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => onToggle(!open)}
      >
        <span className={s.bar} aria-hidden="true" />
        <span className={s.index}>{pad2(index)}</span>
        <span className={s.label}>{topic.name}</span>
        <span className={s.status}>{statusText(state)}</span>
        <span className={s.chevron} aria-hidden="true">›</span>
      </button>

      {open && (
        <div id={panelId} className={s.panelBody} role="group" aria-label={`Actions for ${topic.name}`}>
          {status === 'waiting' && <Action onClick={() => act({ type: 'start' })}>Start work</Action>}
          {status === 'progress' && topic.track === 'crunch' && <Action primary onClick={() => act({ type: 'finish' })}>Mark done</Action>}
          {status === 'progress' && topic.track === 'hack' && (
            <>
              <p className={s.hint}>Done? Pick what happens next:</p>
              <div className={s.actions}>
                {DECISIONS.map((d) => (
                  <Action key={d.id} chip onClick={() => act({ type: 'finish', decision: d.id })}>
                    {d.label}
                  </Action>
                ))}
              </div>
            </>
          )}
          {status === 'done' && <Action primary onClick={() => act({ type: 'add' })}>Add part to rocket</Action>}
          {status === 'added' && (
            <>
              <p className={s.hint}>This part is on the rocket.</p>
              <Action onClick={() => act({ type: 'remove' })}>Remove part…</Action>
            </>
          )}
        </div>
      )}
    </li>
  )
}

function Action({ children, onClick, primary, chip }: { children: string; onClick: () => void; primary?: boolean; chip?: boolean }) {
  return (
    <button type="button" className={`${s.action} ${primary ? s.primary : ''} ${chip ? s.chip : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
