import importlib

from fastapi.testclient import TestClient


def test_health_routes_return_segments(client):
    for path in ("/health", "/api/health"):
        r = client.get(path)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["service"] == "bogie-flow"
        assert data["segments"] == 6


def test_allowed_origins_emits_cors_header(monkeypatch):
    monkeypatch.setenv(
        "ALLOWED_ORIGINS",
        "https://app.example.com, https://staging.example.com",
    )
    import server.main as main_mod

    importlib.reload(main_mod)

    with TestClient(main_mod.app) as cors_client:
        r = cors_client.get(
            "/health",
            headers={"Origin": "https://app.example.com"},
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "https://app.example.com"

    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    importlib.reload(main_mod)
