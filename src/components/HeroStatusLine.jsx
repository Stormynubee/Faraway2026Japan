import { corridorStatusSummary } from '../lib/corridorStatus.js'
import { isCritical, segmentLabel } from '../lib/segmentUtils.js'
import { UI } from '../content/uiCopy.js'

export default function HeroStatusLine({ segments, onSegmentClick }) {
  const { tone, attentionCount, attentionSegments, totalSegments } = corridorStatusSummary(segments)

  const headline =
    tone === 'loading'
      ? UI.status.connecting
      : tone === 'healthy'
        ? UI.status.allNominal(totalSegments)
        : UI.status.needsAttention(attentionCount)

  return (
    <header className="hero-status" data-testid="hero-status-line">
      <div className={`hero-status-bar hero-status-bar-${tone}`}>
        <span className={`hero-status-lamp hero-status-lamp-${tone}`} aria-hidden />

        <div className="hero-status-body">
          <span className="hero-status-kicker">{UI.status.kicker}</span>
          <p className="hero-status-headline">{headline}</p>
          {tone === 'healthy' && totalSegments > 0 && (
            <p className="hero-status-meta">{UI.status.operational(totalSegments)}</p>
          )}
        </div>

        {attentionSegments.length > 0 && (
          <div className="hero-status-chips" role="list" aria-label={UI.status.watchListLabel}>
            {attentionSegments.map((seg) => {
              const chipTone = isCritical(seg) ? 'critical' : 'warn'
              const label = segmentLabel(seg)
              return (
                <button
                  key={seg.id}
                  type="button"
                  role="listitem"
                  className={`hero-status-chip hero-status-chip-${chipTone}`}
                  data-testid={`hero-status-seg-${seg.id}`}
                  onClick={() => onSegmentClick?.(seg.id)}
                >
                  <span className="hero-status-chip-id">{seg.id}</span>
                  <span className="hero-status-chip-sep" aria-hidden>
                    ·
                  </span>
                  <span className="hero-status-chip-label">{label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
