import { injectAnomaly, injectMonsoon } from '../lib/api.js'

export default function ControlPanel() {
  const injectMonsoonS4 = () =>
    injectMonsoon('S4', 0.9, 0.85)

  const forceAnomaly = () => injectAnomaly('S4')

  return (
    <div className="controls">
      <button type="button" onClick={injectMonsoonS4}>
        Inject Severe Monsoon on S4
      </button>
      <button type="button" className="secondary" onClick={forceAnomaly}>
        Force Anomaly S4 (diagnostic)
      </button>
    </div>
  )
}
