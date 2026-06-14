import { motion } from 'framer-motion'
import { segmentLabel, isCritical } from '../lib/segmentUtils.js'

function severityClass(seg) {
  if (seg?.state === 'CRITICAL_MUD_PUMPING') return 'hud-critical severity-critical'
  if (isCritical(seg)) return 'hud-critical'
  return ''
}

function stripStatusLabel(seg) {
  if (seg?.state === 'CRITICAL_MUD_PUMPING') return 'CRITICAL'
  if (seg?.state === 'WARNING_WATERLOGGING') return 'VIB WARN'
  const pct = Math.round((1 - (seg?.risk_index ?? 0)) * 100)
  return `OP ${pct}%`
}

export default function SegmentHudGrid({
  segments,
  onSegmentClick,
  variant = 'grid',
  animate = false,
}) {
  const ordered = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map(
    (id) => segments.find((s) => s.id === id) || { id },
  )

  const isStrip = variant === 'strip'
  const CellTag = animate && isStrip ? motion.button : 'button'

  return (
    <div className={`segment-hud ${isStrip ? 'segment-strip' : ''}`}>
      {ordered.map((seg, i) => (
        <CellTag
          key={seg.id}
          type="button"
          className={`hud-cell ${severityClass(seg)}`}
          onClick={() => onSegmentClick?.(seg.id)}
          {...(animate && isStrip
            ? {
                initial: { opacity: 0, x: -8 },
                animate: { opacity: 1, x: 0 },
                transition: {
                  delay: 0.16 + i * 0.04,
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                },
              }
            : {})}
        >
          {isCritical(seg) && (
            <span className="hud-warn-badge">
              <span className="material-symbols-outlined">warning</span>
            </span>
          )}
          {isStrip ? (
            <>
              <span className="hud-seg-id">{seg.id}</span>
              <span className="hud-seg-metric">{stripStatusLabel(seg)}</span>
            </>
          ) : (
            <>
              <span className="hud-label">Segment {seg.id.replace('S', '')}</span>
              <span className="hud-value">{segmentLabel(seg)}</span>
            </>
          )}
        </CellTag>
      ))}
    </div>
  )
}
