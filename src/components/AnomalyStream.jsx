import LogEntry from './LogEntry'
import { UI } from '../content/uiCopy.js'

export default function AnomalyStream({ tickets, logs, animate = false, maxEntries = 12 }) {
  const entries = [
    ...tickets.map((t) => ({
      key: t.id,
      critical: t.priority === 'P1',
      ts: null,
      node: t.segment,
      title: `${t.priority}_${t.reason?.slice(0, 40) || 'TICKET'}`,
      detail: t.model_label ? `MODEL: ${t.model_label}` : '',
    })),
    ...logs.slice(-8).map((log, i) => ({
      key: `log-${log.timestamp}-${i}`,
      critical: log.message?.includes('CRITICAL') || log.message?.includes('P1'),
      timestamp: log.timestamp,
      node: log.agent,
      title: log.message?.slice(0, 48) || 'LOG',
      detail: '',
    })),
  ].slice(0, maxEntries)

  return (
    <section className="panel panel-calm anomaly-stream" data-guide="anomaly-stream">
      <div className="panel-head panel-head-calm">
        <h2 className="panel-title-calm panel-title-with-icon">
          <span className="material-symbols-outlined panel-icon">sensors</span>
          {UI.anomaly.title}
        </h2>
        <span className="scrub-live-pill">
          <span className="scrub-live-dot" aria-hidden="true" /> Live
        </span>
      </div>
      <ul className="stream-list">
        {entries.length === 0 && (
          <li className="stream-item stream-muted">Waiting for telemetry…</li>
        )}
        {entries.map((e, i) => (
          <LogEntry key={e.key} entry={e} animate={animate} index={i} />
        ))}
      </ul>
    </section>
  )
}
