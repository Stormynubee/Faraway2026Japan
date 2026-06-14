import MoistureSparkline from './charts/MoistureSparkline'
import RainfallBars from './charts/RainfallBars'

function avg(segments, key) {
  if (!segments.length) return 0
  return segments.reduce((a, s) => a + (s[key] ?? 0), 0) / segments.length
}

export default function ClimatePanel({ segments, segmentHistory }) {
  const moisture = avg(segments, 'soil_moisture') * 100
  const rain = avg(segments, 'rainfall') * 100

  return (
    <section className="climate-grid">
      <div className="panel climate-card">
        <div className="climate-head">
          <div>
            <h3>SOIL MOISTURE (AVG)</h3>
            <div className="climate-value">{moisture.toFixed(1)}%</div>
          </div>
          <span className="material-symbols-outlined climate-icon">water_drop</span>
        </div>
        <MoistureSparkline segments={segments} segmentHistory={segmentHistory} />
      </div>

      <div className="panel climate-card">
        <div className="climate-head">
          <div>
            <h3>PRECIPITATION / 24H</h3>
            <div className="climate-value">
              {rain.toFixed(0)}
              <span className="climate-unit">mm</span>
            </div>
          </div>
          <span className="material-symbols-outlined climate-icon">rainy</span>
        </div>
        <RainfallBars segments={segments} />
      </div>
    </section>
  )
}
