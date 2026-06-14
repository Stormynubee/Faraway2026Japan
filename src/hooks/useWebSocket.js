import { useEffect, useRef, useState, useCallback } from 'react'

import { wsUrl } from '../lib/config.js'
import { computeActiveRiskIndex, applySegmentUpdate } from '../lib/wsReducer.js'
import { applyLocalMonsoon, applyLocalAnomaly } from '../lib/localDemoInject.js'
import { resolveConnectionState } from '../lib/connectionState.js'
import { parseWebSocketMessage } from '../lib/wsMessage.js'
import { onSocketClose, onSocketOpen } from '../lib/wsReconnect.js'
import {
  advanceTrainProgress,
  computeActiveRiskFromSegments,
  DEMO_TICK_MS,
  normalizeTrainProgress,
  tickDemoForecast,
  tickDemoHistory,
  tickDemoImpact,
  tickDemoSegments,
} from '../lib/demoSimulation.js'

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
  const segmentsRef = useRef(segments)
  const ticketsRef = useRef(tickets)
  segmentsRef.current = segments
  ticketsRef.current = tickets

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
      const parsed = parseWebSocketMessage(event.data)
      if (!parsed.ok) return
      const msg = parsed.message
      switch (msg.type) {
        case 'state_snapshot': {
          const segs = msg.segments || []
          setSegments(segs)
          setTrain({
            segment_id: msg.train?.segment_id ?? 'S1',
            progress: normalizeTrainProgress(msg.train?.progress ?? 0),
          })
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
          setTrain({
            segment_id: msg.segment_id,
            progress: normalizeTrainProgress(msg.progress),
          })
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
    setSegments((prev) => {
      const { segments: next, activeRiskIndex: risk, log } = applyLocalMonsoon(
        prev,
        segmentId,
        rainfall,
        soilMoisture,
      )
      setActiveRiskIndex(risk)
      setLogs((logs) => [...logs.slice(-49), log])
      return next
    })
  }, [])

  const localInjectAnomaly = useCallback((segmentId) => {
    const ticketId = `TK-${segmentId}-${Date.now().toString().slice(-4)}`
    const { segments: nextSegments, tickets: nextTickets, activeRiskIndex: risk, log } =
      applyLocalAnomaly(segmentsRef.current, ticketsRef.current, segmentId, ticketId)
    setSegments(nextSegments)
    setTickets(nextTickets)
    setActiveRiskIndex(risk)
    setLogs((logs) => [...logs.slice(-49), log])
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
      setTrain((prev) => advanceTrainProgress(prev))

      let tickSegments = null
      setSegments((prev) => {
        tickSegments = tickDemoSegments(prev)
        setActiveRiskIndex(computeActiveRiskFromSegments(tickSegments))
        return tickSegments
      })

      setSegmentHistory((prevHistory) => tickDemoHistory(prevHistory, SEGMENT_IDS))

      setImpact((prev) => tickDemoImpact(prev))

      setForecast((prev) => {
        const segmentsForForecast = tickSegments ?? segmentsRef.current
        const riskById = Object.fromEntries(
          segmentsForForecast.map((s) => [s.id, s.risk_index]),
        )
        return tickDemoForecast(prev, riskById)
      })

      setLastTickAt(Date.now())
    }, DEMO_TICK_MS)

    return () => clearInterval(interval)
  }, [realConnected])


  const dataReady = segments.length > 0
  const connection = resolveConnectionState({ realConnected, hasSegments: dataReady })

  return {
    connected: connection.connected,
    realConnected: connection.realConnected,
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
    dataReady: connection.dataReady,
    localInjectMonsoon,
    localInjectAnomaly,
    localReset,
    localSetWeatherMode,
  }
}
