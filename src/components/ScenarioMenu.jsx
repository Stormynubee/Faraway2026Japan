import { useState } from 'react'
import PanelHeader from './PanelHeader'
import { DEMO_SCENARIOS, runScenario } from '../lib/demoScenarios.js'
import { injectAnomaly, injectMonsoon, resetCorridor } from '../lib/api.js'
import { UI } from '../content/uiCopy.js'

const SCENARIO_MENU = [
  { id: 'monsoon-sweep', ...DEMO_SCENARIOS['monsoon-sweep'] },
  { id: 'bearing-fault-s3', ...DEMO_SCENARIOS['bearing-fault-s3'] },
]

export default function ScenarioMenu({
  realConnected,
  onInjectToast,
  localInjectMonsoon,
  localInjectAnomaly,
  localReset,
}) {
  const [busy, setBusy] = useState(null)

  const api = realConnected
    ? { injectMonsoon, injectAnomaly }
    : { injectMonsoon: localInjectMonsoon, injectAnomaly: localInjectAnomaly }

  const run = async (key, fn) => {
    setBusy(key)
    try {
      await fn()
      onInjectToast?.(UI.simulation.sent, 'success')
    } catch {
      onInjectToast?.(UI.simulation.offline, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="panel panel-calm scenario-menu" data-testid="scenario-menu">
      <PanelHeader
        icon="movie"
        title="Scenario replay"
        explainer="Demo inject sequences via existing REST endpoints"
        className="panel-head-compact"
      />
      <div className="scenario-menu-actions">
        {SCENARIO_MENU.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            data-testid={`scenario-${scenario.id}`}
            className="overview-inject-btn overview-inject-secondary"
            disabled={busy != null}
            onClick={() => run(scenario.id, () => runScenario(scenario.id, api))}
          >
            {scenario.label}
          </button>
        ))}
        <button
          type="button"
          data-testid="scenario-reset"
          className="overview-inject-btn"
          disabled={busy != null}
          onClick={() => run('reset', realConnected ? resetCorridor : localReset)}
        >
          Reset corridor
        </button>
      </div>
    </section>
  )
}
