const STITCH_MOISTURE_PATH =
  'M0 30 Q 10 20, 20 25 T 40 15 T 60 20 T 80 10 T 100 15'

const SEGMENT_ORDER = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

export function moistureSparklinePath(values) {
  if (!values?.length) {
    return STITCH_MOISTURE_PATH
  }

  const w = 100
  const h = 40
  const step = w / Math.max(values.length - 1, 1)

  const points = values.map((v, i) => {
    const x = i * step
    const y = h - v * h * 0.8 - 4
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  })

  if (points.length === 1) {
    return `M${points[0]} L${w} ${points[0].split(' ')[1]}`
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
  return `${linePath} L 100 40 L 0 40 Z`
}
