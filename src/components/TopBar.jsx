export default function TopBar({ connected }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="pulse-dot" />
        BOGIE FLOW
      </div>
      <div className="topbar-actions">
        <div className={`system-chip ${connected ? 'nominal' : 'warn'}`}>
          <span className="chip-dot" />
          {connected ? 'SYSTEM_STATUS_NOMINAL' : 'SYSTEM_RECONNECTING'}
        </div>
      </div>
    </header>
  )
}
