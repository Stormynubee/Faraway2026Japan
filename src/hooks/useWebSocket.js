import { useEffect, useRef, useState, useCallback } from 'react'

const WS_URL =
  import.meta.env.DEV
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : 'ws://localhost:8000/ws'

const HISTORY_LIMIT = 24
const SEGMENT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function emptyHistory() {
  return Object.fromEntries(
    SEGMENT_IDS.map((id) => [id, { moisture: [], rainfall: [], vib_z: [] }]),
  )
}

function appendSample(history, segmentId, sample) {
  const next = { ...history }
  const bucket = next[segmentId] ?? { moisture: [], rainfall: [], vib_z: [] }
  const trim = (arr, val) => [...arr, val].slice(-HISTORY_LIMIT)

  next[segmentId] = {
    moisture: sample.soil_moisture != null ? trim(bucket.moisture, sample.soil_moisture) : bucket.moisture,
    rainfall: sample.rainfall != null ? trim(bucket.rainfall, sample.rainfall) : bucket.rainfall,
    vib_z: sample.vib_z != null ? trim(bucket.vib_z, sample.vib_z) : bucket.vib_z,
  }
  return next
}

export function useWebSocket() {
  const [connected, setConnected] = useState(false)
  const [segments, setSegments] = useState([])
  const [train, setTrain] = useState({ segment_id: 'S1', progress: 0 })
  const [tickets, setTickets] = useState([])
  const [logs, setLogs] = useState([])
  const [activeRiskIndex, setActiveRiskIndex] = useState(0)
  const [segmentHistory, setSegmentHistory] = useState(emptyHistory)
  const wsRef = useRef(null)
  const retryRef = useRef(null)

  const recordHistory = useCallback((segmentId, fields) => {
    setSegmentHistory((prev) => appendSample(prev, segmentId, fields))
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => {
      setConnected(false)
      retryRef.current = setTimeout(connect, 2000)
    }
    ws.onerror = () => ws.close()

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      switch (msg.type) {
        case 'state_snapshot': {
          const segs = msg.segments || []
          setSegments(segs)
          setTrain(msg.train || { segment_id: 'S1', progress: 0 })
          setTickets(msg.tickets || [])
          setLogs(msg.logs || [])
          setActiveRiskIndex(msg.active_risk_index ?? 0)
          setSegmentHistory((prev) => {
            let next = { ...prev }
            for (const s of segs) {
              next = appendSample(next, s.id, {
                soil_moisture: s.soil_moisture,
                rainfall: s.rainfall,
                vib_z: s.vib_z ?? 0,
              })
            }
            return next
          })
          break
        }
        case 'segment_update': {
          setSegments((prev) =>
            prev.map((s) => (s.id === msg.id ? { ...s, ...msg } : s)),
          )
          setActiveRiskIndex((prev) => Math.max(prev, msg.risk_index ?? 0))
          recordHistory(msg.id, {
            soil_moisture: msg.soil_moisture,
            rainfall: msg.rainfall,
            vib_z: msg.vib_z,
          })
          break
        }
        case 'telemetry':
          setSegments((prev) =>
            prev.map((s) =>
              s.id === msg.segment
                ? { ...s, az: msg.az, vib_z: msg.z_score }
                : s,
            ),
          )
          recordHistory(msg.segment, {
            vib_z: msg.z_score,
          })
          break
        case 'train_update':
          setTrain({ segment_id: msg.segment_id, progress: msg.progress })
          break
        case 'ticket':
          setTickets((prev) => {
            if (prev.some((t) => t.id === msg.id)) return prev
            return [...prev, msg]
          })
          break
        case 'agent_log':
          setLogs((prev) => [...prev.slice(-49), msg])
          break
        default:
          break
      }
    }
  }, [recordHistory])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return {
    connected,
    segments,
    train,
    tickets,
    logs,
    activeRiskIndex,
    segmentHistory,
  }
}
