import { UI } from '../content/uiCopy.js'

const NAV_ITEMS = [
  { id: 'overview', icon: 'dashboard', label: UI.nav.overview },
  { id: 'analysis', icon: 'query_stats', label: UI.nav.analysis },
  { id: 'maintenance', icon: 'build', label: UI.nav.maintenance },
  { id: 'climate', icon: 'thermostat', label: UI.nav.climate },
]

export default function Sidebar({ connected, activeView, onNavigate, onScan }) {
  return (
    <nav className="sidebar sidebar-editorial" aria-label="Main navigation" data-guide="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-brand">{UI.brand.name}</h1>
        <p className="sidebar-sub">{UI.brand.tagline}</p>
      </div>

      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            className={`nav-item ${activeView === id ? 'nav-item-active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button type="button" className="btn-scan" onClick={onScan} title={UI.nav.scanHint}>
          <span className="material-symbols-outlined">radar</span>
          {UI.nav.scan}
        </button>
        <p className={`sidebar-status ${connected ? 'online' : 'offline'}`}>
          {connected ? UI.nav.linkActive : UI.nav.linkReconnecting}
        </p>
      </div>
    </nav>
  )
}
