import { useState, useEffect, useRef } from 'react'

const BOOT_MS = 4000
const FADE_MS = 420

const STEPS = [
  { at: 0, id: 'link', label: 'Corridor link', detail: 'Opening telemetry bridge' },
  { at: 520, id: 'track', label: 'Track model', detail: 'Geometry compiled' },
  { at: 1040, id: 'bogie', label: 'Bogie assembly', detail: 'Wheel pair mounted' },
  { at: 1560, id: 'segments', label: 'Segments S1–S6', detail: 'Baseline nominal' },
  { at: 2200, id: 'stream', label: 'Live stream', detail: 'Awaiting train packets' },
  { at: 3000, id: 'handoff', label: 'Dashboard', detail: 'Loading overview' },
]

export default function BootLoader({ onComplete }) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const [activeStep, setActiveStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('boot')

  useEffect(() => {
    const timers = STEPS.map(({ at }, index) =>
      window.setTimeout(() => setActiveStep(index + 1), at),
    )

    const started = Date.now()
    const progressTimer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / BOOT_MS) * 100)
      setProgress(pct)
    }, 40)

    const finishTimer = window.setTimeout(() => {
      setProgress(100)
      setActiveStep(STEPS.length)
      setPhase('exit')
      window.setTimeout(() => onCompleteRef.current?.(), FADE_MS)
    }, BOOT_MS)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(progressTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  const statusText =
    phase === 'exit'
      ? 'Opening dashboard'
      : progress >= 95
        ? 'Almost there'
        : 'Starting corridor systems'

  return (
    <div
      className={`boot-screen ${phase === 'exit' ? 'boot-screen-out' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Bogie Flow"
    >
      <div className="boot-layout">
        <section className="boot-intro">
          <span className="boot-accent" aria-hidden="true" />
          <div className="boot-intro-copy">
            <p className="boot-kicker">Climate-aware rail analytics</p>
            <h1 className="boot-title">Bogie Flow</h1>
            <p className="boot-tagline">
              Others monitor the rail.
              <br />
              We monitor the ballast.
            </p>
          </div>
        </section>

        <section className="boot-steps-panel" aria-label="Startup progress">
          <ol className="boot-steps">
            {STEPS.map((step, index) => {
              const done = index < activeStep
              const current = index === activeStep && phase === 'boot'
              return (
                <li
                  key={step.id}
                  className={`boot-step ${done ? 'boot-step-done' : ''} ${current ? 'boot-step-active' : ''}`}
                >
                  <span className="boot-step-marker" aria-hidden="true">
                    {done ? '✓' : current ? '●' : '○'}
                  </span>
                  <span className="boot-step-body">
                    <span className="boot-step-label">{step.label}</span>
                    <span className="boot-step-detail">{step.detail}</span>
                  </span>
                </li>
              )
            })}
          </ol>
        </section>
      </div>

      <footer className="boot-bar">
        <div className="boot-bar-track" aria-hidden="true">
          <div className="boot-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="boot-bar-meta">
          <span className="boot-bar-status">{statusText}</span>
          <span className="boot-bar-pct">{Math.round(progress)}%</span>
        </div>
      </footer>
    </div>
  )
}
