# Design System: Bogie Flow — Climate-Aware Rail Analytics

**Project ID:** 7375917004327909132 (Stitch)

## 1. Visual Theme & Atmosphere

Surgical command-center aesthetic: charcoal surfaces, coral-red accent lines, monospace telemetry readouts. Dense but disciplined — industrial utilitarian, not decorative. No purple gradients, no x-ray wireframe overlays on 3D.

## 2. Color Palette & Roles

| Token | Hex | Role |
|-------|-----|------|
| background / surface | `#121317` | App shell |
| surface-container | `#1e1f23` | Panels |
| primary (coral) | `#ffb4aa` | Accent, alerts, active nav |
| primary-container | `#ff5545` | Critical highlights |
| on-surface | `#e3e2e7` | Body text |
| on-surface-variant | `#e7bdb7` | Labels |
| outline-variant | `#5d3f3b` | Borders |
| healthy | `#22c55e` | Segment OK |
| warning | `#eab308` | Segment warning |
| critical | `#ef4444` | Segment critical |

## 3. Typography

- **Display / UI:** Hanken Grotesk (600–700 headings, 400 body)
- **Telemetry:** JetBrains Mono (labels, timestamps, data readouts)
- **Icons:** Material Symbols Outlined (weight 300)

## 4. Component Stylings

- **Panels:** 2px radius, 1px outline-variant border, subtle glass gradient optional
- **3D viewport:** Solid Phong materials, slow rotation (~0.001 rad/frame), no mix-blend-screen
- **Buttons:** Label-caps mono, coral primary actions

## 5. Layout

- Left docked sidebar (256px), top bar, scrollable main grid (8+4 columns on xl)
- Fixed footer telemetry strip
