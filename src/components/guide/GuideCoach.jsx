import { motion } from 'framer-motion'
import { UI } from '../../content/uiCopy.js'
import GuideSpotlight from './GuideSpotlight.jsx'
import GuideChatPanel from './GuideChatPanel.jsx'
import GuideLauncher from './GuideLauncher.jsx'
import { useGuideCoach } from '../../hooks/useGuideCoach.js'

export default function GuideCoach({ view, setView, onOpenStationMap }) {
  const coach = useGuideCoach({ view, setView, onOpenStationMap })
  const isActive = coach.open || coach.launcherOpen

  return (
    <>
      <GuideSpotlight rect={coach.spotlightRect} active={coach.tourActive} />

      <GuideLauncher
        open={coach.launcherOpen}
        onSelectChat={coach.openChat}
        onSelectTour={coach.openTour}
        onDismiss={coach.dismissLauncher}
      />

      <motion.button
        type="button"
        className={`guide-fab ${isActive ? 'guide-fab-open' : ''}`}
        data-testid="guide-fab"
        aria-label={UI.guide.fabLabel}
        aria-expanded={isActive}
        aria-haspopup="menu"
        whileTap={{ scale: 0.97 }}
        onClick={coach.toggleFab}
      >
        <span className="material-symbols-outlined guide-fab-icon" aria-hidden>
          {isActive ? 'close' : 'help'}
        </span>
        <span className="guide-fab-label">{isActive ? 'Close' : 'Guide'}</span>
      </motion.button>

      <GuideChatPanel
        open={coach.open}
        mode={coach.panelMode}
        onClose={coach.closePanel}
        messages={coach.messages}
        input={coach.input}
        onInputChange={coach.setInput}
        onSend={(text) => coach.sendMessage(text)}
        thinking={coach.thinking}
        tourActive={coach.tourActive}
        stepIndex={coach.stepIndex}
        stepCount={coach.stepCount}
        currentStep={coach.currentStep}
        onNext={coach.nextStep}
        onBack={coach.prevStep}
        onSkip={coach.skipTour}
        onQuickTopic={coach.handleQuickTopic}
      />
    </>
  )
}
