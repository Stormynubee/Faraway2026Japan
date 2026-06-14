"""Optional post-deploy smoke tests against a hosted backend.

Set LIVE_BACKEND_URL (e.g. https://bogie-flow.onrender.com) to run against production.
"""

import os

import httpx
import pytest

LIVE_BACKEND_URL = os.environ.get("LIVE_BACKEND_URL", "").rstrip("/")
VERCEL_ORIGIN = os.environ.get(
    "LIVE_VERCEL_ORIGIN",
    "https://bogieflow.vercel.app",
)

pytestmark = pytest.mark.skipif(
    not LIVE_BACKEND_URL,
    reason="Set LIVE_BACKEND_URL to run live stack smoke tests",
)


def test_live_health_returns_six_segments():
    response = httpx.get(f"{LIVE_BACKEND_URL}/api/health", timeout=60.0)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bogie-flow"
    assert data["segments"] == 6


def test_live_cors_allows_vercel_origin():
    response = httpx.get(
        f"{LIVE_BACKEND_URL}/api/health",
        headers={"Origin": VERCEL_ORIGIN},
        timeout=60.0,
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == VERCEL_ORIGIN
