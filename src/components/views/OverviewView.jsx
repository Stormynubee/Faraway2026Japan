import { useRef } from 'react'
import ClimatePanel from '../ClimatePanel'
import AnomalyStream from '../AnomalyStream'
import CorridorBriefing from '../CorridorBriefing'
import OverviewOpsStrip from '../OverviewOpsStrip'
import ImpactPanel from '../ImpactPanel'
import ForecastPanel from '../ForecastPanel'
import ScenarioMenu from '../ScenarioMenu'
import HeroStatusLine from '../HeroStatusLine'
import RiskGaugeDial from '../RiskGaugeDial'
import MetricBar from '../MetricBar'
import CorridorCommandDock from '../CorridorCommandDock'
import DashboardSkeleton from '../DashboardSkeleton'
import PanelHeader from '../PanelHeader'

export default function OverviewView({
  segments,
  tickets,
  logs,
  train,
  connected,
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
}) {
  const overviewShellRef = useRef(null)

  if (!dataReady) {
    return (
      <div className="overview-page" data-testid="view-overview">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="overview-page" ref={overviewShellRef} data-testid="view-overview">
      <HeroStatusLine segments={segments} onSegmentClick={onSegmentClick} />

      <CorridorCommandDock
        placement="hero"
        segments={segments}
        onSegmentClick={onSegmentClick}
        driveShellRef={overviewShellRef}
        lastTickAt={lastTickAt}
        className="panel-stagger-1"
      />

      <div className="overview-grid">
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

        <div className="overview-side-stack">
          <ImpactPanel impact={impact} />
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
          <ClimatePanel segments={segments} segmentHistory={segmentHistory} />
          <OverviewOpsStrip
            train={train}
            connected={connected}
            onNavigate={onNavigate}
            onInjectToast={onInjectToast}
          />
          <ScenarioMenu connected={connected} onInjectToast={onInjectToast} />
        </div>
      </div>

      <aside className="overview-aside panel-stagger-4">
        <AnomalyStream tickets={tickets} logs={logs} maxEntries={8} />
      </aside>
    </div>
  )
}
