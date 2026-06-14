import LogEntry from '../LogEntry'

export default function MaintenanceView({ tickets, logs }) {
  return (
    <div className="maintenance-layout">
      <section className="panel maintenance-tickets">
        <div className="panel-head">
          <h2>
            <span className="material-symbols-outlined panel-icon">build</span>
            MAINTENANCE TICKETS
          </h2>
          <span className="live-tag">LIVE</span>
        </div>
        <div className="maintenance-table-wrap">
          <table className="maintenance-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>SEGMENT</th>
                <th>PRIORITY</th>
                <th>REASON</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No tickets — system nominal
                  </td>
                </tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="mono">{t.id?.slice(0, 8)}</td>
                  <td>{t.segment}</td>
                  <td>
                    <span
                      className={`status-pill ${t.priority === 'P1' ? 'status-critical' : 'status-nominal'}`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td>{t.reason?.slice(0, 32)}</td>
                  <td>{t.model_label ?? 'OPEN'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="network-logs" className="panel maintenance-logs">
        <div className="panel-head">
          <h2>
            <span className="material-symbols-outlined panel-icon">terminal</span>
            AGENT LOGS
          </h2>
        </div>
        <ul className="stream-list">
          {logs.length === 0 && (
            <li className="stream-item stream-muted">Waiting for agent logs…</li>
          )}
          {logs
            .slice()
            .reverse()
            .slice(0, 20)
            .map((log, i) => (
              <LogEntry
                key={`${log.timestamp}-${i}`}
                entry={{
                  ...log,
                  critical:
                    log.message?.includes('CRITICAL') || log.message?.includes('P1'),
                  title: log.message,
                }}
              />
            ))}
        </ul>
      </section>
    </div>
  )
}
