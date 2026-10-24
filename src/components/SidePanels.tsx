import { getConditions } from '../ambient/conditions'
import { SYSTEM_STATUS } from '../config'
import type { SyncStatus } from '../store/store'
import { KvRow, Panel } from './Panel'

export function LaunchConditions({ now, drift }: { now: Date; drift: boolean }) {
  const c = getConditions(now, drift)
  return (
    <Panel title="LAUNCH CONDITIONS" badge="GO">
      <KvRow label="WIND" value={`${c.windKmh} km/h  ↗ ${c.windDir}`} />
      <KvRow label="TEMP" value={`${c.tempC} °C`} />
      <KvRow label="HUMIDITY" value={`${c.humidity} %`} />
      <KvRow label="VISIBILITY" value={c.visibility} />
      <KvRow label="WEATHER WINDOW" value={`OPEN · ${c.window}`} />
    </Panel>
  )
}

const LINK: Record<SyncStatus, string> = {
  local: '256-BIT ENCRYPTED',
  connecting: 'CONNECTING…',
  synced: 'SYNCED',
  offline: 'OFFLINE',
}

/** The LINK row shows whether this screen is in sync with the shared board. */
export function SystemStatus({ link }: { link: SyncStatus }) {
  return (
    <Panel title="SYSTEM STATUS" badge={link === 'offline' ? 'LINK DOWN' : 'ALL GREEN'}>
      {SYSTEM_STATUS.map(([label, value]) => (
        <KvRow key={label} label={label} value={label === 'LINK' ? LINK[link] : value} accent />
      ))}
    </Panel>
  )
}
