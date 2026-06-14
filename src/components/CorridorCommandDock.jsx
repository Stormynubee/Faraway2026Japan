import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CorridorScrubViewer from './CorridorScrubViewer'
import CorridorScrubRail from './CorridorScrubRail'
import SegmentHudGrid from './SegmentHudGrid'
import PanelHeader from './PanelHeader'
import { useCorridorScrub } from '../hooks/useCorridorScrub.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { CORRIDOR_FRAME_COUNT } from '../data/corridorFrames.js'
import { xToProgress } from '../lib/corridorScrub.js'
import { UI } from '../content/uiCopy.js'

const HINT_KEY = 'corridor-scrub-hint-dismissed'

export default function CorridorCommandDock({
  segments,
  onSegmentClick,
  driveShellRef,
  lastTickAt,
  placement = 'grid',
  className = '',
}) {
  const viewportRef = useRef(null)
  const dockRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const [showHint, setShowHint] = useState(
    () => typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(HINT_KEY),
  )

  const scrub = useCorridorScrub(viewportRef, CORRIDOR_FRAME_COUNT, {
    driveShellRef,
    stickyRef: dockRef,
  })

  const dismissHint = () => {
    if (showHint) {
      sessionStorage.setItem(HINT_KEY, '1')
      setShowHint(false)
    }
  }

  const onRailPointerDown = (e) => {
    const track = e.currentTarget
    const rect = track.getBoundingClientRect()
    const progress = xToProgress(e.clientX, rect.left, rect.width, CORRIDOR_FRAME_COUNT)
    scrub.setIntentFromProgress(progress)
    dismissHint()
  }

  const dockMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] },
      }

  const canvasMotion = reduced
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.18, duration: 0.4 },
      }

  const railMotion = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.22, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <motion.section
      ref={dockRef}
      className={`panel corridor-command-dock ${placement === 'hero' ? 'corridor-feed-hero' : ''} ${className}`.trim()}
      data-guide="corridor-feed"
      {...dockMotion}
    >
      <PanelHeader
        icon="videocam"
        title={UI.corridor.feedTitle}
        explainer={showHint ? UI.corridor.scrubHint : UI.corridor.feedSub}
      />

      <motion.div {...canvasMotion}>
        <CorridorScrubViewer
          viewportRef={viewportRef}
          displayProgressRef={scrub.displayProgressRef}
          registerDraw={scrub.registerDraw}
          hovered={scrub.hovered}
          bind={scrub.bind}
          onInteract={dismissHint}
        />
      </motion.div>

      <motion.div {...railMotion}>
        <CorridorScrubRail
          readoutFrame={scrub.readoutFrame}
          frameCount={CORRIDOR_FRAME_COUNT}
          displayProgressRef={scrub.displayProgressRef}
          showHint={showHint}
          onRailPointerDown={onRailPointerDown}
          lastTickAt={lastTickAt}
        />
      </motion.div>

      <div data-guide="segment-strip" className="corridor-segment-strip panel-stagger-3">
        <SegmentHudGrid
          segments={segments}
          onSegmentClick={onSegmentClick}
          variant="strip"
          animate={!reduced}
        />
      </div>
    </motion.section>
  )
}
