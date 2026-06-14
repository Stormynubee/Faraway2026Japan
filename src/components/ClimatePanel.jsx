function avg(segments, key) {
  if (!segments.length) return 0
  return segments.reduce((a, s) => a + (s[key] ?? 0), 0) / segments.length
}

export default function ClimatePanel({ segments }) {
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
        <div className="sparkline moisture-spark" aria-hidden="true" />
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
        <div className="sparkline rain-bars" aria-hidden="true">
          {[20, 40, 30, 60, 80, 50, 90, 30].map((h, i) => (
            <div key={i} className="rain-bar" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
    </section>
  )
}
