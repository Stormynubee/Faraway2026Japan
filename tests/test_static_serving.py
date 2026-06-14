"""Static SPA serving tests — dist must exist or use isolated mount fixture."""

from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from server.static_routes import mount_static_routes


@pytest.fixture
def dist_dir(tmp_path):
    d = tmp_path / "dist"
    d.mkdir()
    (d / "index.html").write_text(
        "<!DOCTYPE html><html><head><title>Bogie Flow</title></head><body>dashboard</body></html>",
        encoding="utf-8",
    )
    (d / "app.js").write_text("console.log('ok')", encoding="utf-8")
    return d


@pytest.fixture
def static_app(dist_dir):
    app = FastAPI()

    @app.get("/api/health")
    def api_health():
        return {"status": "ok", "service": "bogie-flow"}

    assert mount_static_routes(app, dist_dir) is True
    return app


def test_mount_skips_when_dist_missing(tmp_path):
    app = FastAPI()
    assert mount_static_routes(app, tmp_path / "missing") is False


def test_get_root_returns_html(static_app):
    with TestClient(static_app) as client:
        r = client.get("/")
        assert r.status_code == 200
        assert "text/html" in r.headers.get("content-type", "")
        assert "Bogie Flow" in r.text


def test_api_health_still_json(static_app):
    with TestClient(static_app) as client:
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


def test_static_asset_file_served(static_app):
    with TestClient(static_app) as client:
        r = client.get("/app.js")
        assert r.status_code == 200
        assert "console.log" in r.text


def test_unknown_client_route_returns_index_html(static_app):
    with TestClient(static_app) as client:
        r = client.get("/maintenance/queue")
        assert r.status_code == 200
        assert "dashboard" in r.text


def test_ws_upgrades_on_main_app(client):
    with client.websocket_connect("/ws") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "state_snapshot"
        assert len(msg.get("segments", [])) == 6


def test_main_app_serves_built_dist_when_present():
    dist = Path(__file__).resolve().parents[1] / "dist" / "index.html"
    if not dist.is_file():
        pytest.skip("Run npm run build to produce dist/index.html")

    with TestClient(__import__("server.main", fromlist=["app"]).app) as client:
        r = client.get("/")
        assert r.status_code == 200
        assert "text/html" in r.headers.get("content-type", "")
