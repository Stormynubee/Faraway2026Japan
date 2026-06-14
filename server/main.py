import logging
import asyncio
import os
from contextlib import asynccontextmanager
from typing import Any

from server.env import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


def parse_allowed_origins(value: str | None = None) -> list[str]:
    raw = value if value is not None else os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

from server.guide import ai_guide_answer
from server.explain import explain_ticket
from server.impact import compute_impact
from server.simulation import SimulationEngine
from server.static_routes import mount_static_routes
from server.agents.risk_model import MODEL_PATH, train_and_save

clients: set[WebSocket] = set()
sim: SimulationEngine | None = None
tick_task: asyncio.Task | None = None
_broadcast_tasks: set[asyncio.Task] = set()


def require_sim() -> SimulationEngine:
    if sim is None:
        raise HTTPException(status_code=503, detail="Simulation not ready")
    return sim


def _log_broadcast_result(task: asyncio.Task) -> None:
    _broadcast_tasks.discard(task)
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        logger.exception("WebSocket broadcast failed", exc_info=exc)


async def broadcast(message: dict[str, Any]) -> None:
    dead: list[WebSocket] = []
    for ws in clients:
        try:
            await ws.send_json(message)
        except Exception as exc:
            logger.warning("WebSocket send failed: %s", exc)
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)


def on_sim_event(event: dict[str, Any]) -> None:
    if not clients:
        return
    task = asyncio.create_task(broadcast(event))
    _broadcast_tasks.add(task)
    task.add_done_callback(_log_broadcast_result)


async def simulation_loop() -> None:
    while True:
        await asyncio.sleep(0.5)
        if sim:
            sim.tick()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sim, tick_task
    if not MODEL_PATH.exists():
        logger.info("risk_model.joblib missing — training on boot")
        await run_in_threadpool(train_and_save)
    sim = SimulationEngine(on_event=on_sim_event)
    tick_task = asyncio.create_task(simulation_loop())
    yield
    if tick_task:
        tick_task.cancel()
    for task in list(_broadcast_tasks):
        task.cancel()


app = FastAPI(title="Bogie Flow", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MonsoonInject(BaseModel):
    segment_id: str = Field(examples=["S4"])
    rainfall: float = Field(ge=0.0, le=1.0, default=0.9)
    soil_moisture: float = Field(ge=0.0, le=1.0, default=0.85)


class AnomalyInject(BaseModel):
    segment_id: str = Field(examples=["S4"])


class GuideChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list)


class WeatherModeRequest(BaseModel):
    live: bool


def health_payload() -> dict[str, Any]:
    return {"status": "ok", "service": "bogie-flow", "segments": 6}


@app.get("/health")
def health():
    return health_payload()


@app.get("/api/health")
def api_health():
    return health_payload()


@app.post("/api/inject/monsoon")
async def inject_monsoon(body: MonsoonInject):
    engine = require_sim()
    result = engine.inject_monsoon(body.segment_id, body.rainfall, body.soil_moisture)
    return {"ok": True, **result}


@app.post("/api/inject/anomaly")
async def inject_anomaly(body: AnomalyInject):
    engine = require_sim()
    result = engine.inject_anomaly(body.segment_id)
    return {"ok": True, **result}


@app.post("/api/sim/reset")
async def reset_corridor():
    engine = require_sim()
    return engine.reset_corridor()


@app.post("/api/weather/mode")
async def set_weather_mode(body: WeatherModeRequest):
    engine = require_sim()
    return {"ok": True, **engine.set_live_weather(body.live)}


@app.get("/api/impact")
def get_impact():
    engine = require_sim()
    open_tickets = [t.to_dict() for t in engine.tickets if t.status != "closed"]
    return compute_impact(engine.active_risk_index(), open_tickets)


@app.get("/api/tickets")
def list_tickets():
    engine = require_sim()
    return {"tickets": [t.to_dict() for t in engine.tickets if t.status != "closed"]}


@app.get("/api/tickets/{ticket_id}/explain")
def ticket_explain(ticket_id: str):
    engine = require_sim()
    ticket = next((t for t in engine.tickets if t.id == ticket_id), None)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    segment = engine.segments.get(ticket.segment)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")
    return explain_ticket(ticket.to_dict(), segment.to_dict())


@app.post("/api/guide/chat")
async def guide_chat(body: GuideChatRequest):
    return await run_in_threadpool(ai_guide_answer, body.message, body.history)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        if sim is not None:
            await ws.send_json(sim.state_snapshot())
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)


if mount_static_routes(app):
    logger.info("Serving production UI from dist/")
