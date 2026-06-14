# RailTwin-X Lite — Complete Project Reference

> **Others monitor the rail. We monitor the ballast.**

This document is the single bottom-up reference for everything in this repository: what the project is, why it exists, how it was built, how it works, and what each file does.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Hackathon context (FAR AWAY 2026)](#2-hackathon-context-far-away-2026)
3. [Problem statement](#3-problem-statement)
4. [Product definition](#4-product-definition)
5. [What was explicitly rejected](#5-what-was-explicitly-rejected)
6. [Architecture overview](#6-architecture-overview)
7. [Data flow (end to end)](#7-data-flow-end-to-end)
8. [Backend (Python / FastAPI)](#8-backend-python--fastapi)
9. [Agents](#9-agents)
10. [Machine learning model](#10-machine-learning-model)
11. [Simulation engine](#11-simulation-engine)
12. [WebSocket contract](#12-websocket-contract)
13. [REST API](#13-rest-api)
14. [Frontend (Vite / React)](#14-frontend-vite--react)
15. [Physics and design depth](#15-physics-and-design-depth)
16. [Hardware (Round 2 path)](#16-hardware-round-2-path)
17. [Testing](#17-testing)
18. [Repository structure (every file)](#18-repository-structure-every-file)
19. [How to run](#19-how-to-run)
20. [Demo path](#20-demo-path)
21. [Demo video and assets](#21-demo-video-and-assets)
22. [Git history and deployment](#22-git-history-and-deployment)
23. [Honesty box (what is real vs simulated)](#23-honesty-box-what-is-real-vs-simulated)
24. [Build history (what was done)](#24-build-history-what-was-done)
25. [Planning evolution (v1 → v4)](#25-planning-evolution-v1--v4)
26. [Known limitations and troubleshooting](#26-known-limitations-and-troubleshooting)
27. [Round 2 roadmap (Delhi)](#27-round-2-roadmap-delhi)
28. [Submission checklist](#28-submission-checklist)
29. [Related documentation](#29-related-documentation)

---

## 1. Executive summary

**RailTwin-X Lite** is a FAR AWAY 2026 hackathon submission for the **Railways** theme. It fuses **monsoon hydrology** (rain + soil moisture) with **bogie vibration anomalies** to prioritize **track-bed maintenance** on a simulated 6-segment corridor (S1–S6).

The system uses:

- Three cooperating **agents** (hydrology, vibration, planner)
- A small **sklearn GradientBoostingClassifier** fusion model (`risk_model.joblib`)
- A **FastAPI** backend with WebSocket streaming
- A **Vite + React** control-room dashboard with SVG track map and CSS risk gauge

**GitHub:** https://github.com/Stormynubee/Faraway2026Japan  
**Round 1 goal:** Top 100 → Delhi offline round  
**Japan (Top 5):** Delhi live build — not Round 1 scope

---

## 2. Hackathon context (FAR AWAY 2026)

| Item | Detail |
|------|--------|
| **Organizer** | Zuup (youth-led NPO under Zylon Labs) |
| **Event** | FAR AWAY 2026 — international builder-first hackathon |
| **Theme selected** | **Railways** |
| **Submission** | GitHub repo + 2–5 min video (or ≤15 slides) via Unstop |
| **Rules** | https://faraway.zuup.dev/rules |
| **Judging criteria** | Innovation, engineering quality, real-world impact, scalability, UX, execution quality |
| **Advancement** | Top 100 teams → Delhi; ~2.3% of registered teams |
| **Red flags (DQ risk)** | Fake demos, idea-only PPT, AI wrappers, plagiarism, fabricated metrics |

---

## 3. Problem statement

Track-bed **mud pumping / ballast fouling** during monsoon degrades stiffness \(k_{\text{track}}\). Inspection trains pass **infrequently**; damage accelerates **between runs**. **On-train edge sensing + hydrology fusion** enables continuous maintenance priority updates without wiring every meter of rail.

**Pitch line:** "We don't inspect the steel rail once a month — we feel the ballast fail in real time."

**Failure mode focus:** Mud pumping / ballast fouling — **not** crack/buckle-only framing (that was rejected as misaligned with the demo).

---

## 4. Product definition

**One sentence:** RailTwin-X Lite fuses climate risk (rain + soil moisture) with bogie vibration anomalies — via physics-informed agents + a tiny sklearn fusion model — to prioritize track-bed maintenance on six corridor segments.

**Demo segment:** **S4** (middle of corridor) for monsoon inject.

**Tagline (used in README, UI, SUBMISSION.md, video):**

> Others monitor the rail. We monitor the ballast.

---

## 5. What was explicitly rejected

These were considered during planning but **cut from Round 1** to ship on time:

| Rejected | Reason |
|----------|--------|
| Full RailTwin-X (DenseNet, live CWT, Langfuse, SQLCipher) | Over-scoped for 18h build window |
| AetherMesh / logistics package barter | Wrong theme; separate product |
| Leaflet / Mapbox / Delhi GIS | Unnecessary for demo |
| Open-Meteo live API | Manual inject sufficient for R1 |
| ESP32 firmware on critical path | Round 2 |
| KiCad PCB layout | Schematic/docs only for R1 |
| TelemetryPanel chart UI | Cut for time; telemetry still emitted on WS |
| 10 segments | Reduced to 6 (S1–S6) |
| Dual-AI parallel build (Cursor + Antigravity) | Integration risk without WS contract first |

---

## 6. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (localhost:5173)                  │
│  TrackMap │ RiskGauge │ ControlPanel │ MaintenanceQueue         │
│                    useWebSocket hook                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │ WS /ws  +  REST /api/*
                            │ (Vite dev proxy in development)
┌───────────────────────────▼─────────────────────────────────────┐
│                   FastAPI (localhost:8000)                         │
│  main.py: lifespan, CORS, broadcast, REST inject, WS hub         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                   SimulationEngine (simulation.py)                 │
│  6 segments │ train tick 500ms │ az sampling │ event callback    │
└───────┬─────────────┬─────────────┬─────────────────────────────┘
        │             │             │
   HydrologyAgent  VibrationAgent  PlannerAgent
        │             │             │
        │             │             └──► risk_model.joblib (sklearn)
        │             │
        └─────────────┴──► segment_update, telemetry, tickets, logs
```

### Technology stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11+, FastAPI, uvicorn, asyncio |
| ML | scikit-learn GradientBoostingClassifier, joblib, numpy |
| Frontend | React 19, Vite 6, plain CSS |
| Real-time | WebSockets (native), JSON messages |
| Tests | pytest, httpx, FastAPI TestClient |
| Version control | Git → GitHub |

---

## 7. Data flow (end to end)

### Startup

1. `uvicorn server.main:app` starts FastAPI lifespan.
2. `SimulationEngine` is created with `on_event` callback → `broadcast()` to all WS clients.
3. Background `simulation_loop()` ticks every **500ms**.
4. Browser opens `npm run dev` → `useWebSocket` connects to `ws://localhost:5173/ws` (proxied to `:8000`).
5. Server sends **`state_snapshot`** with all segments, train, tickets, logs.

### Normal operation (each tick)

1. Train advances along S1→S6 (`progress` += 0.15 per tick).
2. Bogie `az` sampled (~0.3g + noise; spikes on degraded segments).
3. `VibrationAgent.push()` computes rolling z-score.
4. Events emitted: `telemetry`, `train_update`.
5. `PlannerAgent.evaluate()` may create P1/P2 ticket → `ticket`, `agent_log`, `segment_update`.

### Demo inject (user clicks button)

1. `ControlPanel` → `POST /api/inject/monsoon` with S4, rainfall=0.9, moisture=0.85.
2. `HydrologyAgent.evaluate()` → updates S4 risk, state, k_effective.
3. WS broadcasts `segment_update` + `agent_log` (hydrology).
4. User clicks **Force Anomaly** OR train crosses degraded S4 → vibration spike → P1 ticket.

---

## 8. Backend (Python / FastAPI)

### `server/main.py`

| Responsibility | Detail |
|----------------|--------|
| **Lifespan** | Creates `SimulationEngine`, starts async tick loop |
| **WebSocket hub** | `/ws` — accepts clients, sends snapshot on connect, keeps alive |
| **Broadcast** | `on_sim_event` → `asyncio.create_task(broadcast(event))` |
| **CORS** | Allows `localhost:5173` and `127.0.0.1:5173` |
| **REST** | `/health`, `/api/inject/monsoon`, `/api/inject/anomaly` |

### `server/models.py`

Dataclasses with `to_dict()` for JSON serialization:

- **`Segment`** — id, nominal_stiffness, rainfall, soil_moisture, risk_index, k_effective, state, force_anomaly
- **`Train`** — segment_id, progress (0–1)
- **`Ticket`** — id, priority (P1/P2), segment, reason, status, model_label
- **`AgentLog`** — agent name, message, timestamp

**State colors:**

| State | Hex |
|-------|-----|
| HEALTHY | `#22c55e` |
| WARNING_WATERLOGGING | `#eab308` |
| CRITICAL_MUD_PUMPING | `#ef4444` |

---

## 9. Agents

### HydrologyAgent (`server/agents/hydrology.py`)

**Purpose:** Fuse rainfall + soil moisture into track-bed risk.

**Formulas:**

```
H_i = α·R + β·M          (α=0.6, β=0.4)
k_effective = k_nominal · (1 - λ·H_i)   (λ=0.4)
```

**Classification:**

| risk_index | State |
|------------|-------|
| < 0.35 | HEALTHY |
| 0.35 – 0.70 | WARNING_WATERLOGGING |
| ≥ 0.70 | CRITICAL_MUD_PUMPING |

**Output:** risk_index, k_effective, state, human-readable description (% of nominal stiffness).

### VibrationAgent (`server/agents/vibration.py`)

**Purpose:** Detect bogie acceleration anomalies via rolling z-score.

| Parameter | Value |
|-----------|-------|
| Window size | 20 samples per segment |
| Threshold | z > 3.0 → anomaly |

**Input:** segment_id, az (vertical acceleration in g, simulated)  
**Output:** `{ anomaly, z_score, az }`

### PlannerAgent (`server/agents/planner.py`)

**Purpose:** Fuse hydrology + vibration + ML model → maintenance tickets.

**Logic:**

1. Call `predict_priority(rainfall, soil_moisture, z_score)` from ML model.
2. **P1** if model says P1 OR (CRITICAL hydrology AND vibration anomaly).
3. **P2** if model says P2 OR WARNING hydrology (with anomaly or non-healthy state).
4. Emit ticket with fused reason string and `model_label`.

---

## 10. Machine learning model

### Files

| File | Role |
|------|------|
| `server/agents/train_risk_model.py` | CLI: train once, save joblib |
| `server/agents/risk_model.py` | load, predict, train_and_save |
| `server/agents/risk_model.joblib` | Committed artifact (~186 KB) |

### Model

- **Algorithm:** `GradientBoostingClassifier(n_estimators=50, random_state=42)`
- **Features:** `[rainfall, soil_moisture, vib_z_score]`
- **Labels:** `OK`, `P2`, `P1`
- **Training data:** 503 synthetic samples from physics-aligned rules (500 random + 3 guaranteed edge cases)

**Label rules (training):**

```python
risk = 0.6 * r + 0.4 * s
k_eff = 100 * (1 - 0.4 * risk)
if risk >= 0.7 and z > 3.0:  → P1
elif k_eff < 65 or z > 3.0 or risk >= 0.35:  → P2
else:  → OK
```

**Honesty:** Trained on physics-derived synthetic data — not field-collected. Demonstrates fusion approach, not production ML pipeline.

**Train command:**

```bash
python -m server.agents.train_risk_model
```

---

## 11. Simulation engine

### `server/simulation.py` — `SimulationEngine`

| Method | Behavior |
|--------|----------|
| `tick()` | Advance train, sample az, push vibration, evaluate planner |
| `inject_monsoon(id, rain, moisture)` | Run hydrology, update segment, broadcast |
| `inject_anomaly(id)` | Force spike on segment, evaluate immediately |
| `state_snapshot()` | Full WS sync payload |
| `active_risk_index()` | max(risk_index) across segments — drives gauge |

**Segments:** S1, S2, S3, S4, S5, S6  
**Train movement:** progress += 0.15/tick; wraps to next segment at 1.0  
**Vibration spikes:** When `risk_index > 0.7` or `force_anomaly`, az gets +1.2–2.5g bump  
**Random seed:** 7 (reproducible demo)

---

## 12. WebSocket contract

**Canonical doc:** [docs/ws-schema.md](ws-schema.md)

| Message type | When emitted | Key fields |
|--------------|--------------|------------|
| `state_snapshot` | On WS connect | segments[], train, tickets[], logs[], active_risk_index |
| `segment_update` | Hydrology or planner changes segment | id, risk_index, k_effective, state, color |
| `telemetry` | Every tick | segment, az, z_score, timestamp |
| `train_update` | Every tick | segment_id, progress |
| `ticket` | Planner creates maintenance item | id, priority, segment, reason, model_label |
| `agent_log` | Any agent action | agent, message, timestamp |

**Dev URL:** Browser connects to `ws://localhost:5173/ws` → Vite proxies to `ws://localhost:8000/ws`.

---

## 13. REST API

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/health` | — | `{ status: "ok", service: "railtwin-x-lite" }` |
| POST | `/api/inject/monsoon` | `{ segment_id, rainfall, soil_moisture }` | `{ ok, segment, hydrology }` |
| POST | `/api/inject/anomaly` | `{ segment_id }` | `{ ok, segment, vibration }` |

**Example monsoon inject:**

```bash
curl -X POST http://localhost:8000/api/inject/monsoon \
  -H "Content-Type: application/json" \
  -d '{"segment_id":"S4","rainfall":0.9,"soil_moisture":0.85}'
```

---

## 14. Frontend (Vite / React)

### Entry

- `index.html` → `src/main.jsx` → `src/App.jsx`
- Styles: `src/index.css` (dark control-room theme)

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **TrackMap** | `src/components/TrackMap.jsx` | SVG polyline S1–S6, colored circles, animated train dot |
| **RiskGauge** | `src/components/RiskGauge.jsx` | CSS conic gradient + animated needle from `activeRiskIndex` |
| **ControlPanel** | `src/components/ControlPanel.jsx` | Inject Monsoon S4, Force Anomaly S4 (diagnostic) |
| **MaintenanceQueue** | `src/components/MaintenanceQueue.jsx` | P1/P2 tickets + scrollable agent log |

### `useWebSocket` hook (`src/hooks/useWebSocket.js`)

- Connects on mount, reconnects after 2s on close
- Merges incoming events into React state
- `activeRiskIndex` = max from snapshot + segment updates (drives gauge needle)

### Vite proxy (`vite.config.js`)

```javascript
proxy: {
  '/api': 'http://localhost:8000',
  '/ws': { target: 'ws://localhost:8000', ws: true },
  '/health': 'http://localhost:8000',
}
```

**Note:** If frontend starts before backend, you may see `[vite] ws proxy socket error: ECONNABORTED` — harmless; reconnects when backend is up.

---

## 15. Physics and design depth

**Full document:** [docs/physics.md](physics.md)

Covers (design appendix — not all implemented in Round 1 runtime):

1. **Euler-Bernoulli beam on Winkler foundation** — rail deflection PDE
2. **Mud pumping** — k_track → 0, increased az at bogie
3. **CWT (Continuous Wavelet Transform)** — Phase 2 vision pipeline (not live in R1)
4. **Hydrology index H_i** — matches implemented agent (α=0.6, β=0.4, λ=0.4)

---

## 16. Hardware (Round 2 path)

**Doc:** [hardware/README.md](../hardware/README.md)

| Part | Role |
|------|------|
| ESP32-S3 DevKit | Edge compute + WiFi |
| MPU6050 (I2C) | 6-axis IMU — axle-box acceleration |
| 3.3V LDO | Power |
| JST/header | Wagon harness connector |

**Round 1:** Simulation only. KiCad schematic planned but not committed — BOM and interface documented.

**Planned telemetry JSON (R2):** `{ "az": float, "segment_hint": "S4" }`

---

## 17. Testing

**Run:** `python -m pytest tests/ -v`  
**Expected:** 9 tests passing

| Test file | What it verifies |
|-----------|------------------|
| `test_hydrology.py` | Stiffness description as % of nominal; CRITICAL at high risk |
| `test_vibration.py` | Z-score anomaly when az spikes |
| `test_planner.py` | P1 ticket on CRITICAL + vibration |
| `test_risk_model.py` | Model predicts P1 for high-risk inputs; OK for low |
| `test_api_inject.py` | Health, monsoon inject REST, WS snapshot + segment_update |

**TDD approach:** Agent and API tests written first; UI exempt (exploratory CSS).

---

## 18. Repository structure (every file)

```
Faraway2026Japan/
├── README.md                 # Quick start, tagline, honesty box
├── requirements.txt          # Python dependencies
├── package.json              # Node dependencies + scripts
├── package-lock.json
├── vite.config.js            # Dev server + API/WS proxy
├── index.html                # Vite entry HTML
├── .gitignore
│
├── server/
│   ├── __init__.py
│   ├── main.py               # FastAPI app, WS hub, REST inject
│   ├── simulation.py         # SimulationEngine — core loop
│   ├── models.py             # Segment, Train, Ticket, AgentLog
│   └── agents/
│       ├── __init__.py
│       ├── hydrology.py      # HydrologyAgent
│       ├── vibration.py      # VibrationAgent (z-score)
│       ├── planner.py        # PlannerAgent + ML fusion
│       ├── risk_model.py     # load/predict/train sklearn model
│       ├── train_risk_model.py  # CLI trainer
│       └── risk_model.joblib    # Serialized GBM (committed)
│
├── tests/
│   ├── __init__.py
│   ├── test_hydrology.py
│   ├── test_vibration.py
│   ├── test_planner.py
│   ├── test_risk_model.py
│   └── test_api_inject.py
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── hooks/
│   │   └── useWebSocket.js
│   └── components/
│       ├── TrackMap.jsx
│       ├── RiskGauge.jsx
│       ├── ControlPanel.jsx
│       └── MaintenanceQueue.jsx
│
├── docs/
│   ├── PROJECT.md            # ← this file
│   ├── physics.md            # Math/physics design appendix
│   ├── ws-schema.md          # WebSocket message contract
│   ├── SUBMISSION.md         # Judge runbook + QA checklist
│   └── DEMO_SCRIPT.md        # Video recording script
│
├── hardware/
│   └── README.md             # ESP32 + MPU6050 Round 2 BOM
│
├── assets/
│   ├── README.md             # How to record fallback demo
│   ├── demo.mp4              # Primary demo video (placeholder — re-record with OBS)
│   ├── demo_fallback.mp4     # Backend safety-net video
│   └── fallback_demo_log.txt  # pytest output log (gitignored)
│
└── scripts/
    └── capture_fallback_log.ps1  # Runs pytest → assets/fallback_demo_log.txt
```

**Not in repo (gitignored):** `node_modules/`, `dist/`, `.pytest_cache/`, `.cursor/`, `.research/`

---

## 19. How to run

### Prerequisites

- Python 3.11+ (3.14 tested)
- Node.js 18+ with npm

### Backend

```bash
python -m pip install -r requirements.txt
python -m server.agents.train_risk_model   # ensures risk_model.joblib exists
python -m uvicorn server.main:app --reload --port 8000
```

### Frontend (separate terminal)

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

### Production build (optional)

```bash
npm run build    # outputs to dist/
npm run preview  # serve static build
```

Note: production build expects backend at `ws://localhost:8000/ws` directly (see `useWebSocket.js`).

---

## 20. Demo path

The story judges should see:

1. **Baseline** — All segments green; train moving S1→S6; gauge low; WebSocket connected.
2. **Inject Severe Monsoon on S4** — S4 turns yellow/red; hydrology log; gauge needle swings.
3. **Anomaly** — Train hits S4 OR click **Force Anomaly S4 (diagnostic)** → vibration log → z-score spike.
4. **Planner** — P1 ticket appears with ML fusion reason and `model_label`.
5. **Agent log chain** — hydrology → vibration → planner (traceability).

**Backup if UI fails:** `POST /api/inject/anomaly` + terminal demo using `assets/demo_fallback.mp4`.

---

## 21. Demo video and assets

| Asset | Purpose | Status |
|-------|---------|--------|
| `assets/demo.mp4` | Primary Unstop submission video | Placeholder (ffmpeg title card) — **re-record with OBS 1080p + voiceover** |
| `assets/demo_fallback.mp4` | Safety net if React breaks | Same placeholder |
| `docs/DEMO_SCRIPT.md` | Beat-by-beat recording script | Complete |
| `scripts/capture_fallback_log.ps1` | Capture pytest log for terminal demo | Complete |

**Recording spec:** OBS Studio, 1920×1080, voiceover required, 2–4 minutes.

---

## 22. Git history and deployment

**Remote:** https://github.com/Stormynubee/Faraway2026Japan.git  
**Branch:** `main`

### Implementation commits (June 2026 build)

| Commit | Message |
|--------|---------|
| `10148d0` | feat: hydrology agent, physics appendix, ws schema |
| `c804f65` | feat: simulation loop, ml risk model, websocket hub |
| `dce331f` | feat: dashboard with risk gauge and websocket client |
| `5fe0be0` | docs: submission guide, demo assets, and readme |

Earlier commits were generic FAR AWAY hackathon README boilerplate.

**Push:** `git push origin main`

---

## 23. Honesty box (what is real vs simulated)

| Claim | Reality |
|-------|---------|
| Track-bed mud pumping problem | Real failure mode; documented in physics.md |
| Hydrology fusion | **Real logic** — implemented agent with documented formulas |
| Bogie vibration | **Simulated** — random az with physics-informed spikes |
| ML model | **Real sklearn** — trained on **synthetic** physics-derived labels |
| 6-segment corridor | **Simulated** — not real GIS or Indian Railways data |
| ESP32 + MPU6050 | **Documented** for Round 2 — not wired in Round 1 |
| CWT / DenseNet | **Design doc only** (physics.md Phase 2) — not in runtime |
| Live weather API | **Not connected** — manual monsoon inject button |
| Demo video | Placeholder — must re-record live UI walkthrough |

---

## 24. Build history (what was done)

Chronological implementation (v4 plan execution):

1. **Phase 0 — Foundation**
   - Fixed hydrology description bug (% of nominal stiffness)
   - Created `docs/ws-schema.md` as single source of truth
   - Added `requirements.txt`, `__init__.py` files
   - TDD: `tests/test_hydrology.py`

2. **Phase 1 — Backend**
   - `SimulationEngine` with 6 segments, 500ms tick
   - `HydrologyAgent`, `VibrationAgent`, `PlannerAgent`
   - `train_risk_model.py` + committed `risk_model.joblib`
   - `main.py` FastAPI + WebSocket + REST inject
   - Tests: vibration, planner, risk_model, api_inject (9/9 green)

3. **Phase 2 — Frontend**
   - Vite + React scaffold (manual — non-empty repo blocked create-vite)
   - TrackMap SVG, RiskGauge CSS needle, ControlPanel, MaintenanceQueue
   - `useWebSocket` hook with reconnect

4. **Phase 3 — Demo**
   - `docs/DEMO_SCRIPT.md`
   - Placeholder `demo.mp4` / `demo_fallback.mp4` via ffmpeg
   - `scripts/capture_fallback_log.ps1`

5. **Phase 4 — Docs**
   - Rewrote `README.md` with tagline and quick start
   - `docs/SUBMISSION.md` with criteria mapping + QA checklist
   - `hardware/README.md` Round 2 BOM

6. **Phase 5 — GitHub**
   - 4 feature commits pushed to origin/main
   - Repo description updated via `gh repo edit`

### Skills installed (optional agent guidance)

- `fastapi-async-patterns`
- `react-vite-best-practices`
- `hackathon-submission-prep`

---

## 25. Planning evolution (v1 → v4)

| Version | Key additions |
|---------|---------------|
| **v1** | WS contract-first, milestone phases, risk register |
| **v2** | Opus critique: time math, hydrology fix, OBS video spec, mandatory cuts |
| **v3** | find-skills stack, SWOT, TDD gates, creative-qa checklist |
| **v4** | ML model, risk gauge, 6 segments, fallback demo, narrative lock, scope cuts |

**Meta-score target:** 9.5/10 shippable for FAR AWAY Top 100 bid.

---

## 26. Known limitations and troubleshooting

### WebSocket `ECONNABORTED` in Vite console

**Cause:** Frontend started before backend, or reconnect during HMR.  
**Fix:** Start uvicorn first; wait for "WebSocket: connected" in UI.

### Gauge doesn't move after monsoon

**Check:** `activeRiskIndex` updates on `segment_update`. Inject on S4 with high rain/moisture (0.9/0.85) → risk_index ~0.88.

### No P1 ticket

**Try:** Click **Force Anomaly S4** after monsoon inject, or wait for train to cross S4 with degraded ballast.

### pytest import errors

**Fix:** Use same Python: `python -m pip install -r requirements.txt` then `python -m pytest tests/ -v`.

### npm audit vulnerabilities

Dev dependency warnings — do not `npm audit fix --force` before submission without testing.

---

## 27. Round 2 roadmap (Delhi)

If advancing to Top 100 → 24h live build in Delhi:

- Real MPU6050 serial ingest on ESP32-S3
- Open-Meteo / IMD rainfall API
- KiCad schematic → PCB fabrication
- LoRa for non-GSM corridors (optional)
- Live CWT batch pipeline (see physics.md)
- Fleet-wide segment scaling
- Langfuse agent traceability (optional)

---

## 28. Submission checklist

From [docs/SUBMISSION.md](SUBMISSION.md) — mark Pass before Unstop upload:

| # | Check |
|---|-------|
| 1 | Fresh clone → demo < 10 min |
| 2 | Video actions match code |
| 3 | No fabricated metrics |
| 4 | pytest 9/9 green |
| 5 | Tagline in README + UI + SUBMISSION |
| 6 | GitHub public, latest push |
| 7 | Backup inject + fallback video exist |
| 8 | Unstop: repo + video + **Railways** theme |

**Unstop:** https://faraway.zuup.dev (or platform link from registration)

---

## 29. Related documentation

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Quick start |
| [docs/SUBMISSION.md](SUBMISSION.md) | Judge-facing runbook |
| [docs/ws-schema.md](ws-schema.md) | WebSocket contract |
| [docs/physics.md](physics.md) | Design depth / math |
| [docs/DEMO_SCRIPT.md](DEMO_SCRIPT.md) | Video script |
| [hardware/README.md](../hardware/README.md) | Edge node Round 2 |
| [assets/README.md](../assets/README.md) | Fallback demo recording |

---

*Last updated: June 2026 — RailTwin-X Lite v1.0.0 for FAR AWAY 2026 Railways theme.*
