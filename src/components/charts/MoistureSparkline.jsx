import {
  moistureSparklinePath,
  moistureSparklineFillPath,
  SPARKLINE_VIEWBOX,
} from '../../lib/chartData.js'
import { highestRiskSegment } from '../../lib/segmentUtils.js'

export default function MoistureSparkline({ segments, segmentHistory }) {
  const focusId =
    highestRiskSegment(segments)?.id ?? segments[0]?.id ?? 'S1'
  const history = segmentHistory?.[focusId]?.moisture

  const values =
    history?.length > 1
      ? history
      : segments.length > 0
        ? segments.map((s) => s.soil_moisture ?? 0)
        : []

  const linePath = moistureSparklinePath(values)
  const fillPath = moistureSparklineFillPath(linePath)

  return (
    <div className="sparkline moisture-spark">
      <svg
        className="sparkline-svg"
        preserveAspectRatio="none"
        viewBox={SPARKLINE_VIEWBOX}
        aria-hidden="true"
      >
        <path d={fillPath} fill="rgba(231,189,183,0.05)" />
        <path
          d={linePath}
          fill="none"
          stroke="#e7bdb7"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
