import random
import time
from typing import Callable

from server.agents.hydrology import HydrologyAgent
from server.agents.planner import PlannerAgent
from server.agents.vibration import VibrationAgent
from server.models import AgentLog, Segment, Train

SEGMENT_IDS = [f"S{i}" for i in range(1, 7)]


class SimulationEngine:
    def __init__(self, on_event: Callable[[dict], None] | None = None):
        self.on_event = on_event or (lambda _e: None)
        self.hydrology = HydrologyAgent()
        self.vibration = VibrationAgent(window_size=20, threshold=3.0)
        self.planner = PlannerAgent()
        self.segments: dict[str, Segment] = {
            sid: Segment(id=sid) for sid in SEGMENT_IDS
        }
        self.train = Train(segment_id="S1", progress=0.0)
        self.tickets: list = []
        self.logs: list[AgentLog] = []
        self._ticket_counter = 0
        self._segment_index = 0
        random.seed(7)

    def active_risk_index(self) -> float:
        if not self.segments:
            return 0.0
        return max(s.risk_index for s in self.segments.values())

    def state_snapshot(self) -> dict:
        return {
            "type": "state_snapshot",
            "segments": [s.to_dict() for s in self.segments.values()],
            "train": self.train.to_dict(),
            "tickets": [t.to_dict() for t in self.tickets],
            "logs": [log.to_dict() for log in self.logs[-50:]],
            "active_risk_index": round(self.active_risk_index(), 3),
        }

    def _push_log(self, agent: str, message: str) -> None:
        log = AgentLog(agent=agent, message=message, timestamp=time.time())
        self.logs.append(log)
        self.on_event(log.to_dict())

    def inject_monsoon(self, segment_id: str, rainfall: float, soil_moisture: float) -> dict:
        seg = self.segments[segment_id]
        seg.rainfall = rainfall
        seg.soil_moisture = soil_moisture
        result = self.hydrology.evaluate(rainfall, soil_moisture, seg.nominal_stiffness)
        seg.risk_index = result["risk_index"]
        seg.k_effective = result["k_effective"]
        seg.state = result["state"]
        self._push_log("hydrology", f"{segment_id}: {result['description']}")
        self.on_event(self._segment_update_payload(segment_id))
        return {"segment": seg.to_dict(), "hydrology": result}

    def inject_anomaly(self, segment_id: str) -> dict:
        seg = self.segments[segment_id]
        seg.force_anomaly = True
        vib = self.vibration.push(segment_id, az=2.8)
        self._evaluate_segment(segment_id, vib)
        return {"segment": seg.to_dict(), "vibration": vib}

    def _segment_update_payload(self, segment_id: str) -> dict:
        seg = self.segments[segment_id]
        return {
            "type": "segment_update",
            "id": segment_id,
            "risk_index": seg.risk_index,
            "k_effective": seg.k_effective,
            "state": seg.state,
            "color": seg.to_dict()["color"],
            "rainfall": seg.rainfall,
            "soil_moisture": seg.soil_moisture,
            "vib_z": seg.vib_z,
            "az": seg.az,
        }

    def tick(self) -> None:
        self._advance_train()
        seg_id = self.train.segment_id
        az = self._sample_az(seg_id)
        vib = self.vibration.push(seg_id, az=az)
        seg = self.segments[seg_id]
        seg.az = az
        seg.vib_z = vib.get("z_score", 0.0)
        self.on_event(
            {
                "type": "telemetry",
                "segment": seg_id,
                "az": round(az, 3),
                "z_score": round(vib.get("z_score", 0.0), 2),
                "timestamp": time.time(),
            }
        )
        self.on_event(self._segment_update_payload(seg_id))
        self.on_event(
            {
                "type": "train_update",
                "segment_id": self.train.segment_id,
                "progress": self.train.progress,
            }
        )
        self._evaluate_segment(seg_id, vib)

    def _advance_train(self) -> None:
        self.train.progress += 0.15
        if self.train.progress >= 1.0:
            self.train.progress = 0.0
            self._segment_index = (self._segment_index + 1) % len(SEGMENT_IDS)
            self.train.segment_id = SEGMENT_IDS[self._segment_index]

    def _sample_az(self, segment_id: str) -> float:
        seg = self.segments[segment_id]
        base = 0.3 + random.gauss(0, 0.05)
        if seg.force_anomaly or seg.risk_index > 0.7:
            if random.random() < 0.6 or seg.force_anomaly:
                base += random.uniform(1.2, 2.5)
                seg.force_anomaly = False
        return max(0.05, base)

    def _evaluate_segment(self, segment_id: str, vib: dict) -> None:
        seg = self.segments[segment_id]
        ticket = self.planner.evaluate(
            segment_id=segment_id,
            hydro_state=seg.state,
            risk_index=seg.risk_index,
            rainfall=seg.rainfall,
            soil_moisture=seg.soil_moisture,
            vib_anomaly=vib.get("anomaly", False),
            z_score=vib.get("z_score", 0.0),
        )
        if vib.get("anomaly"):
            self._push_log(
                "vibration",
                f"{segment_id}: z-score {vib['z_score']:.2f} exceeds threshold — anomaly detected",
            )
        if ticket:
            self._ticket_counter += 1
            ticket.id = f"T-{self._ticket_counter:03d}"
            self.tickets.append(ticket)
            if ticket.priority == "P1":
                seg.state = "CRITICAL_MUD_PUMPING"
            elif ticket.priority == "P2" and seg.state == "HEALTHY":
                seg.state = "WARNING_WATERLOGGING"
            self.on_event(ticket.to_dict())
            self.on_event(self._segment_update_payload(segment_id))
            self._push_log("planner", f"{segment_id}: {ticket.reason} (model: {ticket.model_label})")
