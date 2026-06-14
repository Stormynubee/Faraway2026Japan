import { rainfallBarHeights } from '../../lib/chartData.js'

const DIM_CLASSES = [
  'rain-bar-dim',
  'rain-bar-dim',
  'rain-bar-mid',
  'rain-bar-mid',
  'rain-bar-bright',
  'rain-bar-bright',
]

export default function RainfallBars({ segments }) {
  const { heights, peakIndex } = rainfallBarHeights(segments)

  return (
    <div className="sparkline rain-bars">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`rain-bar ${DIM_CLASSES[i] ?? 'rain-bar-dim'} ${i === peakIndex ? 'rain-peak' : ''}`}
          style={{ height: `${h}%` }}
        >
          {i === peakIndex && <span className="rain-peak-dot" />}
        </div>
      ))}
    </div>
  )
}
