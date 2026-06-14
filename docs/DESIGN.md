# Design System: Bogie Flow — Climate-Aware Rail Analytics

**Project ID:** 7375917004327909132 (Stitch)

## 1. Visual Theme & Atmosphere

Calm instrument panel: blue-slate surfaces, teal live accent, semantic amber/red for warnings and critical only. Dense but readable — industrial utilitarian, not alarmist. Overview uses a fixed-height corridor hero dock with scrub rail below the canvas (no overlay on the train image).

## 2. Color Palette & Roles

| Token | Hex | Role |
|-------|-----|------|
| background | `#0a0e12` | App shell |
| surface-container | `#111820` | Panels |
| surface-container-high | `#161f2a` | Hover states |
| accent (primary) | `#3dd6c6` | Live, interactive, focus |
| accent-warm | `#e8a838` | Warnings, elevated segments |
| on-surface | `#e8edf4` | Body text |
| on-surface-variant | `#8b99aa` | Labels |
| outline-variant | `#243041` | Panel borders |
| healthy | `#34d399` | Segment OK |
| warning | `#e8a838` | Segment warning |
| critical | `#f07167` | P1 tickets, critical segments only |

**Semantic rule:** Red is reserved for critical/P1. Teal indicates live and interactive. Amber indicates watch/elevated risk.

## 3. Typography

- **Display / UI:** Hanken Grotesk (600 headings, sentence case panel titles)
- **Telemetry:** JetBrains Mono — frame counts, mm, °C, segment values only
- **Icons:** Material Symbols Outlined (weight 300)

## 4. Component Stylings

- **Corridor command dock:** Sticky hero (~52vh): canvas `clamp(280px, 45vh, 520px)` + scrub rail + horizontal segment strip + metric strip
- **CorridorScrubViewer:** Canvas only — no text overlay on image
- **CorridorScrubRail:** LIVE pill, frame readout, progress track (rAF-driven fill)
- **Segment HUD:** Horizontal strip on Overview; grid layout on other views if reused
- **MetricBar:** Three mono readouts from live `vib_z`, `az`, `risk_index`
- **Motion:** Framer Motion enter stagger on Overview; `prefers-reduced-motion` disables transforms

## 5. Timing Tokens

- `--transition-fast: 150ms ease`
- `--transition-normal: 250ms ease`
- Boot loader: 3-second auto-handoff with Continue button

## 6. Layout

- Left sidebar, top bar, scrollable main grid (1fr + 340px anomaly column on xl)
- Overview: sticky hero dock + scrollable climate/controls; sticky anomaly column xl+
- Four views: Overview, Analysis, Maintenance, Climate

## 7. Data flow

- WebSocket telemetry → segments, metrics, charts (unchanged)
- Corridor frame index: **manual scrub only** — scroll, wheel, pointer, scrub rail
