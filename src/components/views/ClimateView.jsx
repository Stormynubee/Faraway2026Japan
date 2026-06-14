import { highestRiskSegment } from '../../lib/segmentUtils.js'
import PanelHeader from '../PanelHeader'
import DashboardSkeleton from '../DashboardSkeleton'
import PageHeader from '../ink/PageHeader.jsx'
import WeatherToggle from '../WeatherToggle'
import { UI } from '../../content/uiCopy.js'

function avg(segments, key) {
  if (!segments.length) return 0
  return segments.reduce((a, s) => a + (s[key] ?? 0), 0) / segments.length
}

export default function ClimateView({
  segments,
  dataReady,
  weatherStatus,
  realConnected,
  localSetWeatherMode,
}) {
  if (!dataReady) {
    return (
      <div className="climate-layout" data-testid="view-climate">
        <DashboardSkeleton />
      </div>
    )
  }

  const risk = highestRiskSegment(segments)?.risk_index ?? 0.3
  const moisture = avg(segments, 'soil_moisture') * 100

  const assets = [
    { name: 'Bogie Assembly', wear: Math.min(95, 40 + risk * 50), months: Math.max(6, 24 - risk * 16) },
    { name: 'Suspension Unit', wear: Math.min(90, 30 + risk * 45), months: Math.max(8, 28 - risk * 14) },
    { name: 'Brake Pad', wear: Math.min(98, 50 + risk * 40), months: Math.max(4, 18 - risk * 10) },
  ]

  const shifts = segments.map((s) => {
    const segNum = parseInt(s.id?.replace('S', '') || '1', 10)
    const baseline = (46 + segNum * 0.4).toFixed(1)
    const current = (46 + (s.risk_index ?? 0) * 30).toFixed(1)
    const shift = ((s.risk_index ?? 0) * 30).toFixed(1)
    return {
      id: s.id,
      baseline,
      current,
      shift,
      critical: (s.risk_index ?? 0) >= 0.6,
    }
  })

  return (
    <div className="climate-layout" data-guide="climate-main" data-testid="view-climate">
      <PageHeader
        eyebrow="CORRIDOR / ENVIRONMENTAL STRESS"
        title="Climate impact"
        lede="Live precipitation and model-derived wear projections"
        data-testid="climate-page-header"
        className="panel-stagger-1"
      />
      <div className="climate-page-controls panel-stagger-1">
        <WeatherToggle
          liveWeather={weatherStatus?.live_weather}
          weatherNote={weatherStatus?.note}
          realConnected={realConnected}
          localSetWeatherMode={localSetWeatherMode}
        />
      </div>

      <div className="climate-grid-main">
        <section className="panel panel-editorial heatmap-card panel-stagger-2 climate-measured">
          <PanelHeader
            icon="map"
            title="Regional precipitation"
            explainer={UI.climate.heatmapLegend}
            aside={<span className="data-kind-pill data-kind-measured">{UI.climate.measuredLabel}</span>}
          />
          <div className="heatmap-legend" aria-hidden="true">
            <span>Low</span>
            <span className="heatmap-legend-bar" />
            <span>High</span>
          </div>
          <div className="heatmap-grid">
            {segments.slice(0, 6).map((s) => (
              <div
                key={s.id}
                className="heatmap-cell"
                style={{
                  opacity: 0.45 + (s.rainfall ?? 0) * 0.55,
                  boxShadow:
                    (s.risk_index ?? 0) > 0.5
                      ? 'inset 0 0 0 1px var(--signal)'
                      : 'none',
                }}
              >
                <span className="heatmap-label">{s.id}</span>
                <span className="heatmap-value mono">
                  +{Math.round((s.rainfall ?? 0) * 60)}% precip
                </span>
              </div>
            ))}
          </div>
          <p className="heatmap-note mono">
            Avg soil moisture: {moisture.toFixed(1)}% (measured)
          </p>
        </section>

        <section className="panel panel-editorial longevity-card panel-stagger-3 climate-estimated-block">
          <PanelHeader
            icon="schedule"
            title="Asset longevity"
            explainer="Wear projection from corridor risk — not field measured"
            aside={<span className="data-kind-pill data-kind-estimated">{UI.climate.estimatedLabel}</span>}
          />
          <ul className="longevity-list">
            {assets.map((a) => (
              <li key={a.name} className="longevity-item">
                <div className="longevity-head">
                  <span>{a.name}</span>
                  <span className="mono">Est. {a.months} mos</span>
                </div>
                <div className="longevity-track">
                  <div className="longevity-fill" style={{ width: `${a.wear}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {risk >= 0.6 && (
            <p className="longevity-warn">Critical wear — schedule inspection</p>
          )}
        </section>
      </div>

      <section className="panel panel-editorial vibration-table-card panel-stagger-4 climate-estimated-block">
        <PanelHeader
          icon="vibration"
          title="Vibration shift vs baseline"
          explainer="Model-derived Hz shift from segment risk — estimated, not sensor baseline"
          aside={<span className="data-kind-pill data-kind-estimated">{UI.climate.estimatedLabel}</span>}
        />
        <table className="maintenance-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Baseline (Hz, est.)</th>
              <th>Current (Hz, est.)</th>
              <th>Shift Δ (est.)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((row) => (
              <tr key={row.id}>
                <td className="mono">{row.id}</td>
                <td>{row.baseline}</td>
                <td className={row.critical ? 'text-critical' : ''}>{row.current}</td>
                <td className={row.critical ? 'text-critical' : ''}>+{row.shift}</td>
                <td>
                  <span
                    className={`status-pill ${row.critical ? 'status-critical' : 'status-nominal'}`}
                  >
                    {row.critical ? 'CRITICAL_SHIFT' : 'WITHIN_TOLERANCE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
