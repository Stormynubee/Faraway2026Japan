# FAR AWAY 2026 — Submission Guide

## Executive summary

**Others monitor the rail. We monitor the ballast.**

RailTwin-X Lite fuses monsoon hydrology with bogie vibration anomalies to prioritize track-bed maintenance on a simulated 6-segment Indian Railways corridor. Three cooperating agents (hydrology, vibration, planner) plus a **sklearn GradientBoosting** fusion model produce P1/P2 maintenance tickets in real time via FastAPI WebSocket.

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
python -m server.agents.train_risk_model
python -m uvicorn server.main:app --reload --port 8000
# new terminal:
npm install && npm run dev
```

Open http://localhost:5173 → Inject Severe Monsoon on S4.

---

## FAR AWAY criteria mapping

| Criterion | Evidence |
|-----------|----------|
| Innovation & technical depth | Hydrology + vibration + ML fusion; [physics.md](physics.md) |
| Engineering quality | Typed WS schema, pytest suite, modular agents, joblib artifact |
| Real-world impact | Monsoon track-bed failure; maintenance prioritization |
| Scalability | N-segment model; fleet ingest notes below |
| Design & UX | Risk gauge, corridor map, tagline, ticket queue |
| Execution quality | Demo video + passing tests + runnable README |

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
