# Design Spec: Overview Calm Instrument Panel Redesign

Redesign the Bogie Flow **Overview** view to a calm, readable instrument-panel aesthetic: fixed-height corridor hero, docked telemetry, semantic color (teal/amber/red), no canvas overlay clutter, and polished Framer Motion reveals. All live WebSocket data and scrub behavior are preserved.

## Decisions (approved)

| Topic | Choice |
|-------|--------|
| Macro direction | **A — Calm instrument panel** (quiet slate, minimal chrome) |
| Layout approach | **2 — Fixed-height hero + docked telemetry** |
| Primary accent | **Teal `#3dd6c6`** — live, interactive, focus |
| Attention | **Amber `#e8a838`** — warnings, elevated risk |
| Critical only | **Soft red `#f07167`** — P1 tickets, highest-severity segments |
| Healthy | **`#34d399`** — nominal segments |
| Canvas overlay | **Removed** — scrub rail below canvas, no text on image |
| Frame scrub | **Manual only** — unchanged; not WebSocket-synced |
| Motion | **Framer Motion** on DOM chrome; canvas stays rAF + double-lerp |
| Boot loader | **Out of scope** — user likes current boot |
| Other views | **Token + panel chrome only** — no full layout rewrite in this spec |

## Goal

Operators get a corridor-first Overview that is easier to read at a glance: the train image stays clean, scrub controls sit in a thin rail, segments and key metrics form a compact dock under the hero, and red is reserved for true critical states. Lower-deck panels (climate, controls, anomaly) use the same calmer visual language.

## Non-goals

- Re-syncing frame index to WebSocket train position
- Full redesign of Analysis, Climate, or Maintenance layouts (token pass only)
- Replacing Hanken Grotesk / JetBrains Mono typefaces
- Changing backend or WebSocket protocol

---

## Section 1: Visual language

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0a0e12` | App background |
| `--surface-container` | `#111820` | Panel fill |
| `--surface-container-high` | `#161f2a` | Raised cells |
| `--outline-variant` | `#243041` | Borders |
| `--on-surface` | `#e8edf4` | Primary text |
| `--on-surface-variant` | `#8b99aa` | Labels |
| `--accent` | `#3dd6c6` | Live, scrub focus, interactive hover |
| `--accent-warm` | `#e8a838` | Warnings, elevated segments |
| `--color-critical` | `#f07167` | Critical / P1 only |
| `--color-healthy` | `#34d399` | Nominal segments |

**Semantic rule:** Red never used for decorative chrome, LIVE badges, or default hover states.

### Typography

- Panel titles: **sentence case** (“Corridor feed”), sans, 600 weight
- Labels: sans or muted mono; **not** all-caps unless segment ID (`S1`)
- Values: mono only (`19 / 64`, `0.42 mm`, `68%`, `31°C`)
- Drop redundant subtitle lines where the scrub rail already communicates state

### Canvas + scrub rail

```
┌─────────────────────────────────────┐
│  [canvas — no overlay text]         │
├─────────────────────────────────────┤
│ ● Live   Frame 19 / 64  ═══●══════  │
└─────────────────────────────────────┘
```

- Optional bottom vignette on canvas (CSS gradient) to attach rail visually
- First-interaction hint: panel subtitle fades after scrub; one-time teal pulse on track handle
- Canvas hover: subtle teal outline (not red)

---

## Section 2: Layout (Approach 2)

### Hero dock (sticky)

| Zone | Height | Notes |
|------|--------|-------|
| Canvas | `clamp(280px, 45vh, 520px)` | Fixed; letterboxed 16:9 |
| Scrub rail | `44px` | LIVE + frame readout + progress track |
| Segment strip | `72px` | 6 cells, horizontal scroll on narrow |
| Metric strip | `56px` | Peak amplitude · fatigue · bearing temp |
| **Total dock** | ~`52vh` | `position: sticky; top: 0` on Overview |

### Lower deck (scrolls)

- **≥960px:** Climate and Injection controls side by side
- **Anomaly stream:** full width below on mobile/tablet
- **≥1280px:** Anomaly stream in right column (`340px`), sticky while left column scrolls

### Component map

| Current | New / modified |
|---------|----------------|
| `OverviewView.jsx` | Orchestrates dock + lower deck + motion |
| `CorridorScrubViewer.jsx` | Canvas only — overlay removed |
| *(new)* `CorridorScrubRail.jsx` | Progress track, LIVE pill, frame readout |
| *(new)* `CorridorCommandDock.jsx` | Header + canvas + rail + strips |
| `SegmentHudGrid.jsx` | Becomes horizontal **segment strip** (same click handler) |
| `MetricBar.jsx` | Compact **metric strip** styling |
| `ClimatePanel`, `ControlPanel`, `AnomalyStream` | Calmer panel tokens; behavior unchanged |

### Preserved behavior

- 64-frame scrub: page scroll, wheel, horizontal pointer on canvas
- Segment click → Analysis view
- WebSocket: segments, metrics, charts, injection, tickets, logs
- `sessionStorage` hint dismiss for first scrub interaction

---

## Section 3: Motion & reveals

### Principles

- Motion explains structure; respect `prefers-reduced-motion`
- Canvas blending unchanged (`corridorDraw.js` + rAF)
- Charts and sidebar/topbar not animated

### Enter sequence (Overview mount)

| Element | Animation | Delay |
|---------|-----------|-------|
| Hero dock shell | fade up 12px | 0ms |
| Canvas | opacity | +80ms |
| Scrub rail | slide up 8px | +120ms |
| Segment cells | stagger L→R | +160ms, 40ms each |
| Metric strip | fade in | +320ms |
| Lower panels | stagger fade up | +400ms, 60ms each |

Ease: `[0.22, 1, 0.36, 1]`, ~400ms duration.

### Interactions

- **Scrub track:** fill follows `displayProgress` via DOM/rAF (150ms CSS ease on discrete jumps)
- **Segment hover:** scale 1.02, teal border, 150ms
- **Segment click:** tap scale 0.98 → 1
- **Metric values:** spring on WebSocket updates (`stiffness: 400, damping: 30`)
- **Anomaly rows:** slide in from top, 250ms; P1 gets amber accent flash once

### Dependency

- Add `framer-motion` to `package.json`

---

## Acceptance criteria

1. No text or badges rendered on top of the corridor canvas image
2. Hero dock stays visible (sticky) while scrolling climate/controls/anomaly
3. Canvas height locked to `clamp(280px, 45vh, 520px)` — no `--hero-min-height` growth on Overview
4. Segment strip is a single horizontal row; scrolls horizontally below 900px if needed
5. Red appears only on critical segments and P1 anomaly items — not LIVE, not default hovers
6. All 24 existing Vitest tests pass; `npm run build` succeeds
7. `prefers-reduced-motion: reduce` disables stagger/spring transforms

---

## Related docs

- Prior scrub spec: `docs/superpowers/specs/2026-06-14-corridor-scrub-dashboard-design.md`
- Implementation plan: `docs/superpowers/plans/2026-06-14-overview-calm-instrument.md`
- Update `docs/DESIGN.md` tokens section after implementation
