import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UI } from '../../content/uiCopy.js'
import { GUIDE_PANEL_MODES } from '../../lib/guideLauncher.js'

export default function GuideChatPanel({
  open,
  mode,
  onClose,
  messages,
  input,
  onInputChange,
  onSend,
  thinking,
  tourActive,
  stepIndex,
  stepCount,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onQuickTopic,
}) {
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSend(input)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="guide-panel"
          role="dialog"
          aria-label={UI.guide.title}
          data-testid="guide-panel"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <header className="guide-panel-head">
            <div>
              <h2 className="guide-panel-title">
                {tourActive ? UI.guide.launcherTourLabel : UI.guide.title}
              </h2>
              <p className="guide-panel-sub">
                {tourActive ? UI.guide.launcherTourDesc : UI.guide.subtitle}
              </p>
            </div>
            <button type="button" className="guide-panel-close" onClick={onClose} aria-label="Close guide">
              <span className="material-symbols-outlined">close</span>
            </button>
          </header>

          {tourActive && currentStep && (
            <div className="guide-tour-bar">
              <span className="guide-tour-step">
                Step {stepIndex + 1} / {stepCount}
              </span>
              <strong className="guide-tour-title">{currentStep.title}</strong>
            </div>
          )}

          <div className="guide-messages" ref={listRef}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`guide-msg guide-msg-${msg.role}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.stepTitle && <span className="guide-msg-step">{msg.stepTitle}</span>}
                <p>{msg.content}</p>
                {msg.technical && (
                  <p className="guide-msg-tech" title="Technical detail">
                    {msg.technical}
                  </p>
                )}
              </motion.div>
            ))}
            {thinking && (
              <div className="guide-msg guide-msg-assistant guide-msg-typing">
                <span className="guide-typing-dot" />
                <span className="guide-typing-dot" />
                <span className="guide-typing-dot" />
              </div>
            )}
          </div>

          {!tourActive && mode === GUIDE_PANEL_MODES.chat && (
            <div className="guide-quick-topics">
              {UI.guide.quickTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  className="guide-quick-btn"
                  onClick={() => onQuickTopic(topic)}
                  disabled={thinking}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {tourActive ? (
            <div className="guide-tour-actions">
              <button type="button" className="guide-btn guide-btn-ghost" onClick={onSkip}>
                {UI.guide.skip}
              </button>
              <div className="guide-tour-nav">
                <button
                  type="button"
                  className="guide-btn guide-btn-ghost"
                  onClick={onBack}
                  disabled={stepIndex === 0}
                >
                  {UI.guide.back}
                </button>
                <button type="button" className="guide-btn guide-btn-primary" onClick={onNext}>
                  {stepIndex >= stepCount - 1 ? UI.guide.finish : UI.guide.next}
                </button>
              </div>
            </div>
          ) : mode === GUIDE_PANEL_MODES.chat ? (
            <form className="guide-input-row" onSubmit={handleSubmit}>
              <input
                type="text"
                className="guide-input"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={UI.guide.placeholder}
                disabled={thinking}
                aria-label="Message to guide"
              />
              <button type="submit" className="guide-send" data-testid="guide-send" disabled={thinking || !input.trim()} aria-label="Send">
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
          ) : null}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
