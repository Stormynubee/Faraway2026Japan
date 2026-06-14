/**
 * @typedef {Readonly<{
 *   focusId?: string
 *   vibZ?: number
 *   az?: number
 *   riskIndex?: number
 * }>} BogieAnalysisPanelProps
 */

import { CORRIDOR_FRAME_COUNT, corridorFrameUrl } from '../data/corridorFrames.js'

export default function BogieAnalysisPanel({
  focusId = 'S3',
  vibZ = 0,
  az = 0,
  riskIndex = 0,
}) {
  return (
    <div className="bogie-analysis-panel">
      <div className="bogie-analysis-visual">
        <img
          src={corridorFrameUrl(Math.floor(CORRIDOR_FRAME_COUNT / 2))}
          alt={`Corridor cross-section near segment ${focusId}`}
          className="bogie-analysis-img"
        />
      </div>
      <dl className="bogie-analysis-metrics">
        <div>
          <dt>Segment</dt>
          <dd>{focusId}</dd>
        </div>
        <div>
          <dt>vib_z</dt>
          <dd>{vibZ.toFixed(2)}</dd>
        </div>
        <div>
          <dt>az</dt>
          <dd>{az.toFixed(2)}</dd>
        </div>
        <div>
          <dt>risk_index</dt>
          <dd className={riskIndex >= 0.7 ? 'metric-critical' : ''}>
            {riskIndex.toFixed(2)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
