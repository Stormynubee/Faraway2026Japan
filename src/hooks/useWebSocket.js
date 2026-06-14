import { useEffect, useRef, useState, useCallback } from 'react'

import { wsUrl } from '../lib/config.js'
import { computeActiveRiskIndex, applySegmentUpdate } from '../lib/wsReducer.js'
import { onSocketClose, onSocketOpen } from '../lib/wsReconnect.js'

const HISTORY_LIMIT = 24
const SEGMENT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

const DEFAULT_SEGMENTS = [
  { id: 'S1', risk_index: 0.05, k_effective: 99.2, state: 'HEALTHY', color: '#22c55e', rainfall: 0.05, soil_moisture: 0.20, vib_z: 0.02, az: 0.005 },
  { id: 'S2', risk_index: 0.08, k_effective: 98.5, state: 'HEALTHY', color: '#22c55e', rainfall: 0.08, soil_moisture: 0.22, vib_z: 0.04, az: 0.010 },
  { id: 'S3', risk_index: 0.12, k_effective: 97.0, state: 'HEALTHY', color: '#22c55e', rainfall: 0.12, soil_moisture: 0.25, vib_z: 0.06, az: 0.015 },
  { id: 'S4', risk_index: 0.15, k_effective: 95.5, state: 'HEALTHY', color: '#22c55e', rainfall: 0.15, soil_moisture: 0.28, vib_z: 0.08, az: 0.020 },
  { id: 'S5', risk_index: 0.09, k_effective: 98.1, state: 'HEALTHY', color: '#22c55e', rainfall: 0.09, soil_moisture: 0.21, vib_z: 0.05, az: 0.012 },
  { id: 'S6', risk_index: 0.06, k_effective: 99.0, state: 'HEALTHY', color: '#22c55e', rainfall: 0.06, soil_moisture: 0.19, vib_z: 0.03, az: 0.008 },
];

const DEFAULT_FORECAST = {
  horizon_minutes: 30,
  inspect_next: [],
  segments: [
    { id: 'S1', projected_risk: 0.05, status: 'stable', time_to_critical_min: null, sparkline: [0.05, 0.05, 0.05, 0.05, 0.05] },
    { id: 'S2', projected_risk: 0.08, status: 'stable', time_to_critical_min: null, sparkline: [0.08, 0.08, 0.08, 0.08, 0.08] },
    { id: 'S3', projected_risk: 0.12, status: 'stable', time_to_critical_min: null, sparkline: [0.12, 0.12, 0.12, 0.12, 0.12] },
    { id: 'S4', projected_risk: 0.15, status: 'stable', time_to_critical_min: null, sparkline: [0.15, 0.15, 0.15, 0.15, 0.15] },
    { id: 'S5', projected_risk: 0.09, status: 'stable', time_to_critical_min: null, sparkline: [0.09, 0.09, 0.09, 0.09, 0.09] },
    { id: 'S6', projected_risk: 0.06, status: 'stable', time_to_critical_min: null, sparkline: [0.06, 0.06, 0.06, 0.06, 0.06] },
  ]
};

const DEFAULT_IMPACT = {
  prevented_cost_usd: 12500,
  inspection_hours_saved: 18,
  derailment_reduction_pct: 35,
  assumptions: {
    label: 'estimates',
    formula_cost: 'prevented = $50k×P1 + $15k×P2',
    formula_hours: 'baseline = 24h - risk×segments',
  }
};

