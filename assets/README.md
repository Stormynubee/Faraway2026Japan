# Fallback demo capture (Phase 1 safety net)

Run after `pytest tests/ -v` passes and backend is healthy.

## Steps (OBS 1920x1080 + mic)

1. Start backend: `python -m uvicorn server.main:app --reload --port 8000`
2. Record terminal showing:
   - `curl http://localhost:8000/health`
   - `curl -X POST http://localhost:8000/api/inject/monsoon -H "Content-Type: application/json" -d "{\"segment_id\":\"S4\",\"rainfall\":0.9,\"soil_moisture\":0.85}"`
   - `python -m pytest tests/ -v`
3. Voiceover opening: *"Others monitor the rail. We monitor the ballast."*
4. Explain: physics-informed agents + sklearn fusion model; UI dashboard follows.
5. Save as `assets/demo_fallback.mp4`

## Automated log (optional)

```powershell
.\scripts\capture_fallback_log.ps1
```
