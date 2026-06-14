import { useRef } from 'react'
import CorridorCommandDock from '../CorridorCommandDock'
import ClimatePanel from '../ClimatePanel'
import AnomalyStream from '../AnomalyStream'
import CorridorBriefing from '../CorridorBriefing'
import OverviewOpsStrip from '../OverviewOpsStrip'

export default function OverviewView({
  segments,
  tickets,
  logs,
  train,
  connected,
  openTicketCount,
  activeRiskIndex,
  segmentHistory,
  onSegmentClick,
  onOpenStationMap,
  onNavigate,
  onGoMaintenance,
}) {
  const overviewShellRef = useRef(null)

  return (
    <div className="overview-page" ref={overviewShellRef}>
      <div className="overview-grid">
        <CorridorCommandDock
          segments={segments}
          activeRiskIndex={activeRiskIndex}
          onSegmentClick={onSegmentClick}
          driveShellRef={overviewShellRef}
        />

        <div className="overview-side-stack">
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
          />
        </div>
      </div>

      <aside className="overview-aside">
        <AnomalyStream tickets={tickets} logs={logs} maxEntries={8} />
      </aside>
    </div>
  )
}
