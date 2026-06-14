# Overview Calm Instrument Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Overview to a fixed-height corridor hero dock with scrub rail, horizontal segment/metric strips, semantic teal/amber/red tokens, and Framer Motion reveals — without changing WebSocket or scrub math behavior.

**Architecture:** New `CorridorCommandDock` composes canvas-only `CorridorScrubViewer`, `CorridorScrubRail` (progress via `displayProgressRef` + rAF DOM updates), and existing segment/metric components with updated CSS. Overview uses sticky hero dock + scrollable lower deck; xl breakpoint keeps anomaly sticky in right column. Design tokens updated globally in `:root`.

**Tech Stack:** React 19, Vite, Vitest, CSS custom properties, framer-motion

**Spec:** `docs/superpowers/specs/2026-06-14-overview-calm-instrument-design.md`

---

## File map

| Action | Path |
|--------|------|
| Create | `src/components/CorridorScrubRail.jsx` |
| Create | `src/components/CorridorCommandDock.jsx` |
| Create | `src/hooks/usePrefersReducedMotion.js` |
| Modify | `src/components/CorridorScrubViewer.jsx` |
| Modify | `src/components/views/OverviewView.jsx` |
| Modify | `src/components/SegmentHudGrid.jsx` |
| Modify | `src/components/MetricBar.jsx` |
| Modify | `src/index.css` |
| Modify | `docs/DESIGN.md` |
| Modify | `package.json` (add `framer-motion`) |

---

### Task 1: Calm instrument design tokens

**Files:**
- Modify: `src/index.css` (`:root` block, lines 1–34)

- [ ] **Step 1: Replace `:root` color tokens**

```css
:root {
  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --bg: #0a0e12;
  --surface: #0d1218;
  --surface-container: #111820;
  --surface-container-low: #0a0e12;
  --surface-container-high: #161f2a;
  --surface-dim: #0d1218;
  --surface-variant: #1c2634;

  --primary: #3dd6c6;
  --primary-container: #1a4a44;
  --on-primary: #042018;
  --on-primary-container: #a8f5ec;
  --accent: #3dd6c6;
  --accent-warm: #e8a838;
  --on-surface: #e8edf4;
  --on-surface-variant: #8b99aa;
  --outline-variant: #243041;

  --color-healthy: #34d399;
  --color-warning: #e8a838;
  --color-critical: #f07167;
  --error-container: #4a2020;
  --on-error-container: #ffd6d0;

  --radius: 6px;
  --panel-radius: 8px;
  --gutter: 16px;
  --space-section: clamp(24px, 4vh, 40px);
  --hero-min-height: clamp(280px, 45vh, 520px);
  --corridor-dock-height: clamp(280px, 45vh, 520px);
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

- [ ] **Step 2: Fix hardcoded red references that bypass tokens**

Search `src/index.css` for `#ff5545`, `#93000a`, `255, 85, 69` and replace with `var(--accent)`, `var(--color-critical)`, or `rgba` using new tokens. Key spots:

- `.live-tag` background → `var(--primary-container)` with `color: var(--on-primary-container)`
- `.corridor-viewport-hover` outline → `rgba(61, 214, 198, 0.2)`
- `.hud-critical` borders → amber/red semantic mix per spec (amber border, red text only if critical tier)

- [ ] **Step 3: Verify build**

Run: `npm run build`  
Expected: success (visual-only token change)

---

### Task 2: Install framer-motion + reduced-motion hook

**Files:**
- Modify: `package.json`
- Create: `src/hooks/usePrefersReducedMotion.js`

- [ ] **Step 1: Install dependency**

```bash
npm install framer-motion
```

- [ ] **Step 2: Create hook**

```javascript
// src/hooks/usePrefersReducedMotion.js
import { useEffect, useState } from 'react'

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}
```

- [ ] **Step 3: Verify install**

Run: `npm run build`  
Expected: success

---

