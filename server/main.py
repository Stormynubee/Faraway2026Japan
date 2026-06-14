import asyncio
import os
from contextlib import asynccontextmanager
from typing import Any

from server.env import load_dotenv

load_dotenv()


def parse_allowed_origins(value: str | None = None) -> list[str]:
    raw = value if value is not None else os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from server.guide import ai_guide_answer
from server.simulation import SimulationEngine

clients: set[WebSocket] = set()
sim: SimulationEngine | None = None
tick_task: asyncio.Task | None = None


async def broadcast(message: dict[str, Any]) -> None:
    dead: list[WebSocket] = []
    for ws in clients:
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)


def on_sim_event(event: dict[str, Any]) -> None:
    if clients:
        asyncio.create_task(broadcast(event))


async def simulation_loop() -> None:
    while True:
        await asyncio.sleep(0.5)
        if sim:
            sim.tick()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global sim, tick_task
    sim = SimulationEngine(on_event=on_sim_event)
    tick_task = asyncio.create_task(simulation_loop())
    yield
    if tick_task:
        tick_task.cancel()


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
    assert sim is not None
    result = sim.inject_monsoon(body.segment_id, body.rainfall, body.soil_moisture)
    return {"ok": True, **result}


@app.post("/api/inject/anomaly")
async def inject_anomaly(body: AnomalyInject):
    assert sim is not None
    result = sim.inject_anomaly(body.segment_id)
    return {"ok": True, **result}


@app.post("/api/guide/chat")
async def guide_chat(body: GuideChatRequest):
    return ai_guide_answer(body.message, body.history)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        if sim:
            await ws.send_json(sim.state_snapshot())
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)
