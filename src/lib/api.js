export async function postJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function injectMonsoon(segmentId, rainfall = 0.9, soilMoisture = 0.85) {
  return postJson('/api/inject/monsoon', {
    segment_id: segmentId,
    rainfall,
    soil_moisture: soilMoisture,
  })
}

export function injectAnomaly(segmentId) {
  return postJson('/api/inject/anomaly', { segment_id: segmentId })
}