### Task 3: CorridorScrubRail (TDD-friendly pure helper)

**Files:**
- Create: `src/lib/scrubRail.js`
- Create: `src/lib/scrubRail.test.js`
- Create: `src/components/CorridorScrubRail.jsx`

- [ ] **Step 1: Write failing tests**

```javascript
// src/lib/scrubRail.test.js
import { describe, it, expect } from 'vitest'
import { progressToPercent, formatFrameReadout } from './scrubRail.js'

describe('scrubRail', () => {
  it('maps progress 0 to 0%', () => {
    expect(progressToPercent(0, 64)).toBe(0)
  })

  it('maps progress 63 to 100%', () => {
    expect(progressToPercent(63, 64)).toBe(100)
  })

  it('formats frame readout', () => {
    expect(formatFrameReadout(19, 64)).toBe('19 / 64')
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/lib/scrubRail.test.js`  
Expected: FAIL — module not found

- [ ] **Step 3: Implement helpers**

```javascript
// src/lib/scrubRail.js
export function progressToPercent(progress, frameCount) {
  const max = Math.max(1, frameCount - 1)
  return Math.min(100, Math.max(0, (progress / max) * 100))
}

export function formatFrameReadout(frame, frameCount) {
  return `${frame} / ${frameCount}`
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/lib/scrubRail.test.js`  
Expected: PASS

- [ ] **Step 5: Create CorridorScrubRail component**

```jsx
// src/components/CorridorScrubRail.jsx
import { useEffect, useRef } from 'react'
import { progressToPercent, formatFrameReadout } from '../lib/scrubRail.js'

export default function CorridorScrubRail({
  readoutFrame,
  frameCount,
  displayProgressRef,
  showHint = false,
  onRailPointerDown,
}) {
  const fillRef = useRef(null)
  const handleRef = useRef(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const p = displayProgressRef?.current ?? 0
      const pct = progressToPercent(p, frameCount)
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pct / 100})`
      if (handleRef.current) handleRef.current.style.left = `${pct}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [displayProgressRef, frameCount])

  return (
    <div className="corridor-scrub-rail" aria-label="Corridor scrub progress">
      <span className="scrub-live-pill">
        <span className="scrub-live-dot" aria-hidden="true" /> Live
      </span>
      {showHint && (
        <span className="scrub-hint">Scroll · wheel · drag</span>
      )}
      <span className="scrub-frame-readout">{formatFrameReadout(readoutFrame, frameCount)}</span>
      <div
        className="scrub-track"
        role="slider"
        aria-valuemin={1}
        aria-valuemax={frameCount}
        aria-valuenow={readoutFrame}
        onPointerDown={onRailPointerDown}
      >
        <div ref={fillRef} className="scrub-track-fill" />
        <div ref={handleRef} className="scrub-track-handle" />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add rail CSS to `src/index.css`**

```css
.corridor-scrub-rail {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
  border-top: 1px solid var(--outline-variant);
  background: var(--surface-dim);
}

.scrub-live-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--accent);
  flex-shrink: 0;
}

.scrub-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.scrub-hint {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--on-surface-variant);
}

.scrub-frame-readout {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--on-surface);
  flex-shrink: 0;
}

.scrub-track {
  position: relative;
  flex: 1;
  min-width: 80px;
  max-width: 280px;
  height: 4px;
  background: var(--outline-variant);
  border-radius: 2px;
  cursor: pointer;
}

.scrub-track-fill {
  position: absolute;
  inset: 0;
  background: var(--accent);
  border-radius: 2px;
  transform-origin: left center;
  transition: transform 150ms ease-out;
}

