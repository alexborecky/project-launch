import type { ReactNode } from 'react'
import s from './Panel.module.css'

interface PanelProps {
  title: string
  /** Small orange label on the right of the header. */
  badge?: ReactNode
  className?: string
  children: ReactNode
}

export function Panel({ title, badge, className, children }: PanelProps) {
  return (
    <section className={`${s.panel} ${className ?? ''}`} aria-label={title}>
      <header className={s.header}>
        <h2 className={s.title}>{title}</h2>
        {badge != null && <div className={s.badge}>{badge}</div>}
      </header>
      {children}
    </section>
  )
}

/** Figma component "HUD/KV Row" (17:354). */
export function KvRow({ label, value, accent }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className={s.kv}>
      <span className={s.kvLabel}>{label}</span>
      <span className={accent ? s.kvValueAccent : s.kvValue}>{value}</span>
    </div>
  )
}
