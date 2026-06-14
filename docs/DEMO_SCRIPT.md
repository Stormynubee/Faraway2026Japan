# Bogie Flow — 2-minute demo beat sheet (OBS 1920×1080)

**Hook:** "Others monitor the rail. We monitor the ballast."

Record with backend + frontend running (`npm run dev:all`) or a deployed single-URL instance. Optional auto-demo: append `?demo=monsoon-sweep` to the URL.

---

## Beat 1 — Hook + baseline (0:00–0:20)

**Say:** "Bogie Flow predicts track-bed failure before the inspection train arrives — fusing monsoon hydrology, bogie vibration, and an ML fusion model."

| # | Action | UI target |
|---|--------|-----------|
| 1 | Wait for boot loader to finish | Full-screen boot → dashboard |
| 2 | Point at hero line | `data-testid="hero-status-line"` — corridor status |
| 3 | Point at risk gauge | `data-testid="risk-gauge-dial"` — low needle, green segments |
| 4 | Scroll the corridor scrub | Page scroll or Shift+wheel on corridor image — `CorridorCommandDock` |

**On screen:** All segments green/nominal, train moving S1→S6, Impact panel showing baseline estimates.

---

## Beat 2 — Inject monsoon (0:20–0:50)

**Say:** "We simulate a monsoon cell hitting segment S4 — the same REST inject a field gateway would trigger."

| # | Action | UI target |
|---|--------|-----------|
| 5 | Scroll to **Test scenarios** panel | `data-testid="simulation-demo-panel"` |
| 6 | Click **Heavy rain · S4** | `data-testid="inject-monsoon-s4"` |
| 7 | Watch toast | `data-testid="toast-stack"` — "Scenario sent to simulation" |
| 8 | Point at gauge + segment strip | Needle rises; S4 reddens (`data-testid="risk-gauge"`) |
| 9 | Open **Risk forecast** panel | `data-testid="forecast-panel"` — S4 ranked in **Inspect next**, ETA shortens |
| 10 | Open **Quantified impact** | `data-testid="impact-panel"` — prevented-cost $ rises (labeled estimates) |

---

## Beat 3 — Agent fusion → P1 ticket (0:50–1:15)

**Say:** "Hydrology and vibration agents fuse; GradientBoosting opens a prioritized maintenance ticket."

| # | Action | UI target |
|---|--------|-----------|
| 11 | Click **Track fault · S4** (optional, speeds P1) | `data-testid="inject-anomaly-s4"` |
| 12 | Click sidebar **Maintenance** | `data-testid="nav-maintenance"` |
| 13 | Show P1 row | `data-testid="ticket-row-T-xxx"` — priority chip P1 |
| 14 | Click **Explain** on the ticket | `data-testid="ticket-explain-T-xxx"` |
| 15 | Read factors + importances | hydrology_index, vib_z, k_effective, model feature % |
| 16 | Scroll agent logs | `#network-logs` — hydrology → vibration → planner chain |

---

## Beat 4 — Predict + recover (1:15–1:50)

**Say:** "We forecast risk thirty minutes ahead, quantify avoided failure cost, and tickets auto-close when the decay model recovers the segment."

| # | Action | UI target |
|---|--------|-----------|
| 17 | Back to **Overview** | `data-testid="nav-overview"` |
| 18 | Point at forecast sparklines | `data-testid="forecast-row-S4"` |
| 19 | Point at impact formulas | inline assumptions under each metric |
| 20 | Wait ~30–60 s (or click **Reset corridor**) | `data-testid="scenario-reset"` in Scenario replay |
| 21 | Show ticket closed + gauge drops | toast "Ticket closed — segment recovered" |

---

## Beat 5 — Close (1:50–2:00)

**Say:** "One URL — clone, `npm run dev:all`, or deploy the Docker image. FAR AWAY 2026, Railways theme."

| # | Action | UI target |
|---|--------|-----------|
| 22 | Optional: open guide FAB | `data-testid="guide-fab"` — ask "Why was S4 flagged P1?" |
| 23 | End card | GitHub repo + live deploy URL |

---

## Recording checklist

- [ ] Voiceover audible; clicks match this script exactly
- [ ] Every `data-testid` above exists in the running build
- [ ] No fabricated metrics — Impact labeled "estimates"
- [ ] Backup: `assets/demo_fallback.mp4` if live WS fails

## One-liner deploy URL

After Render/Railway deploy: `https://<your-service>/` — same origin serves UI, `/api/*`, and `/ws`.

Auto-demo link for judges: `https://<your-service>/?demo=monsoon-sweep`