.scrub-track-handle {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  margin-left: -5px;
  margin-top: -5px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 2px var(--surface-dim);
}
```

- [ ] **Step 7: Run all tests**

Run: `npm test`  
Expected: all pass

---

### Task 4: Refactor CorridorScrubViewer — canvas only

**Files:**
- Modify: `src/components/CorridorScrubViewer.jsx`

- [ ] **Step 1: Change component to accept scrub props from parent**

Lift `useCorridorScrub` out to `CorridorCommandDock`. `CorridorScrubViewer` becomes a presentational canvas:

```jsx
// CorridorScrubViewer.jsx — key signature change
export default function CorridorScrubViewer({
  className = '',
  viewportRef,
  canvasRef,
  ready,
  hovered,
  bind,
  onInteract,
}) {
  // remove internal useCorridorScrub, remove overlay JSX entirely
  // keep preload effect, resize observer, registerDraw via props:
  // registerDraw, displayProgressRef passed from parent
}
```

- [ ] **Step 2: Remove overlay block**

Delete lines rendering `.corridor-overlay`, `.corridor-hint`, `.corridor-frame-readout`.

- [ ] **Step 3: Update viewport CSS usage**

In `index.css`, change `.corridor-viewport` and `.corridor-canvas`:

```css
.corridor-viewport {
  position: relative;
  width: 100%;
  height: var(--corridor-dock-height);
  min-height: unset;
  /* ... rest unchanged except hover outline uses teal */
}

.corridor-canvas {
  display: block;
  width: 100%;
  height: 100%;
  min-height: unset;
}
```

- [ ] **Step 4: Run build**

Run: `npm run build`  
Expected: may fail until Task 5 wires parent — proceed to Task 5 immediately

---

### Task 5: CorridorCommandDock composition

**Files:**
- Create: `src/components/CorridorCommandDock.jsx`
- Modify: `src/hooks/useCorridorScrub.js` (optional: export `setIntentFromProgress` for rail drag)

- [ ] **Step 1: Extend useCorridorScrub return value**

Add to return object in `useCorridorScrub.js`:

```javascript
return {
  // ...existing
  setIntentFromProgress,
  frameCount,
}
```

- [ ] **Step 2: Create CorridorCommandDock**

```jsx
// src/components/CorridorCommandDock.jsx
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CorridorScrubViewer from './CorridorScrubViewer'
import CorridorScrubRail from './CorridorScrubRail'
import SegmentHudGrid from './SegmentHudGrid'
import MetricBar from './MetricBar'
import { useCorridorScrub } from '../hooks/useCorridorScrub.js'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion.js'
import { CORRIDOR_FRAME_COUNT } from '../data/corridorFrames.js'
import { xToProgress } from '../lib/corridorScrub.js'

const HINT_KEY = 'corridor-scrub-hint-dismissed'

export default function CorridorCommandDock({
  segments,
  activeRiskIndex,
  onSegmentClick,
}) {
  const viewportRef = useRef(null)
  const reduced = usePrefersReducedMotion()
  const [showHint, setShowHint] = useState(
    () => typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(HINT_KEY),
  )

  const scrub = useCorridorScrub(viewportRef, CORRIDOR_FRAME_COUNT)

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

  const motionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      }

  return (
    <motion.section className="panel corridor-command-dock" {...motionProps}>
      <div className="panel-head panel-head-calm">
        <div>
          <h2 className="panel-title-calm">Corridor feed</h2>
          {showHint && (
            <p className="panel-sub-calm">Scroll · wheel · {CORRIDOR_FRAME_COUNT} frames</p>
          )}
        </div>
      </div>

      <CorridorScrubViewer
        viewportRef={viewportRef}
        {...scrub}
        onInteract={dismissHint}
      />

      <CorridorScrubRail
        readoutFrame={scrub.readoutFrame}
        frameCount={CORRIDOR_FRAME_COUNT}
        displayProgressRef={scrub.displayProgressRef}
        showHint={showHint}
        onRailPointerDown={onRailPointerDown}
      />

      <SegmentHudGrid segments={segments} onSegmentClick={onSegmentClick} variant="strip" />
      <MetricBar segments={segments} activeRiskIndex={activeRiskIndex} variant="strip" />
    </motion.section>
  )
}
```

- [ ] **Step 3: Finish CorridorScrubViewer refactor**

Wire preload state + `registerDraw`/`displayProgressRef` from scrub props passed through dock. Call `onInteract` from pointer/wheel handlers.

- [ ] **Step 4: Run dev smoke check**

Run: `npm run dev`  
Expected: Overview shows canvas + rail; no overlay on image

---

### Task 6: Segment strip + metric strip styling

**Files:**
- Modify: `src/components/SegmentHudGrid.jsx`
- Modify: `src/components/MetricBar.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add `variant` prop to SegmentHudGrid**

