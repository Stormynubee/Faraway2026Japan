import { motion } from 'framer-motion'

function formatTs(ts) {
  if (!ts) return '[TS:--:--:--.---]'
  const d = new Date(ts * 1000)
  return `[TS:${d.toISOString().slice(11, 19)}.${String(d.getMilliseconds()).padStart(3, '0')}]`
}

export default function LogEntry({ entry, animate = false, index = 0 }) {
  const critical =
    entry.critical ??
    (entry.priority === 'P1' ||
      entry.message?.includes('CRITICAL') ||
      entry.message?.includes('P1'))

  const content = (
    <>
      <div className="stream-meta">
        <span>{formatTs(entry.timestamp ?? entry.ts)}</span>
        <span>{entry.node ?? entry.agent ?? entry.segment ?? '—'}</span>
      </div>
      <div className="stream-body">
        <span className="material-symbols-outlined stream-icon">
          {critical ? 'warning' : 'info'}
        </span>
        <div>
          <div className="stream-title">
            {entry.title ??
              entry.message?.slice(0, 48) ??
              `${entry.priority}_${entry.reason?.slice(0, 40) || 'TICKET'}`}
          </div>
          {entry.detail && <div className="stream-detail">{entry.detail}</div>}
          {entry.model_label && (
            <div className="stream-detail">MODEL: {entry.model_label}</div>
          )}
        </div>
      </div>
    </>
  )

  const className = `stream-item ${critical ? 'stream-critical' : ''}`

  if (animate) {
    return (
      <motion.li
        className={className}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.2), duration: 0.25 }}
      >
        {content}
      </motion.li>
    )
  }

  return <li className={className}>{content}</li>
}
