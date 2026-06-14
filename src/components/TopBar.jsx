import { UI } from '../content/uiCopy.js'

export default function TopBar({ connected, openTicketCount, onNavigateMaintenance }) {
  return (
    <header className="topbar topbar-editorial">
      <div className="topbar-brand">
        <span className="pulse-dot" />
        {UI.brand.name}
      </div>
      <div className="topbar-actions">
        {openTicketCount > 0 && (
          <button
            type="button"
            className="ticket-chip"
            onClick={() => onNavigateMaintenance?.()}
          >
            <span className="material-symbols-outlined">confirmation_number</span>
            {UI.topbar.tickets(openTicketCount)}
          </button>
        )}
        <div className={`system-chip ${connected ? 'nominal' : 'warn'}`}>
          <span className="chip-dot" />
          {connected ? UI.topbar.connected : UI.topbar.reconnecting}
        </div>
      </div>
    </header>
  )
}