```jsx
export default function SegmentHudGrid({ segments, onSegmentClick, variant = 'grid' }) {
  return (
    <div className={`segment-hud ${variant === 'strip' ? 'segment-strip' : ''}`}>
      {/* existing map — change hud-label to sentence case: `Segment ${seg.id.replace('S', '')}` */}
    </div>
  )
}
```

- [ ] **Step 2: Add `variant` prop to MetricBar**

```jsx
export default function MetricBar({ segments, activeRiskIndex, focusSegment, highlightPeak, variant = 'bar' }) {
  return (
    <div className={`metric-bar ${variant === 'strip' ? 'metric-strip' : ''}`}>
      {/* change labels to sentence case: Peak amplitude, Fatigue index, Bearing temp */}
    </div>
  )
}
```

- [ ] **Step 3: Add strip CSS**

```css
.overview-hero-dock {
  position: sticky;
  top: 0;
  z-index: 10;
}

.corridor-command-dock {
  overflow: hidden;
}

.panel-head-calm {
  padding: 14px 16px;
  background: transparent;
  border-bottom: 1px solid var(--outline-variant);
}

.panel-title-calm {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.panel-sub-calm {
  margin: 4px 0 0;
  font-size: 0.6875rem;
  color: var(--on-surface-variant);
}

.segment-strip {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 10px 16px;
  overflow-x: auto;
  border-top: 1px solid var(--outline-variant);
  scrollbar-width: thin;
}

.segment-strip .hud-cell {
  flex: 0 0 auto;
  min-width: 100px;
  min-height: 56px;
  padding: 8px 10px;
}

.segment-strip .hud-cell:hover {
  border-color: rgba(61, 214, 198, 0.5);
}

.hud-critical {
  border-color: rgba(232, 168, 56, 0.5);
  background: rgba(232, 168, 56, 0.06);
}

.hud-critical.severity-critical {
  border-color: rgba(240, 113, 103, 0.5);
  background: rgba(240, 113, 103, 0.06);
}

.metric-strip {
  justify-content: flex-start;
  gap: 24px;
  padding: 12px 16px;
  border-top: 1px solid var(--outline-variant);
  flex-wrap: nowrap;
}

.metric-strip .metric-label {
  text-transform: none;
  letter-spacing: 0;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
}

.metric-strip .metric-value {
  font-size: 0.875rem;
}
```

- [ ] **Step 4: Run tests + build**

Run: `npm test && npm run build`  
Expected: all pass

---

### Task 7: OverviewView layout + motion

**Files:**
- Modify: `src/components/views/OverviewView.jsx`
- Modify: `src/index.css` (lower deck + xl anomaly sticky)

- [ ] **Step 1: Rewrite OverviewView**

