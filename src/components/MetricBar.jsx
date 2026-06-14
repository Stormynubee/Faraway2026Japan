import { motion } from 'framer-motion'
import { computeMetrics } from '../lib/segmentUtils.js'
import { UI } from '../content/uiCopy.js'

export default function MetricBar({
  segments,
  activeRiskIndex,
  focusSegment = null,
  highlightPeak = true,
  variant = 'bar',
  animate = false,
}) {
  const m = computeMetrics(segments, activeRiskIndex, focusSegment)
  const isStrip = variant === 'strip'

  const items = [
    {
      key: 'peak',
      label: isStrip ? UI.metrics.peak : UI.metrics.peakTech,
      value: `${m.peakAmplitude} mm`,
      highlight: highlightPeak,
    },
    {
      key: 'fatigue',
      label: isStrip ? UI.metrics.fatigue : UI.metrics.fatigueTech,
      value: `${m.fatigueIndex}%`,
      highlight: false,
    },
    {
      key: 'temp',
      label: isStrip ? UI.metrics.bearing : UI.metrics.bearingTech,
      value: `${m.bearingTemp}°C`,
      highlight: false,
    },
  ]

  return (
    <div className={`metric-bar ${isStrip ? 'metric-strip gauge-row-strip' : ''}`}>
      {items.map((item, i) => {
        const content = (
          <>
            <span className="metric-label">{item.label}</span>
            <motion.span
              key={item.value}
              className={`metric-value ${item.highlight ? 'metric-highlight' : ''}`}
              initial={animate && isStrip ? { scale: 0.96 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {item.value}
            </motion.span>
          </>
        )

        if (animate && isStrip) {
          return (
            <motion.div
              key={item.key}
              className="metric-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.32 + i * 0.02, duration: 0.35 }}
            >
              {content}
            </motion.div>
          )
        }

        return (
          <div key={item.key} className="metric-item">
            {content}
          </div>
        )
      })}
    </div>
  )
}
