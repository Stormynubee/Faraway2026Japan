# WebSocket Message Schema — RailTwin-X Lite

Single source of truth for backend ↔ frontend. Six segments: **S1–S6**.

## Connection

- **URL:** `ws://localhost:8000/ws`
- On connect, server sends `state_snapshot` then streams events on tick (~500ms) and on inject.

## Message types

### `state_snapshot`

Full sync on connect.

```json
{
  "type": "state_snapshot",
  "segments": [
    {
      "id": "S1",
      "risk_index": 0.12,
      "k_effective": 95.2,
      "state": "HEALTHY",
      "color": "#22c55e",
      "rainfall": 0.1,
      "soil_moisture": 0.2
    }
  ],
  "train": { "segment_id": "S2", "progress": 0.45 },
  "tickets": [],
  "logs": [],
  "active_risk_index": 0.12
}
```

### `segment_update`

Emitted when hydrology or planner changes segment risk.

```json
{
  "type": "segment_update",
  "id": "S4",
  "risk_index": 0.87,
  "k_effective": 65.2,
  "state": "CRITICAL_MUD_PUMPING",
  "color": "#ef4444"
}
```

### `telemetry`

Bogie vibration sample (no chart UI in v4; still emitted for logs/debug).

```json
{
  "type": "telemetry",
  "segment": "S4",
  "az": 1.85,
  "z_score": 4.2,
  "timestamp": 1718366400.5
}
```

### `train_update`

```json
{
  "type": "train_update",
  "segment_id": "S3",
  "progress": 0.72
}
```

### `ticket`

```json
{
  "type": "ticket",
  "id": "T-001",
  "priority": "P1",
  "segment": "S4",
  "reason": "ML fusion: CRITICAL hydrology + vibration anomaly on degraded ballast",
  "status": "open",
  "model_label": "P1"
}
```

### `agent_log`

```json
{
  "type": "agent_log",
  "agent": "hydrology",
  "message": "S4: Hydrology index 87.0%. Effective stiffness at 65.2% of nominal.",
  "timestamp": 1718366401.0
}
```

## Color mapping

| State | Color |
|-------|-------|
| `HEALTHY` | `#22c55e` (green) |
| `WARNING_WATERLOGGING` | `#eab308` (yellow) |
| `CRITICAL_MUD_PUMPING` | `#ef4444` (red) |

## REST inject (demo controls)

- `POST /api/inject/monsoon` — `{ "segment_id": "S4", "rainfall": 0.9, "soil_moisture": 0.85 }`
- `POST /api/inject/anomaly` — `{ "segment_id": "S4" }` (diagnostic backup)