```jsx
import { motion } from 'framer-motion'
import CorridorCommandDock from '../CorridorCommandDock'
import ClimatePanel from '../ClimatePanel'
import ControlPanel from '../ControlPanel'
import AnomalyStream from '../AnomalyStream'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'

const panelMotion = (i, reduced) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: 0.4 + i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
      }

export default function OverviewView(props) {
  const reduced = usePrefersReducedMotion()

  return (
    <>
      <div className="main-primary">
        <div className="overview-hero-dock">
          <CorridorCommandDock
            segments={props.segments}
            activeRiskIndex={props.activeRiskIndex}
            onSegmentClick={props.onSegmentClick}
          />
        </div>

        <div className="overview-lower-deck">
          <div className="overview-lower-row">
            <motion.div {...panelMotion(0, reduced)}>
              <ClimatePanel segments={props.segments} segmentHistory={props.segmentHistory} />
            </motion.div>
            <motion.div id="controls-panel" {...panelMotion(1, reduced)}>
              <div className="panel panel-calm controls-panel">
                <h2 className="panel-title-calm panel-title-inset">Injection controls</h2>
                <ControlPanel />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="main-secondary overview-anomaly-col">
        <motion.div {...panelMotion(2, reduced)} className="overview-anomaly-sticky">
          <AnomalyStream tickets={props.tickets} logs={props.logs} />
        </motion.div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Add lower-deck layout CSS**

```css
.overview-lower-deck {
  display: flex;
  flex-direction: column;
  gap: var(--gutter);
}

.overview-lower-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--gutter);
}

@media (min-width: 960px) {
  .overview-lower-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1280px) {
  .overview-anomaly-sticky {
    position: sticky;
    top: 16px;
  }
}

.panel-calm {
  border-radius: var(--panel-radius);
}
```

- [ ] **Step 3: Run full test suite**

Run: `npm test`  
Expected: 24+ tests pass (including new scrubRail tests)

---

### Task 8: Metric value spring + anomaly row motion (optional polish)

**Files:**
- Modify: `src/components/MetricBar.jsx`
- Modify: `src/components/AnomalyStream.jsx` (if list renders rows)

- [ ] **Step 1: Wrap metric values in motion.span**

```jsx
import { motion, useSpring, useTransform } from 'framer-motion'
// For each numeric value, use key={value} on motion.span with layout spring
// Skip if reduced motion — render plain span
```

- [ ] **Step 2: Animate new anomaly rows**

Wrap ticket/log row in `motion.li` with `initial={{ opacity: 0, y: -8 }}` / `animate={{ opacity: 1, y: 0 }}` — limit to items with `data-priority="P1"` getting amber border class.

- [ ] **Step 3: Verify reduced motion**

In browser devtools, enable `prefers-reduced-motion: reduce` — no transforms on enter.

---

### Task 9: Update DESIGN.md + final verification

**Files:**
- Modify: `docs/DESIGN.md`

- [ ] **Step 1: Update palette section in DESIGN.md**

Document new tokens, semantic color rules, Overview dock layout, and framer-motion usage.

- [ ] **Step 2: Full verification**

```bash
npm test
npm run build
```

Expected: all tests pass, build succeeds

- [ ] **Step 3: Manual checklist**

- [ ] No overlay text on corridor canvas
- [ ] Hero dock sticky while scrolling lower deck
- [ ] Scrub rail shows Live (teal) + frame + track
- [ ] Segment strip horizontal; clicks open Analysis
- [ ] xl: anomaly column sticky, not empty black
- [ ] Red only on critical/P1 elements

---

## Self-review (spec coverage)

| Spec requirement | Task |
|------------------|------|
| Palette shift | Task 1 |
| No canvas overlay | Task 4 |
| Scrub rail | Task 3 |
| Fixed 45vh canvas | Task 1, 4 |
| Sticky hero dock | Task 6, 7 |
| Horizontal segment strip | Task 6 |
| Metric strip | Task 6 |
| xl sticky anomaly | Task 7 |
| Framer Motion enter | Task 5, 7, 8 |
| prefers-reduced-motion | Task 2, 5, 7, 8 |
| Preserve scrub + WS behavior | Tasks 4–5 (no math changes) |
| Tests + build | Tasks 3, 6, 9 |

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-14-overview-calm-instrument.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration  
2. **Inline Execution** — implement tasks in this session with checkpoints

Which approach do you want?
