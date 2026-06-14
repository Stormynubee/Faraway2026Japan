import { highestRiskSegment, isCritical, segmentLabel } from '../lib/segmentUtils.js'
import { UI } from '../content/uiCopy.js'

export default function CorridorBriefing({
  train,
  segments,
  tickets,
  openTicketCount,
  onAnalyzeSegment,
  onGoMaintenance,
  onOpenStationMap,
}) {
  const worst = highestRiskSegment(segments)
  const trainSeg = train?.segment_id ?? '—'
  const criticalCount = segments.filter((s) => isCritical(s)).length
  const p1Count = tickets.filter((t) => t.priority === 'P1' && t.status !== 'closed').length

  const prioritySeg = worst ?? segments[0]
  const priorityLabel = prioritySeg ? segmentLabel(prioritySeg) : '—'
  const riskPct = prioritySeg ? Math.round((prioritySeg.risk_index ?? 0) * 100) : 0

  let planLine = UI.briefing.planNominal
  if (p1Count > 0) {
    planLine = UI.briefing.planP1(p1Count)
  } else if (criticalCount > 0 && prioritySeg) {
    planLine = UI.briefing.planCritical(prioritySeg.id, priorityLabel)
  } else if (trainSeg !== '—') {
    planLine = UI.briefing.planTrain(trainSeg)
  }

  return (
    <section className="panel panel-calm corridor-briefing" data-guide="corridor-brief">
      <div className="panel-head panel-head-calm panel-head-compact">
        <div>
          <h2 className="panel-title-calm">{UI.briefing.title}</h2>
          <p className="panel-sub-calm">{UI.briefing.sub}</p>
        </div>
        <span className="briefing-plan-tag">{UI.briefing.today}</span>
      </div>

      <div className="briefing-stats">
        <div className="briefing-stat">
          <span className="briefing-stat-label">{UI.briefing.train}</span>
          <span className="briefing-stat-value">{trainSeg}</span>
        </div>
        <div className="briefing-stat">
          <span className="briefing-stat-label">{UI.briefing.watch}</span>
          <span className={`briefing-stat-value ${criticalCount ? 'briefing-stat-warn' : ''}`}>
            {prioritySeg?.id ?? '—'} · {riskPct}%
          </span>
        </div>
        <div className="briefing-stat">
          <span className="briefing-stat-label">{UI.briefing.tickets}</span>
          <span className={`briefing-stat-value ${p1Count ? 'briefing-stat-critical' : ''}`}>
            {openTicketCount}
            {p1Count > 0 ? ` (${UI.briefing.p1(p1Count)})` : ''}
          </span>
        </div>
      </div>

      <p className="briefing-plan">{planLine}</p>

      <div className="briefing-actions">
        {prioritySeg?.id && (
          <button
            type="button"
            className="briefing-action briefing-action-primary"
            onClick={() => onAnalyzeSegment?.(prioritySeg.id)}
          >
            {UI.briefing.review(prioritySeg.id)}
          </button>
        )}
        {openTicketCount > 0 && (
          <button type="button" className="briefing-action" onClick={() => onGoMaintenance?.()}>
            {UI.briefing.maintenanceLog}
          </button>
        )}
        <button type="button" className="briefing-action" onClick={() => onOpenStationMap?.()}>
          {UI.briefing.stationMap}
        </button>
      </div>

      <p className="briefing-hint">{UI.corridor.scrubHint}</p>
    </section>
  )
}
