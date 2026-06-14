from dataclasses import dataclass, field
from typing import Any


STATE_COLORS = {
    "HEALTHY": "#22c55e",
    "WARNING_WATERLOGGING": "#eab308",
    "CRITICAL_MUD_PUMPING": "#ef4444",
}


@dataclass
class Segment:
    id: str
    nominal_stiffness: float = 100.0
    rainfall: float = 0.1
    soil_moisture: float = 0.2
    risk_index: float = 0.0
    k_effective: float = 100.0
    state: str = "HEALTHY"
    force_anomaly: bool = False
    vib_z: float = 0.0
    az: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "risk_index": round(self.risk_index, 3),
            "k_effective": round(self.k_effective, 2),
            "state": self.state,
            "color": STATE_COLORS.get(self.state, "#22c55e"),
            "rainfall": round(self.rainfall, 2),
            "soil_moisture": round(self.soil_moisture, 2),
            "vib_z": round(self.vib_z, 2),
            "az": round(self.az, 3),
        }


@dataclass
class Train:
    segment_id: str = "S1"
    progress: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {"segment_id": self.segment_id, "progress": round(self.progress, 2)}


@dataclass
class Ticket:
    id: str
    priority: str
    segment: str
    reason: str
    status: str = "open"
    model_label: str = "OK"

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": "ticket",
            "id": self.id,
            "priority": self.priority,
            "segment": self.segment,
            "reason": self.reason,
            "status": self.status,
            "model_label": self.model_label,
        }


@dataclass
class AgentLog:
    agent: str
    message: str
    timestamp: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": "agent_log",
            "agent": self.agent,
            "message": self.message,
            "timestamp": self.timestamp,
        }
