# Design System: Bogie Flow — Climate-Aware Rail Analytics

**Project ID:** 7375917004327909132 (Stitch)

## 1. Visual Theme & Atmosphere

Surgical command-center aesthetic: deep charcoal surfaces, coral-red accent lines, monospace telemetry readouts. Dense but disciplined — industrial utilitarian, not decorative. No purple gradients, no x-ray wireframe overlays, no glassmorphism blur, no CRT flicker effects.

## 2. Color Palette & Roles

| Token | Hex | Role |
|-------|-----|------|
| background | `#08090b` | App shell |
| surface | `#0e1014` | Topbar, deep wells |
| surface-container | `#151720` | Panels |
| surface-container-low | `#0c0d10` | Sidebar, insets |
| surface-container-high | `#1c1e28` | Hover states |
| surface-dim | `#0a0b0e` | Footer, panel heads |
| surface-variant | `#282a30` | Internal borders |
| primary | `#ff5545` | Accent, alerts, active nav |
| primary-container | `#cc3c2e` | Critical highlights, CTA |
| on-surface | `#e2e4e9` | Body text |
| on-surface-variant | `#9098a8` | Labels, muted text |
| outline-variant | `#232630` | Panel borders |
| healthy | `#22c55e` | Segment OK |
| warning | `#eab308` | Segment warning |
| critical | `#ef4444` / `#FF3B30` | Anomaly sphere, alerts |

## 3. Typography

- **Display / UI:** Hanken Grotesk (600–700 headings, 400 body)
- **Telemetry:** JetBrains Mono — label-caps (12px, 0.1em tracking), data-readout (14px), data-readout-lg (18px)
- **Icons:** Material Symbols Outlined (weight 300)

## 4. Component Stylings

- **Panels:** 6px radius, 1px outline-variant border, hover lift on border-color
- **Panel heads:** solid `surface-dim` background, no alpha transparency
- **3D viewport:** Solid Phong materials, solid `#08090b` scene background with ground plane, hemisphere + directional lighting, single smooth scale pulse on anomaly sphere, no mix-blend-screen or emissive flicker. Drag-orbit, wheel zoom, segment raycast pick.
- **Segment HUD:** Clean cells with critical state indicated by border color only — no backdrop-filter blur, no box-shadow glow
- **MetricBar:** Three mono readouts derived from live `vib_z`, `az`, and `risk_index`
- **Charts:** Telemetry history buffer (24 samples) drives moisture sparkline; corridor S1–S6 rainfall bars; soil-rain correlation from segment history or snapshot

## 5. Timing Tokens

- `--transition-fast: 150ms ease` — border, background, color transitions
- `--transition-normal: 250ms ease` — larger layout transitions
- Boot loader: 4-second auto-handoff, no manual CTA

## 6. Layout

- Left docked sidebar (256px), top bar with open-ticket chip, scrollable main grid (8+4 columns on xl)
- Footer as flex child within workspace (not position:fixed)
- Four views: Overview, Analysis, Maintenance, Climate

## 7. Data flow

- WebSocket `telemetry` merges `z_score`/`az` into segments and rolling history
- `segment_update` includes hydrology + vibration fields
- AUTHORIZE DEPLOYMENT → `POST /api/inject/anomaly`
