import { lazy, Suspense, useRef, useState } from 'react'
import {
  computeMetrics,
  highestRiskSegment,
  segmentCoordinates,
} from '../../lib/segmentUtils.js'
import { soilRainCorrelationData } from '../../lib/chartData.js'
import MetricBar from '../MetricBar'
import LogEntry from '../LogEntry'

const BogieWheelScene = lazy(() => import('../BogieWheelScene'))

function SoilRainCorrelation({ segments, segmentHistory, focusId }) {
  const { heights, linePoints, peakIndex, labels } = soilRainCorrelationData(
    segments,
    segmentHistory,
    focusId,
  )
  const count = heights.length
  const barW = 200 / count

  return (
    <div className="panel correlation-card">
      <div className="panel-head">
        <h2>
          <span className="material-symbols-outlined panel-icon">water_drop</span>
          SOIL-RAIN CORRELATION
        </h2>
      </div>
      <div className="correlation-chart">
        <svg viewBox="0 0 200 80" className="correlation-svg" preserveAspectRatio="none">
          {heights.map((h, i) => (
            <rect
              key={i}
              x={i * barW + 4}
              y={80 - h * 0.7}
              width={barW - 8}
              height={h * 0.7}
              fill={i === peakIndex ? '#ff5545' : 'rgba(52,53,57,0.8)'}
            />
          ))}
          <polyline
            points={linePoints
              .map((h, i) => `${i * barW + barW / 2},${80 - h * 0.65}`)
              .join(' ')}
            fill="none"
            stroke="#e7bdb7"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        </svg>
        <div className="correlation-labels">
          {labels.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalysisView({
  segments,
  activeRiskIndex,
  logs,
  segmentHistory,
  selectedSegmentId,
  onSelectSegment,
  onNavigateMaintenance,
}) {
  const sceneRef = useRef(null)
  const [deployState, setDeployState] = useState('idle')

  const focus =
    segments.find((s) => s.id === selectedSegmentId) ??
    highestRiskSegment(segments) ??
    { id: 'S3' }

  const metrics = computeMetrics(segments, activeRiskIndex, focus)
  const coords = segmentCoordinates(focus.id)

  const historyEntries = logs.slice(-5).map((log, i) => ({
    key: `hist-${log.timestamp}-${i}`,
    critical: log.message?.includes('CRITICAL') || log.message?.includes('P1'),
    timestamp: log.timestamp,
    node: log.agent,
    title: log.message?.slice(0, 40),
    status: log.message?.includes('CRITICAL') ? 'CRITICAL' : 'NOMINAL',
  }))

  const handleAuthorize = async () => {
    setDeployState('loading')
    try {
      const res = await fetch('/api/inject/anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment_id: focus.id }),
      })
      if (!res.ok) throw new Error('deploy failed')
      setDeployState('done')
      setTimeout(() => {
        setDeployState('idle')
        onNavigateMaintenance?.()
      }, 1200)
    } catch {
      setDeployState('error')
      setTimeout(() => setDeployState('idle'), 2000)
    }
  }

  const deployLabel =
    deployState === 'loading'
      ? 'DEPLOYING…'
      : deployState === 'done'
        ? 'DEPLOYED'
        : deployState === 'error'
          ? 'FAILED'
          : 'AUTHORIZE DEPLOYMENT'

  return (
    <div className="analysis-layout">
      <div className="analysis-main">
        <div className="analysis-header">
          <div>
            <p className="analysis-breadcrumb">
              SEGMENT {focus.id} &gt; DEEP DIVE ANALYSIS
            </p>
            <h1 className="analysis-title">Vibration Signature</h1>
            <p className="analysis-sub">
              LIVE FREQUENCY: {metrics.liveFrequency} Hz &nbsp;|&nbsp; Z-SCORE:{' '}
              {(focus.vib_z ?? 0).toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            className={`btn-authorize ${deployState === 'done' ? 'btn-authorize-done' : ''}`}
            onClick={handleAuthorize}
            disabled={deployState === 'loading' || deployState === 'done'}
          >
            <span className="material-symbols-outlined">warning</span>
            {deployLabel}
          </button>
        </div>

        <section className="panel analysis-viewport panel-enter">
          <div className="viewport-toolbar">
            <span className="model-label">
              <span className="model-dot" /> MODEL: BOGIE_AXLE_{focus.id}
            </span>
            <div className="viewport-controls">
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => sceneRef.current?.setZoom(-1)}
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button
                type="button"
                aria-label="Reset view"
                onClick={() => sceneRef.current?.resetView()}
              >
                <span className="material-symbols-outlined">center_focus_strong</span>
              </button>
            </div>
          </div>
          <div className="matrix-viewport analysis-3d">
            <Suspense fallback={<div className="bogie-loading">Loading model…</div>}>
              <BogieWheelScene ref={sceneRef} focusSegment={focus} />
            </Suspense>
          </div>
          <div className="gauge-row">
            <MetricBar
              segments={segments}
              activeRiskIndex={activeRiskIndex}
              focusSegment={focus}
            />
          </div>
          <p className="coords-readout">
            {focus.id}_X: {coords.lat}° N &nbsp; {focus.id}_Y: {coords.lon}° E
          </p>
        </section>

        <div className="segment-picker">
          {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((id) => (
            <button
              key={id}
              type="button"
              className={`seg-pick ${focus.id === id ? 'seg-pick-active' : ''}`}
              onClick={() => onSelectSegment(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="analysis-side">
        <SoilRainCorrelation
          segments={segments}
          segmentHistory={segmentHistory}
          focusId={focus.id}
        />

        <div className="panel historical-card">
          <div className="panel-head">
            <h2>
              <span className="material-symbols-outlined panel-icon">history</span>
              HISTORICAL CONTEXT
            </h2>
          </div>
          <ul className="historical-list">
            {historyEntries.length === 0 && (
              <li className="stream-item stream-muted">No historical logs yet</li>
            )}
            {historyEntries.map((e) => (
              <li key={e.key} className="historical-item">
                <div className="historical-top">
                  <span className="historical-id">LOG_{e.node?.slice(0, 3) ?? '00'}</span>
                  <span
                    className={`status-pill ${e.critical ? 'status-critical' : 'status-nominal'}`}
                  >
                    {e.status}
                  </span>
                </div>
                <p className="historical-msg">{e.title}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
