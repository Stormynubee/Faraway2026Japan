import { useState } from 'react'
import { injectAnomaly, injectMonsoon } from '../lib/api.js'
import { UI } from '../content/uiCopy.js'

/** Live injection controls only — navigation lives in Corridor brief. */
export default function OverviewOpsStrip({ train, connected, onNavigate }) {
  const [busy, setBusy] = useState(null)
  const [toast, setToast] = useState('')

  const trainSeg = train?.segment_id

  const run = async (key, fn) => {
    setBusy(key)
    setToast('')
    try {
      await fn()
      setToast(UI.simulation.sent)
      setTimeout(() => setToast(''), 2000)
    } catch {
      setToast(UI.simulation.offline)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section
      className="panel panel-calm overview-ops-strip"
      id="controls-panel"
      data-guide="simulation-inject"
    >
      <div className="panel-head panel-head-calm panel-head-compact">
        <div>
          <h2 className="panel-title-calm">{UI.simulation.title}</h2>
          <p className="panel-sub-calm">{UI.simulation.sub}</p>
        </div>
        <span className={`ops-link-pill ${connected ? 'ops-link-ok' : 'ops-link-off'}`}>
          {connected ? UI.simulation.apiReady : UI.simulation.apiOffline}
        </span>
      </div>

      <div className="overview-ops-body">
        <div className="overview-inject-row">
          <button
            type="button"
            className="overview-inject-btn"
            disabled={!connected || busy === 'monsoon'}
            title={UI.simulation.monsoonHint}
            onClick={() => run('monsoon', () => injectMonsoon('S4', 0.9, 0.85))}
          >
            {UI.simulation.monsoon}
          </button>
          <button
            type="button"
            className="overview-inject-btn overview-inject-secondary"
            disabled={!connected || busy === 'anomaly'}
            title={UI.simulation.anomalyHint}
            onClick={() => run('anomaly', () => injectAnomaly('S4'))}
          >
            {UI.simulation.anomaly}
          </button>
          {trainSeg && (
            <button
              type="button"
              className="overview-inject-btn overview-inject-secondary"
              disabled={!connected || busy === 'train'}
              title={UI.simulation.stressHint}
              onClick={() => run('train', () => injectMonsoon(trainSeg))}
            >
              {UI.simulation.stress(trainSeg)}
            </button>
          )}
        </div>

        <button
          type="button"
          className="briefing-action briefing-action-inline"
          onClick={() => onNavigate?.('climate')}
        >
          {UI.simulation.climateLink}
        </button>

        {toast && <p className="overview-ops-toast">{toast}</p>}
      </div>
    </section>
  )
}
