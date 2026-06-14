import { lazy, Suspense } from 'react'
import RiskGauge from './RiskGauge'

const BogieScene = lazy(() => import('./BogieScene'))

function segmentLabel(seg) {
  if (!seg) return '—'
  if (seg.state === 'CRITICAL_MUD_PUMPING') return 'CRITICAL'
  if (seg.state === 'WARNING_WATERLOGGING') return 'VIB_WARN'
  const pct = Math.round((1 - (seg.risk_index ?? 0)) * 100)
  return `OP: ${pct}%`
}

function isCritical(seg) {
  return seg?.state === 'CRITICAL_MUD_PUMPING' || (seg?.risk_index ?? 0) >= 0.7
}

export default function CorridorMatrix({
  segments,
  train,
  activeRiskIndex,
}) {
  const ordered = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(
    (id) => segments.find((s) => s.id === id) || { id },
  )

  return (
    <section className="panel corridor-matrix">
      <div className="panel-head">
        <h2>
          <span className="material-symbols-outlined panel-icon">ssid_chart</span>
          CORRIDOR RISK MATRIX
        </h2>
        <span className="live-badge">
          LIVE FEED <span className="live-dot">●</span>
        </span>
      </div>

      <div className="matrix-viewport">
        <Suspense fallback={<div className="bogie-scene bogie-loading">Loading corridor…</div>}>
          <BogieScene segments={segments} trainSegmentId={train?.segment_id} />
        </Suspense>
        <div className="segment-hud">
          {ordered.map((seg) => (
            <div
              key={seg.id}
              className={`hud-cell ${isCritical(seg) ? 'hud-critical' : ''}`}
            >
              {isCritical(seg) && (
                <span className="material-symbols-outlined hud-warn-icon">
                  warning
                </span>
              )}
              <span className="hud-label">SEGMENT {seg.id.replace('S', '')}</span>
              <span className="hud-value">{segmentLabel(seg)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gauge-row">
        <RiskGauge riskIndex={activeRiskIndex} />
      </div>
    </section>
  )
}
