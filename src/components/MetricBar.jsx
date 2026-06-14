import { computeMetrics } from '../lib/segmentUtils.js'

export default function MetricBar({
  segments,
  activeRiskIndex,
  focusSegment = null,
  highlightPeak = true,
}) {
  const m = computeMetrics(segments, activeRiskIndex, focusSegment)

  return (
    <div className="metric-bar">
      <div className="metric-item">
        <span className="metric-label">PEAK AMPLITUDE</span>
        <span className={`metric-value ${highlightPeak ? 'metric-highlight' : ''}`}>
          {m.peakAmplitude} mm
        </span>
      </div>
      <div className="metric-item">
        <span className="metric-label">FATIGUE INDEX</span>
        <span className="metric-value">{m.fatigueIndex}%</span>
      </div>
      <div className="metric-item">
        <span className="metric-label">BEARING TEMP</span>
        <span className="metric-value">{m.bearingTemp}°C</span>
      </div>
    </div>
  )
}
