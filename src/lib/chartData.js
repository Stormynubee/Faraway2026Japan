const STITCH_MOISTURE_PATH =
  'M0 28 Q 10 18, 20 23 T 40 13 T 60 18 T 80 12 T 100 17'

export const SPARKLINE_VIEWBOX = '0 0 100 40'
const SPARK_W = 100
const SPARK_H = 40
const SPARK_PAD_TOP = 8
const SPARK_PAD_BOTTOM = 6
const SPARK_INNER_H = SPARK_H - SPARK_PAD_TOP - SPARK_PAD_BOTTOM

function valueToSparkY(v) {
  const clamped = Math.max(0, Math.min(1, v))
  return SPARK_PAD_TOP + SPARK_INNER_H * (1 - clamped)
}

const SEGMENT_ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

export function moistureSparklinePath(values) {
  if (!values?.length) {
    return STITCH_MOISTURE_PATH
  }

  const step = SPARK_W / Math.max(values.length - 1, 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = valueToSparkY(v)
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })

  if (points.length === 1) {
    return `M${points[0]} L${SPARK_W} ${points[0].split(' ')[1]}`
  }

  return `M${points.join(' L')}`
}

/** Corridor rainfall bars from live segment data (S1–S6). */
export function rainfallBarHeights(segments) {
  const ordered = SEGMENT_ORDER.map(
    (id) => segments.find((s) => s.id === id) ?? { id, rainfall: 0 },
  )

  const heights = ordered.map((s) =>
    Math.round(Math.min(95, Math.max(8, (s.rainfall ?? 0) * 100))),
  )

  const peakIndex = heights.indexOf(Math.max(...heights))

  return { heights, peakIndex, labels: ordered.map((s) => s.id) }
}

/** Soil vs rain correlation for a segment's history or corridor snapshot. */
export function soilRainCorrelationData(segments, segmentHistory, focusId) {
  const history = segmentHistory?.[focusId]
  if (history?.moisture?.length && history?.rainfall?.length) {
    const len = Math.min(history.moisture.length, history.rainfall.length)
    const moisture = history.moisture.slice(-len)
    const rainfall = history.rainfall.slice(-len)
    const heights = rainfall.map((r) => Math.round(Math.min(90, Math.max(10, r * 100))))
    const linePoints = moisture.map((m, i) => Math.round(Math.min(90, Math.max(10, m * 100))))
    const peakIndex = heights.indexOf(Math.max(...heights))
    return { heights, linePoints, peakIndex, labels: moisture.map((_, i) => `T${i + 1}`) }
  }

  const ordered = SEGMENT_ORDER.map(
    (id) => segments.find((s) => s.id === id) ?? { id, rainfall: 0, soil_moisture: 0 },
  )
  const heights = ordered.map((s) => Math.round((s.rainfall ?? 0) * 100))
  const linePoints = ordered.map((s) => Math.round((s.soil_moisture ?? 0) * 100))
  const peakIndex = heights.indexOf(Math.max(...heights))
  return { heights, linePoints, peakIndex, labels: ordered.map((s) => s.id) }
}

export function moistureSparklineFillPath(linePath) {
  return `${linePath} L ${SPARK_W} ${SPARK_H} L 0 ${SPARK_H} Z`
}
