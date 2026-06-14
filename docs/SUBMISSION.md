# FAR AWAY 2026 — Submission Guide

## Executive summary

**Others monitor the rail. We monitor the ballast.**

Bogie Flow fuses monsoon hydrology with bogie vibration anomalies to prioritize track-bed maintenance on a simulated 6-segment Indian Railways corridor. Three cooperating agents (hydrology, vibration, planner) plus a **sklearn GradientBoosting** fusion model produce P1/P2 maintenance tickets in real time via FastAPI WebSocket.

**GitHub:** https://github.com/Stormynubee/Faraway2026Japan  
**Theme:** Railways  
**Video:** `assets/demo.mp4` (or `assets/demo_fallback.mp4`)

---

## Problem

Track-bed **mud pumping / ballast fouling** during monsoon degrades stiffness \(k_{\text{track}}\). Inspection trains pass infrequently; failure accelerates between runs. On-train edge sensing + hydrology fusion enables continuous maintenance priority without wiring every meter of rail.

---

## Architecture

- **Backend:** FastAPI, async simulation loop (500ms tick), WebSocket hub  
- **Agents:** HydrologyAgent, VibrationAgent (z-score), PlannerAgent + `risk_model.joblib`  
- **Frontend:** Vite + React — SVG track map, CSS risk gauge, inject controls, ticket queue  
- **Contract:** [ws-schema.md](ws-schema.md)  

---

## How to run (< 10 minutes)

```bash
git clone https://github.com/Stormynubee/Faraway2026Japan.git
cd Faraway2026Japan
python -m pip install -r requirements.txt
npm install
npm run dev:all
```

Open http://localhost:5173 → **Heavy rain · S4** (`inject-monsoon-s4`) → Maintenance → **Explain** on P1 ticket → Overview **Impact** / **Forecast** panels.

Production single-URL: `npm run build && npm start` → http://localhost:8000

Docker: `docker build -t bogie-flow . && docker run -p 8000:8000 -e PORT=8000 bogie-flow`

---

## FAR AWAY criteria mapping

| Criterion | Evidence |
|-----------|----------|
| Innovation & technical depth | Hydrology + vibration + ML fusion; **30-min risk forecast agent**; **Open-Meteo live weather** with sim fallback; **XAI ticket Explain** (factors + GB importances + Gemini/local rationale) |
| Engineering quality | Typed WS schema, **42 pytest** + **60 vitest**, modular agents, Docker + CI smoke, single-origin static serving |
| Real-world impact | Monsoon track-bed failure; **Quantified Impact panel** (prevented-cost estimates, inspection hours saved, derailment-risk reduction %) |
| Scalability | N-segment model; fleet ingest notes below; containerized deploy |
| Design & UX | Control-room UI, corridor scrub, risk gauge, scenario replay menu |
| Execution quality | **One-command dev** (`npm run dev:all`), **<10 min clone**, demo script with exact clicks, public URL via Render/Railway |

---

## Honesty box

- Round 1 uses **simulated** bogie vibration and manual monsoon inject (not live Open-Meteo).  
- ML model trained on **physics-derived synthetic labels** — not field-collected data.  
- KiCad schematic documents Round 2 ESP32-S3 + MPU6050 path; live serial ingest is Delhi scope.

---

## Round 2 roadmap (Delhi)

- Real MPU6050 serial ingest on ESP32-S3  
- Open-Meteo / IMD rainfall API  
- PCB fabrication from KiCad schematic  
- Optional CWT batch pipeline (see physics.md Phase 2)  

---

## Pre-submission QA checklist

Human reviewer: **storm** — mark Pass before Unstop upload.

| # | Check | Pass |
|---|-------|------|
| 1 | Fresh clone → demo < 10 min from README | |
| 2 | Every video action exists in code | |
| 3 | No fabricated metrics (only logged risk_index / stiffness %) | |
| 4 | `python -m pytest tests/ -v` all green | |
| 5 | Tagline in README + UI + this doc | |
| 6 | GitHub public, latest push | |
| 7 | Backup inject + fallback demo assets exist | |
| 8 | Unstop: repo + video + **Railways** theme | |

---

## Unstop submission

- **Repository URL:** https://github.com/Stormynubee/Faraway2026Japan  
- **Video:** upload `assets/demo.mp4` (2–4 min, 1080p, voiceover)  
- **Theme:** Railways  
