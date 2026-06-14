/**
 * @typedef {Readonly<{
 *   visible?: boolean
 *   countdown?: number
 *   onContinue?: () => void
 * }>} BootContinueButtonProps
 */

/** Eye-catching continue CTA with 3s auto-handoff ring. */
export default function BootContinueButton({
  visible = false,
  countdown = 3,
  onContinue,
}) {
  const ringProgress = ((3 - countdown) / 3) * 100

  return (
    <div className={`boot-continue-wrap ${visible ? 'boot-continue-wrap-visible' : ''}`}>
      <button
        type="button"
        className="boot-continue"
        onClick={onContinue}
        disabled={!visible}
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        aria-label={`Continue to dashboard. Auto-continues in ${countdown} seconds`}
      >
        <span className="boot-continue-ring" aria-hidden="true">
          <svg viewBox="0 0 44 44">
            <circle className="boot-continue-ring-track" cx="22" cy="22" r="19" />
            <circle
              className="boot-continue-ring-fill"
              cx="22"
              cy="22"
              r="19"
              style={{ '--ring-progress': ringProgress }}
            />
          </svg>
        </span>
        <span className="boot-continue-glow" aria-hidden="true" />
        <span className="boot-continue-shine" aria-hidden="true" />
        <span className="boot-continue-label">Continue</span>
        <span className="boot-continue-hint">
          {countdown > 0 ? `${countdown}s` : 'entering'}
        </span>
      </button>
    </div>
  )
}
