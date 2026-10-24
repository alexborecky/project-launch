import { getConditions } from '../ambient/conditions'
import { SYSTEM_STATUS } from '../config'
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

export function SystemStatus() {
  return (
    <Panel title="SYSTEM STATUS" badge="ALL GREEN">
      {SYSTEM_STATUS.map(([label, value]) => (
        <KvRow key={label} label={label} value={value} accent />
      ))}
    </Panel>
  )
}
