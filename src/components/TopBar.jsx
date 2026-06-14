export default function TopBar({ connected, openTicketCount, onNavigateMaintenance }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="pulse-dot" />
        BOGIE FLOW
      </div>
      <div className="topbar-actions">
        {openTicketCount > 0 && (
          <button
            type="button"
            className="ticket-chip"
            onClick={() => onNavigateMaintenance?.()}
          >
            <span className="material-symbols-outlined">confirmation_number</span>
            {openTicketCount} OPEN TICKET{openTicketCount !== 1 ? 'S' : ''}
          </button>
        )}
        <div className={`system-chip ${connected ? 'nominal' : 'warn'}`}>
          <span className="chip-dot" />
          {connected ? 'SYSTEM_STATUS_NOMINAL' : 'SYSTEM_RECONNECTING'}
        </div>
      </div>
    </header>
  )
}