function emptyHistory() {
  return Object.fromEntries(
    SEGMENT_IDS.map((id, index) => {
      const moisture = Array.from({ length: HISTORY_LIMIT }, (_, i) => 0.2 + 0.01 * Math.sin((i + index) * 0.5))
      const rainfall = Array.from({ length: HISTORY_LIMIT }, (_, i) => 0.05 + 0.01 * Math.cos((i + index) * 0.5))
      const vib_z = Array.from({ length: HISTORY_LIMIT }, (_, i) => 0.02 + 0.01 * Math.sin((i + index) * 0.3))
      return [id, { moisture, rainfall, vib_z }]
    }),
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
  const [realConnected, setRealConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [segments, setSegments] = useState(DEFAULT_SEGMENTS)
  const [train, setTrain] = useState({ segment_id: 'S1', progress: 0 })
  const [tickets, setTickets] = useState([])
  const [logs, setLogs] = useState([])
  const [activeRiskIndex, setActiveRiskIndex] = useState(0.15)
  const [segmentHistory, setSegmentHistory] = useState(emptyHistory)
  const [lastTickAt, setLastTickAt] = useState(() => Date.now())
  const [forecast, setForecast] = useState(DEFAULT_FORECAST)
  const [impact, setImpact] = useState(DEFAULT_IMPACT)
  const [weatherStatus, setWeatherStatus] = useState({ live_weather: false, source: 'simulation', note: null })
  const wsRef = useRef(null)
  const retryRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const connectRef = useRef(() => {})

  const recordHistory = useCallback((segmentId, fields) => {
    setSegmentHistory((prev) => appendSample(prev, segmentId, fields))
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(wsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      const opened = onSocketOpen()
      reconnectAttemptsRef.current = opened.reconnectAttempts
      setReconnectAttempts(opened.reconnectAttempts)
      setRealConnected(opened.connected)
    }
    ws.onclose = () => {
      const closed = onSocketClose({
        reconnectAttempts: reconnectAttemptsRef.current,
      })
      reconnectAttemptsRef.current = closed.reconnectAttempts
      setReconnectAttempts(closed.reconnectAttempts)
      setRealConnected(closed.connected)
      clearTimeout(retryRef.current)
      retryRef.current = setTimeout(() => connectRef.current(), closed.delayMs)
    }
    ws.onerror = () => ws.close()

    ws.onmessage = (event) => {
      setLastTickAt(Date.now())
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
          setSegments((prev) => {
            const next = applySegmentUpdate(prev, msg)
            setActiveRiskIndex(computeActiveRiskIndex(next))
            return next
          })
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
            const idx = prev.findIndex((t) => t.id === msg.id)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = { ...next[idx], ...msg }
              return next
            }
            return [...prev, msg]
          })
          break
        case 'agent_log':
          setLogs((prev) => [...prev.slice(-49), msg])
          break
        case 'forecast':
          setForecast(msg)
          break
        case 'impact':
          setImpact(msg)
          break
        case 'weather_status':
          setWeatherStatus({
            live_weather: msg.live_weather,
            source: msg.source,
            note: msg.note ?? null,
          })
          break
        default:
          break
      }
    }
  }, [recordHistory])

  const localInjectMonsoon = useCallback((segmentId, rainfall = 0.9, soilMoisture = 0.85) => {
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id !== segmentId) return s
        const risk_index = Math.max(s.risk_index, (rainfall * 0.4 + soilMoisture * 0.6))
        const k_effective = Math.max(50.0, 100.0 - risk_index * 30.0)
        let state = 'HEALTHY'
        if (risk_index >= 0.7) state = 'CRITICAL_MUD_PUMPING'
        else if (risk_index >= 0.35) state = 'WARNING_WATERLOGGING'
        return {
          ...s,
          rainfall,
          soil_moisture: soilMoisture,
          risk_index,
          k_effective,
          state,
          color: state === 'CRITICAL_MUD_PUMPING' ? '#ef4444' : state === 'WARNING_WATERLOGGING' ? '#eab308' : '#22c55e'
        }
      })
    )
    setLogs((prev) => [
      ...prev.slice(-49),
      {
        timestamp: Date.now() / 1000,
        level: 'WARNING',
        message: `Hydrology anomaly: heavy precipitation detected on segment ${segmentId}`,
        agent: 'HydrologyAgent',
        segment_id: segmentId
      }
    ])
  }, [])

  const localInjectAnomaly = useCallback((segmentId) => {
    setSegments((prev) =>
      prev.map((s) => {
        if (s.id !== segmentId) return s
        return {
          ...s,
          vib_z: 3.5,
          risk_index: 0.85,
          state: 'CRITICAL_MUD_PUMPING',
          color: '#ef4444'
        }
      })
    )
    const ticketId = `TK-${segmentId}-${Date.now().toString().slice(-4)}`
    setTickets((prev) => {
      if (prev.some(t => t.segment === segmentId && t.status !== 'closed')) return prev
      return [
        ...prev,
        {
          id: ticketId,
          segment: segmentId,
          status: 'open',
          priority: 'high',
          issue: 'MUD_PUMPING',
          created_at: new Date().toISOString()
        }
      ]
    })
    setLogs((prev) => [
      ...prev.slice(-49),
      {
        timestamp: Date.now() / 1000,
        level: 'CRITICAL',
        message: `Structural failure: critical mud pumping detected on segment ${segmentId}`,
        agent: 'VibrationAgent',
        segment_id: segmentId
      }
    ])
  }, [])

  const localReset = useCallback(() => {
    setSegments(DEFAULT_SEGMENTS)
    setTickets([])
    setLogs([])
    setTrain({ segment_id: 'S1', progress: 0 })
    setWeatherStatus({ live_weather: false, source: 'simulation', note: null })
  }, [])

  const localSetWeatherMode = useCallback((live) => {
    setWeatherStatus({
      live_weather: live,
      source: live ? 'open-meteo' : 'simulation',
      note: live ? 'Connecting to live coordinates...' : null
    })
  }, [])

  connectRef.current = connect

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  useEffect(() => {
    if (realConnected) return

    const interval = setInterval(() => {
      // 1. Move train progress locally
      setTrain((prev) => {
        let progress = prev.progress + 4
        let segment_id = prev.segment_id
        if (progress >= 100) {
          progress = 0
          const currentIdx = SEGMENT_IDS.indexOf(segment_id)
          segment_id = SEGMENT_IDS[(currentIdx + 1) % SEGMENT_IDS.length]
        }
        return { segment_id, progress }
      })

      // 2. Fluctuate segments slightly
      setSegments((prev) => {
        const next = prev.map((s) => {
          const rainfall = Math.max(0.01, Math.min(1.0, s.rainfall + (Math.random() - 0.5) * 0.01))
          const soil_moisture = Math.max(0.1, Math.min(1.0, s.soil_moisture + (Math.random() - 0.5) * 0.01))
          const vib_z = Math.max(0.01, Math.min(4.0, s.vib_z + (Math.random() - 0.5) * 0.04))
          const risk_index = Math.max(0.01, Math.min(1.0, (rainfall * 0.4 + soil_moisture * 0.6) * (1 + (vib_z > 3.0 ? 0.3 : 0))))
          const k_effective = Math.max(50.0, Math.min(100.0, 100.0 - risk_index * 30.0))
          
          let state = 'HEALTHY'
          if (risk_index >= 0.7) state = 'CRITICAL_MUD_PUMPING'
          else if (risk_index >= 0.35) state = 'WARNING_WATERLOGGING'

          return {
            ...s,
            rainfall,
            soil_moisture,
            vib_z,
            risk_index,
            k_effective,
            state,
            color: state === 'CRITICAL_MUD_PUMPING' ? '#ef4444' : state === 'WARNING_WATERLOGGING' ? '#eab308' : '#22c55e'
          }
        })
        
        // compute active risk index
        const maxRisk = Math.max(...next.map(s => s.risk_index), 0)
        setActiveRiskIndex(maxRisk)
        return next
      })

      // 3. Jitter history for segments
      setSegmentHistory((prevHistory) => {
        const nextHistory = { ...prevHistory }
        SEGMENT_IDS.forEach((id) => {
          const bucket = nextHistory[id] ?? { moisture: [], rainfall: [], vib_z: [] }
          const nextMoisture = [...bucket.moisture.slice(1), 0.2 + 0.05 * Math.sin(Date.now() * 0.0001)]
          const nextRainfall = [...bucket.rainfall.slice(1), 0.1 + 0.03 * Math.cos(Date.now() * 0.0001)]
          const nextVib = [...bucket.vib_z.slice(1), 0.02 + 0.02 * Math.sin(Date.now() * 0.0002)]
          nextHistory[id] = { moisture: nextMoisture, rainfall: nextRainfall, vib_z: nextVib }
        })
        return nextHistory
      })

      // 4. Update impact Cost
      setImpact((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          prevented_cost_usd: prev.prevented_cost_usd + Math.round(Math.random() * 5),
        }
      })

      // 5. Update forecast sparklines
      setForecast((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          segments: prev.segments.map((seg) => {
            const currentSpark = seg.sparkline || []
            const currentRisk = segments.find(s => s.id === seg.id)?.risk_index ?? seg.projected_risk
            const nextSpark = [...currentSpark.slice(1), currentRisk]
            return {
              ...seg,
              projected_risk: currentRisk,
              sparkline: nextSpark
            }
          })
        }
      })

      setLastTickAt(Date.now())
    }, 2000)

    return () => clearInterval(interval)
  }, [realConnected, segments])


  return {
    connected: realConnected,
    realConnected,
    reconnectAttempts,
    segments,
    train,
    tickets,
    logs,
    activeRiskIndex,
    segmentHistory,
    lastTickAt,
    forecast,
    impact,
    weatherStatus,
    dataReady: segments.length > 0,
    localInjectMonsoon,
    localInjectAnomaly,
    localReset,
    localSetWeatherMode,
  }
}
