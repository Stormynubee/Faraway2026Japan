import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useWebSocket } from './hooks/useWebSocket'
import { useToast } from './hooks/useToast'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import StationMapModal from './components/StationMapModal'
import GuideCoach from './components/guide/GuideCoach'
import OverviewView from './components/views/OverviewView'
import AnalysisView from './components/views/AnalysisView'
import MaintenanceView from './components/views/MaintenanceView'
import ClimateView from './components/views/ClimateView'
import BootLoader from './components/BootLoader'
import ToastStack from './components/ToastStack'
import { highestRiskSegment } from './lib/segmentUtils.js'
import { injectMonsoon } from './lib/api.js'
import { UI } from './content/uiCopy.js'
import { useDemoScenario } from './hooks/useDemoScenario'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion.js'
import GrainOverlay from './components/ink/GrainOverlay.jsx'
import StatusTicker from './components/ink/StatusTicker.jsx'

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function App() {
  const {
    connected,
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
    dataReady,
    localInjectMonsoon,
    localInjectAnomaly,
    localReset,
    localSetWeatherMode,
  } = useWebSocket()

  const { toasts, push: pushToast } = useToast()
  useDemoScenario({ connected: realConnected, onToast: pushToast })
  const prevTicketsRef = useRef([])
  const reduced = usePrefersReducedMotion()

  const [booted, setBooted] = useState(false)
  const [view, setView] = useState('overview')
  const [selectedSegmentId, setSelectedSegmentId] = useState('S3')
  const [stationMapOpen, setStationMapOpen] = useState(false)
  const [uptimeSec, setUptimeSec] = useState(0)
  const [sessionStart] = useState(() => Date.now())

  useEffect(() => {
    if (!dataReady) return
    const id = setInterval(() => {
      setUptimeSec(Math.floor((Date.now() - sessionStart) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [dataReady, sessionStart])

  useEffect(() => {
    const prev = prevTicketsRef.current
    for (const t of tickets) {
      const old = prev.find((p) => p.id === t.id)
      if (!old && t.status !== 'closed') {
        pushToast(`New ${t.priority} ticket on ${t.segment}`, 'warn')
      }
      if (old && old.status === 'open' && t.status === 'closed') {
        pushToast(`Ticket ${t.id} closed — segment recovered`, 'success')
      }
    }
    prevTicketsRef.current = tickets
  }, [tickets, pushToast])

  const handleScan = async () => {
    try {
      if (realConnected) {
        await injectMonsoon('S4', 0.9, 0.85)
      } else {
        localInjectMonsoon('S4', 0.9, 0.85)
      }
      pushToast(UI.simulation.sent, 'success')
    } catch {
      pushToast(UI.simulation.offline, 'error')
    }
  }

  const handleSegmentClick = (id) => {
    setSelectedSegmentId(id)
    setView('analysis')
  }

  const goMaintenance = useCallback(() => {
    setView('maintenance')
    requestAnimationFrame(() => {
      document.getElementById('network-logs')?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  const openTickets = tickets.filter((t) => t.status !== 'closed').length
  const footerSegment =
    train?.segment_id ?? highestRiskSegment(segments)?.id ?? '—'
  const uptimeLabel = dataReady ? formatUptime(uptimeSec) : '—'
  const agentLabel = connected ? UI.footer.agentOk : 'Demo simulation'

  const handleBootComplete = useCallback(() => setBooted(true), [])

  const viewMotion = reduced
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }

  const tickerItems = [
    dataReady && { label: 'SEG', value: footerSegment },
    dataReady && { label: 'RISK', value: `${Math.round((activeRiskIndex ?? 0) * 100)}%` },
    dataReady && { label: 'UPTIME', value: uptimeLabel },
    dataReady && openTickets > 0 && { label: 'TICKETS', value: String(openTickets) },
    !connected && dataReady && { label: 'MODE', value: 'Demo' },
  ].filter(Boolean)

  if (!booted) {
    return <BootLoader onComplete={handleBootComplete} />
  }

  return (
    <div className="shell">
      <GrainOverlay />
      <Sidebar
        connected={connected}
        realConnected={realConnected}
        reconnectAttempts={reconnectAttempts}
        activeView={view}
        onNavigate={setView}
        onScan={handleScan}
      />

      <div className="workspace">
        <TopBar
          connected={connected}
          realConnected={realConnected}
          reconnectAttempts={reconnectAttempts}
          openTicketCount={openTickets}
          onNavigateMaintenance={goMaintenance}
        />

        <StatusTicker items={tickerItems} />



        <main
          className={`main-grid ${view === 'overview' ? 'main-grid-overview' : ''} ${view !== 'overview' ? 'main-grid-single' : ''}`}
        >
          <AnimatePresence mode="wait">
            {view === 'overview' && (
              <motion.div key="overview" className="view-shell" {...viewMotion}>
                <OverviewView
                  segments={segments}
                  tickets={tickets}
                  logs={logs}
                  train={train}
                  connected={connected}
                  realConnected={realConnected}
                  openTicketCount={openTickets}
                  activeRiskIndex={activeRiskIndex}
                  segmentHistory={segmentHistory}
                  lastTickAt={lastTickAt}
                  forecast={forecast}
                  impact={impact}
                  dataReady={dataReady}
                  onSegmentClick={handleSegmentClick}
                  onOpenStationMap={() => setStationMapOpen(true)}
                  onNavigate={setView}
                  onGoMaintenance={goMaintenance}
                  onInjectToast={pushToast}
                  localInjectMonsoon={localInjectMonsoon}
                  localInjectAnomaly={localInjectAnomaly}
                  localReset={localReset}
                />
              </motion.div>
            )}
            {view === 'analysis' && (
              <motion.div key="analysis" className="view-shell" {...viewMotion}>
                <AnalysisView
                  segments={segments}
                  activeRiskIndex={activeRiskIndex}
                  logs={logs}
                  segmentHistory={segmentHistory}
                  selectedSegmentId={selectedSegmentId}
                  onSelectSegment={setSelectedSegmentId}
                  onNavigateMaintenance={goMaintenance}
                  onInjectToast={pushToast}
                  dataReady={dataReady}
                  realConnected={realConnected}
                  localInjectAnomaly={localInjectAnomaly}
                />
              </motion.div>
            )}
            {view === 'maintenance' && (
              <motion.div key="maintenance" className="view-shell" {...viewMotion}>
                <MaintenanceView tickets={tickets} logs={logs} dataReady={dataReady} />
              </motion.div>
            )}
            {view === 'climate' && (
              <motion.div key="climate" className="view-shell" {...viewMotion}>
                <ClimateView
                  segments={segments}
                  dataReady={dataReady}
                  weatherStatus={weatherStatus}
                  connected={connected}
                  realConnected={realConnected}
                  localSetWeatherMode={localSetWeatherMode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="app-footer" data-guide="app-footer">
          <span>
            <span className="footer-dot" />
            {UI.footer.uptime}: {uptimeLabel} | {UI.footer.agent}: {agentLabel} |{' '}
            {UI.footer.segment}: {footerSegment}
          </span>
          <span className="footer-links">
            <button type="button" className="footer-link" onClick={() => setStationMapOpen(true)} data-testid="station-map-open">
              {UI.footer.stationMap}
            </button>
            <span className="footer-sep">|</span>
            <button type="button" className="footer-link" onClick={goMaintenance}>
              {UI.footer.networkLogs}
            </button>
            <span className="footer-sep">|</span>
            <a
              className="footer-link"
              href="/sop.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              {UI.footer.sopDocs}
            </a>
          </span>
        </footer>
      </div>

      <ToastStack toasts={toasts} />

      <GuideCoach
        view={view}
        setView={setView}
        onOpenStationMap={() => setStationMapOpen(true)}
      />

      <StationMapModal
        open={stationMapOpen}
        onClose={() => setStationMapOpen(false)}
        segments={segments}
        train={train}
      />
    </div>
  )
}
