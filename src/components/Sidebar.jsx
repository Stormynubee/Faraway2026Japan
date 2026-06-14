export default function Sidebar({ connected, onScan }) {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-header">
        <h1 className="sidebar-brand">BF_SYSTEMS</h1>
        <p className="sidebar-sub">V2.4_RAIL_LOG</p>
      </div>

      <div className="sidebar-nav">
        <button type="button" className="nav-item nav-item-active">
          <span className="material-symbols-outlined">dashboard</span>
          OVERVIEW
        </button>
        <button type="button" className="nav-item" disabled>
          <span className="material-symbols-outlined">query_stats</span>
          ANALYSIS
        </button>
        <button type="button" className="nav-item" disabled>
          <span className="material-symbols-outlined">build</span>
          MAINTENANCE
        </button>
        <button type="button" className="nav-item" disabled>
          <span className="material-symbols-outlined">thermostat</span>
          CLIMATE
        </button>
      </div>

      <div className="sidebar-footer">
        <button type="button" className="btn-scan" onClick={onScan}>
          <span className="material-symbols-outlined">radar</span>
          INITIATE SCAN
        </button>
        <p className={`sidebar-status ${connected ? 'online' : 'offline'}`}>
          {connected ? 'LINK ACTIVE' : 'RECONNECTING'}
        </p>
      </div>
    </nav>
  )
}
