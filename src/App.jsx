import { useWebSocket } from './hooks/useWebSocket'
import TrackMap from './components/TrackMap'
import RiskGauge from './components/RiskGauge'
import ControlPanel from './components/ControlPanel'
import MaintenanceQueue from './components/MaintenanceQueue'

export default function App() {
  const { connected, segments, train, tickets, logs, activeRiskIndex } =
    useWebSocket()

  return (
    <div className="app">
      <header className="app-header">
        <h1>RailTwin-X Lite</h1>
        <p className="tagline">Others monitor the rail. We monitor the ballast.</p>
        <p className={`status ${connected ? 'connected' : 'disconnected'}`}>
          WebSocket: {connected ? 'connected' : 'reconnecting…'}
        </p>
      </header>

      <div className="grid">
        <div>
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <h2>Corridor map (S1–S6)</h2>
            <TrackMap segments={segments} train={train} />
          </div>
          <div className="panel">
            <h2>Controls</h2>
            <ControlPanel />
          </div>
        </div>

        <div>
          <div className="panel" style={{ marginBottom: '1rem' }}>
            <h2>Live risk gauge</h2>
            <RiskGauge riskIndex={activeRiskIndex} />
          </div>
          <MaintenanceQueue tickets={tickets} logs={logs} />
        </div>
      </div>
    </div>
  )
}
