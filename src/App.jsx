import { useWebSocket } from './hooks/useWebSocket'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import CorridorMatrix from './components/CorridorMatrix'
import ClimatePanel from './components/ClimatePanel'
import ControlPanel from './components/ControlPanel'
import AnomalyStream from './components/AnomalyStream'

export default function App() {
  const { connected, segments, train, tickets, logs, activeRiskIndex } =
    useWebSocket()

  const handleScan = async () => {
    try {
      await fetch('/api/inject/monsoon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment_id: 'S4',
          rainfall: 0.9,
          soil_moisture: 0.85,
        }),
      })
    } catch {
      document.getElementById('controls-panel')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="shell">
      <Sidebar connected={connected} onScan={handleScan} />

      <div className="workspace">
        <TopBar connected={connected} />

        <main className="main-grid">
          <div className="main-primary">
            <CorridorMatrix
              segments={segments}
              train={train}
              activeRiskIndex={activeRiskIndex}
            />
            <ClimatePanel segments={segments} />
            <div id="controls-panel" className="panel controls-panel">
              <h2>
                <span className="material-symbols-outlined panel-icon">tune</span>
                INJECTION CONTROLS
              </h2>
              <ControlPanel />
            </div>
          </div>

          <div className="main-secondary">
            <AnomalyStream tickets={tickets} logs={logs} />
          </div>
        </main>

        <footer className="app-footer">
          <span>
            <span className="footer-dot" />
            UPTIME: 99.98% | AGENT: NOMINAL | CORRIDOR: S1–S6
          </span>
          <span className="footer-tagline">
            Others monitor the rail. We monitor the ballast.
          </span>
        </footer>
      </div>
    </div>
  )
}
