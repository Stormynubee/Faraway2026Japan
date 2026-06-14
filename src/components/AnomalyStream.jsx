function formatTs(ts) {
  if (!ts) return '[TS:--:--:--.---]'
  const d = new Date(ts * 1000)
  return `[TS:${d.toISOString().slice(11, 19)}.${String(d.getMilliseconds()).padStart(3, '0')}]`
}

export default function AnomalyStream({ tickets, logs }) {
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
      ts: log.timestamp,
      node: log.agent,
      title: log.message?.slice(0, 48) || 'LOG',
      detail: '',
    })),
  ].slice(0, 12)

  return (
    <section className="panel anomaly-stream">
      <div className="panel-head">
        <h2>
          <span className="material-symbols-outlined panel-icon">sensors</span>
          ANOMALY STREAM
        </h2>
        <span className="live-tag">LIVE</span>
      </div>
      <ul className="stream-list">
        {entries.length === 0 && (
          <li className="stream-item stream-muted">Waiting for telemetry…</li>
        )}
        {entries.map((e) => (
          <li
            key={e.key}
            className={`stream-item ${e.critical ? 'stream-critical' : ''}`}
          >
            <div className="stream-meta">
              <span>{formatTs(e.ts)}</span>
              <span>{e.node}</span>
            </div>
            <div className="stream-body">
              <span className="material-symbols-outlined stream-icon">
                {e.critical ? 'warning' : 'info'}
              </span>
              <div>
                <div className="stream-title">{e.title}</div>
                {e.detail && <div className="stream-detail">{e.detail}</div>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
