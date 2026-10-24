import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { TOPICS, type PartId, type Topic } from '../config'
import { addedParts, nextTopicState, type Decision, type TopicAction, type TopicState } from '../game/rules'
import { useGame } from '../hooks/hooks'
import { store } from '../store/store'
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

/** Figma component "HUD/Task Row" (17:348). */
function TaskRow({ index, topic, state, open, disabled, onToggle }: TaskRowProps) {
  const status = state?.status ?? 'waiting'
  const rowRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const confirm = useConfirm()

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !rowRef.current?.contains(e.target as Node)) onToggle(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open, onToggle])

  const act = async (action: TopicAction) => {
    if (action.type === 'remove') {
      onToggle(false)
      const ok = await confirm({
        title: 'Take the part off?',
        message: `“${topic.name}” goes back to Done and its part leaves the rocket.`,
        confirmLabel: 'Remove part',
      })
      rowRef.current?.focus()
      if (!ok) return
    }
    const next = nextTopicState(topic, state, action)
    if (next) store.setTopic(topic.part, next)
    onToggle(false)
    rowRef.current?.focus()
  }

  const onMenuKey = (e: KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      onToggle(false)
      rowRef.current?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      items[(i + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      items[(i - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Tab') {
      onToggle(false)
    }
  }

  const menuId = `task-menu-${topic.part}`

  return (
    <li className={s.item}>
      <button
        ref={rowRef}
        type="button"
        className={`${s.row} ${s[status]} ${open ? s.open : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
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
        <div ref={menuRef} id={menuId} className={s.menu} role="menu" aria-label={`Next step for ${topic.name}`} onKeyDown={onMenuKey}>
          <p className={s.menuTitle}>NEXT STEP</p>
          {status === 'waiting' && <MenuItem onClick={() => act({ type: 'start' })}>Start work</MenuItem>}
          {status === 'progress' && topic.track === 'crunch' && (
            <MenuItem onClick={() => act({ type: 'finish' })}>Mark done</MenuItem>
          )}
          {status === 'progress' && topic.track === 'hack' && (
            <>
              <p className={s.menuHint}>Done. What happens next?</p>
              <div className={s.decisions}>
                {DECISIONS.map((d) => (
                  <MenuItem key={d.id} chip onClick={() => act({ type: 'finish', decision: d.id })}>
                    {d.label}
                  </MenuItem>
                ))}
              </div>
            </>
          )}
          {status === 'done' && (
            <MenuItem primary onClick={() => act({ type: 'add' })}>Add part to rocket</MenuItem>
          )}
          {status === 'added' && <MenuItem onClick={() => act({ type: 'remove' })}>Remove part…</MenuItem>}
        </div>
      )}
    </li>
  )
}

function MenuItem({ children, onClick, primary, chip }: { children: string; onClick: () => void; primary?: boolean; chip?: boolean }) {
  return (
    <button type="button" role="menuitem" className={`${s.menuItem} ${primary ? s.primary : ''} ${chip ? s.chip : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
