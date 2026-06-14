export function segmentLabel(seg) {
  if (!seg) return '—'
  if (seg.state === 'CRITICAL_MUD_PUMPING') return 'CRITICAL'
  if (seg.state === 'WARNING_WATERLOGGING') return 'VIB_WARN'
  const pct = Math.round((1 - (seg.risk_index ?? 0)) * 100)
  return `OP: ${pct}%`
}

export function isCritical(seg) {
  return (
    seg?.state === 'CRITICAL_MUD_PUMPING' ||
    (seg?.risk_index ?? 0) >= 0.7
  )
}

export function highestRiskSegment(segments) {
  if (!segments?.length) return null
  return segments.reduce((best, s) =>
    (s.risk_index ?? 0) > (best.risk_index ?? 0) ? s : best,
  )
}

/** Deterministic corridor coordinates from segment id (S1–S6). */
export function segmentCoordinates(segmentId) {
  const segNum = parseInt(segmentId?.replace('S', '') || '1', 10)
  const lat = (45.9281 + segNum * 0.01).toFixed(4)
  const lon = (12.8493 + segNum * 0.008).toFixed(4)
  return { lat, lon }
}

export function computeMetrics(segments, activeRiskIndex, focusSegment = null) {
  const focus =
    focusSegment ??
    highestRiskSegment(segments) ??
    segments[0] ??
    { risk_index: activeRiskIndex ?? 0, vib_z: 0, az: 0.3 }

  const risk = Math.min(1, Math.max(0, focus.risk_index ?? activeRiskIndex ?? 0))
  const vibZ = Math.abs(focus.vib_z ?? 0)
  const az = focus.az ?? 0.3

  return {
    peakAmplitude: Number((az || 0.3 + risk * 0.5).toFixed(2)),
    fatigueIndex: Number((risk * 100).toFixed(1)),
    bearingTemp: Number((38 + risk * 12).toFixed(1)),
    liveFrequency: Number((42 + vibZ * 4).toFixed(1)),
  }
}
