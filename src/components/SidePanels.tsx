import { getConditions } from '../ambient/conditions'
import { SYSTEM_STATUS } from '../config'
import type { SyncStatus } from '../store/store'
import { KvRow, Panel } from './Panel'

/** `hold`: bad weather (the weather popup is up), so the panel reads NO GO with strong wind. */
export function LaunchConditions({ now, drift, launchAt, hold }: { now: Date; drift: boolean; launchAt: number; hold: boolean }) {
  const c = getConditions(now, drift, launchAt)
  return (
    <Panel title="LAUNCH CONDITIONS" badge={hold ? 'NO GO' : 'GO'}>
      <KvRow label="WIND" value={hold ? `46 km/h  ↗ ${c.windDir}` : `${c.windKmh} km/h  ↗ ${c.windDir}`} accent={hold} />
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
