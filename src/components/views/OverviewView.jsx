import { useCallback, useRef, useState } from 'react'
import ClimatePanel from '../ClimatePanel'
import AnomalyStream from '../AnomalyStream'
import CorridorBriefing from '../CorridorBriefing'
import OverviewOpsStrip from '../OverviewOpsStrip'
import ImpactPanel from '../ImpactPanel'
import ForecastPanel from '../ForecastPanel'
import ScenarioMenu from '../ScenarioMenu'
import PageHeader from '../ink/PageHeader.jsx'
import HeroStatusLine from '../HeroStatusLine'
import RiskGaugeDial from '../RiskGaugeDial'
import SensorStackPanel from '../SensorStackPanel'
import MetricBar from '../MetricBar'
import CorridorCommandDock from '../CorridorCommandDock'
import DashboardSkeleton from '../DashboardSkeleton'
import PanelHeader from '../PanelHeader'
import { OVERVIEW_SPLIT_CLASSES as LAYOUT } from '../../lib/overviewSplitLayout.js'

export default function OverviewView({
  segments,
  tickets,
  logs,
  train,
  connected,
  realConnected,
  openTicketCount,
  activeRiskIndex,
  segmentHistory,
  lastTickAt,
  forecast,
  impact,
  dataReady,
  onSegmentClick,
  onOpenStationMap,
  onNavigate,
  onGoMaintenance,
  onInjectToast,
  localInjectMonsoon,
  localInjectAnomaly,
  localReset,
}) {
  const scrollRef = useRef(null)
  const shellRef = useRef(null)
  const [scrollPaneEl, setScrollPaneEl] = useState(null)

  const setScrollPaneRef = useCallback((node) => {
    scrollRef.current = node
    setScrollPaneEl(node)
  }, [])

  if (!dataReady) {
    return (
      <div className="overview-page" data-testid="view-overview">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className={`overview-page ${LAYOUT.page}`} data-testid="view-overview">
      <div
        className={LAYOUT.scrollPane}
        ref={setScrollPaneRef}
        data-testid="overview-dashboard-scroll"
      >
        <div className={LAYOUT.shell} ref={shellRef}>
          <div className={LAYOUT.headerBlock}>
            <PageHeader
              eyebrow="CORRIDOR / OVERVIEW"
              title="Track-bed operations"
              lede="Scroll anywhere on the overview to scrub corridor frames · live alerts below"
              data-testid="overview-page-header"
            />
            <HeroStatusLine segments={segments} onSegmentClick={onSegmentClick} />
          </div>

          <div className={LAYOUT.workspace}>
            <aside className={LAYOUT.corridorPane} data-guide="corridor-feed">
              <CorridorCommandDock
                placement={LAYOUT.corridorPlacement}
                segments={segments}
                onSegmentClick={onSegmentClick}
                driveShellRef={shellRef}
                scrollContainerRef={scrollRef}
                scrollContainerEl={scrollPaneEl}
                lastTickAt={lastTickAt}
                className="panel-stagger-1"
              />
              <div className={LAYOUT.corridorOpsRow}>
                <OverviewOpsStrip
                  train={train}
                  connected={connected}
                  realConnected={realConnected}
                  onNavigate={onNavigate}
                  onInjectToast={onInjectToast}
                  localInjectMonsoon={localInjectMonsoon}
                  localInjectAnomaly={localInjectAnomaly}
                />
                <ScenarioMenu
                  connected={connected}
                  realConnected={realConnected}
                  onInjectToast={onInjectToast}
                  localInjectMonsoon={localInjectMonsoon}
                  localInjectAnomaly={localInjectAnomaly}
                  localReset={localReset}
                />
              </div>
              <SensorStackPanel
                segments={segments}
                activeRiskIndex={activeRiskIndex}
                connected={realConnected}
                variant="deck"
                className={LAYOUT.corridorSensors}
              />
            </aside>

            <div className={LAYOUT.metricsPane}>
              <ClimatePanel segments={segments} segmentHistory={segmentHistory} />
              <div className={LAYOUT.deck}>
                <section
                  className="panel panel-hero-gauge panel-stagger-2"
                  data-testid="risk-gauge"
                  data-guide="metrics"
                >
                  <PanelHeader
                    icon="speed"
                    title="Corridor risk gauge"
                    explainer="Highest active track-bed risk across segments S1–S6"
                  />
                  <div className="hero-gauge-row">
                    <RiskGaugeDial activeRiskIndex={activeRiskIndex} />
                    <MetricBar
                      segments={segments}
                      activeRiskIndex={activeRiskIndex}
                      variant="strip"
                      animate
                    />
                  </div>
                </section>
                <ImpactPanel impact={impact} />
              </div>
              <section
                className={`${LAYOUT.metricsAlerts} panel-stagger-3`}
                data-testid="overview-alerts"
              >
                <AnomalyStream tickets={tickets} logs={logs} maxEntries={14} />
              </section>
            </div>
          </div>

          <div className={LAYOUT.secondary}>
            <ForecastPanel forecast={forecast} />
            <CorridorBriefing
              train={train}
              segments={segments}
              tickets={tickets}
              openTicketCount={openTicketCount}
              onAnalyzeSegment={onSegmentClick}
              onGoMaintenance={onGoMaintenance}
              onOpenStationMap={onOpenStationMap}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
