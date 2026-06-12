const POSITIONS = {
  S1: { x: 40, y: 80 },
  S2: { x: 120, y: 80 },
  S3: { x: 200, y: 80 },
  S4: { x: 280, y: 80 },
  S5: { x: 360, y: 80 },
  S6: { x: 440, y: 80 },
}

export default function TrackMap({ segments, train }) {
  const points = Object.values(POSITIONS)
  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ')

  const trainSeg = train?.segment_id || 'S1'
  const trainPos = POSITIONS[trainSeg] || POSITIONS.S1
  const progress = train?.progress ?? 0
  const nextIdx = Object.keys(POSITIONS).indexOf(trainSeg)
  const nextKey = Object.keys(POSITIONS)[Math.min(nextIdx + 1, 5)]
  const nextPos = POSITIONS[nextKey]
  const tx = trainPos.x + (nextPos.x - trainPos.x) * progress
  const ty = trainPos.y + (nextPos.y - trainPos.y) * progress

  return (
    <div className="track-map">
      <svg viewBox="0 0 480 120" role="img" aria-label="Track corridor S1 to S6">
        <polyline
          points={polyline}
          fill="none"
          stroke="#475569"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {segments.map((seg) => {
          const pos = POSITIONS[seg.id]
          if (!pos) return null
          return (
            <g key={seg.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={18}
                fill={seg.color || '#22c55e'}
                stroke="#0f172a"
                strokeWidth={2}
              />
              <text className="segment-label" x={pos.x} y={pos.y + 4}>
                {seg.id}
              </text>
            </g>
          )
        })}
        <circle className="train-dot" cx={tx} cy={ty} r={8} />
      </svg>
    </div>
  )
}
