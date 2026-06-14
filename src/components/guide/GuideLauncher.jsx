import { motion, AnimatePresence } from 'framer-motion'
import { UI } from '../../content/uiCopy.js'

export default function GuideLauncher({ open, onSelectChat, onSelectTour, onDismiss }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            type="button"
            className="guide-launcher-backdrop"
            aria-label="Close guide menu"
            onClick={onDismiss}
            data-testid="guide-launcher-backdrop"
          />
          <motion.div
            className="guide-launcher"
            role="menu"
            aria-label={UI.guide.launcherTitle}
            data-testid="guide-launcher"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="guide-launcher-kicker">{UI.guide.launcherKicker}</p>
            <h3 className="guide-launcher-title">{UI.guide.launcherTitle}</h3>

            <button
              type="button"
              role="menuitem"
              className="guide-launcher-option guide-launcher-option-tour"
              data-testid="guide-launcher-tour"
              onClick={onSelectTour}
            >
              <span className="guide-launcher-option-icon material-symbols-outlined" aria-hidden>
                route
              </span>
              <span className="guide-launcher-option-body">
                <span className="guide-launcher-option-label">{UI.guide.launcherTourLabel}</span>
                <span className="guide-launcher-option-desc">{UI.guide.launcherTourDesc}</span>
              </span>
              <span className="material-symbols-outlined guide-launcher-chevron" aria-hidden>
                chevron_right
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="guide-launcher-option guide-launcher-option-chat guide-launcher-option-default"
              data-testid="guide-launcher-chat"
              onClick={onSelectChat}
            >
              <span className="guide-launcher-option-icon material-symbols-outlined" aria-hidden>
                forum
              </span>
              <span className="guide-launcher-option-body">
                <span className="guide-launcher-option-label">
                  {UI.guide.launcherChatLabel}
                  <span className="guide-launcher-default-tag">{UI.guide.launcherDefaultTag}</span>
                </span>
                <span className="guide-launcher-option-desc">{UI.guide.launcherChatDesc}</span>
              </span>
              <span className="material-symbols-outlined guide-launcher-chevron" aria-hidden>
                chevron_right
              </span>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
