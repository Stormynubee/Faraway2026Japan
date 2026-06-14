import { useState, useEffect, useRef } from 'react'

const BOOT_MS = 4000
const EXIT_MS = 380

const LOG_LINES = [
  { at: 0, text: 'corridor link · connecting' },
  { at: 420, text: 'track geometry · ready' },
  { at: 880, text: 'bogie assembly · ready' },
  { at: 1360, text: 'segments S1–S6 · idle' },
  { at: 2000, text: 'telemetry stream · live' },
  { at: 2800, text: 'handoff to dashboard' },
]

export default function BootLoader({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [exiting, setExiting] = useState(false)
  const finishedRef = useRef(false)

  useEffect(() => {
    const logTimers = LOG_LINES.map(({ at, text }) =>
      setTimeout(() => setLines((prev) => [...prev, text]), at),
    )

    const start = performance.now()
    let frameId = 0

    const tick = (now) => {
      const pct = Math.min(100, ((now - start) / BOOT_MS) * 100)
      setProgress(pct)

      if (pct < 100) {
        frameId = requestAnimationFrame(tick)
        return
      }

      if (finishedRef.current) return
      finishedRef.current = true

      window.setTimeout(() => {
        setExiting(true)
        window.setTimeout(onComplete, EXIT_MS)
      }, 280)
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      logTimers.forEach(clearTimeout)
      cancelAnimationFrame(frameId)
    }
  }, [onComplete])

  const statusLabel =
    exiting ? 'Entering…' : progress >= 100 ? 'Ready' : 'Starting'

  return (
    <div
      className={`boot-overlay ${exiting ? 'boot-overlay-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Bogie Flow"
    >
      <div className="boot-shell">
        <header className="boot-brand">
          <span className="boot-mark" aria-hidden="true" />
          <div>
            <h1 className="boot-title">Bogie Flow</h1>
            <p className="boot-tagline">Ballast-first corridor monitoring</p>
          </div>
        </header>

        <div className="boot-terminal" aria-label="Startup log">
          <ul className="boot-log-list">
            {lines.map((line, i) => (
              <li key={`${line}-${i}`} className="boot-log-item">
                {line}
              </li>
            ))}
            {!exiting && progress < 100 && (
              <li className="boot-log-item boot-log-cursor" aria-hidden="true">
                ▋
              </li>
            )}
          </ul>
        </div>

        <footer className="boot-foot">
          <div className="boot-progress-track" aria-hidden="true">
            <div className="boot-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="boot-status">{statusLabel}</span>
        </footer>
      </div>
    </div>
  )
}
