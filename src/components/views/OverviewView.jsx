import { lazy, Suspense, useRef } from 'react'
import SegmentHudGrid from '../SegmentHudGrid'
import MetricBar from '../MetricBar'
import ClimatePanel from '../ClimatePanel'
import ControlPanel from '../ControlPanel'
import AnomalyStream from '../AnomalyStream'

const TrackScene = lazy(() => import('../TrackScene'))

export default function OverviewView({
  segments,
  train,
  tickets,
  logs,
  activeRiskIndex,
  segmentHistory,
  onSegmentClick,
}) {
  const sceneRef = useRef(null)

  return (
    <>
      <div className="main-primary">
        <section className="panel corridor-matrix panel-enter">
          <div className="panel-head">
            <h2>
              <span className="material-symbols-outlined panel-icon">ssid_chart</span>
              CORRIDOR RISK MATRIX
            </h2>
            <span className="live-badge">
              LIVE FEED <span className="live-dot text-flicker">●</span>
            </span>
          </div>

          <div className="viewport-toolbar">
            <span className="model-label">
              <span className="model-dot" /> MODEL: CORRIDOR_TRACK
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

          <div className="matrix-viewport">
            <Suspense
              fallback={
                <div className="track-scene bogie-loading">Loading corridor…</div>
              }
            >
              <TrackScene
                ref={sceneRef}
                segments={segments}
                train={train}
                onSegmentClick={onSegmentClick}
              />
            </Suspense>
            <SegmentHudGrid segments={segments} onSegmentClick={onSegmentClick} />
          </div>

          <div className="gauge-row">
            <MetricBar segments={segments} activeRiskIndex={activeRiskIndex} />
          </div>
        </section>

        <ClimatePanel segments={segments} segmentHistory={segmentHistory} />

        <div id="controls-panel" className="panel controls-panel panel-enter">
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
    </>
  )
}
