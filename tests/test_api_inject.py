def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_inject_monsoon_returns_segment(client):
    r = client.post(
        "/api/inject/monsoon",
        json={"segment_id": "S4", "rainfall": 0.9, "soil_moisture": 0.85},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert data["segment"]["id"] == "S4"
    assert data["segment"]["state"] == "CRITICAL_MUD_PUMPING"


def test_websocket_receives_snapshot_and_segment_update(client):
    with client.websocket_connect("/ws") as ws:
        snapshot = ws.receive_json()
        assert snapshot["type"] == "state_snapshot"
        assert len(snapshot["segments"]) == 6

        client.post(
            "/api/inject/monsoon",
            json={"segment_id": "S4", "rainfall": 0.9, "soil_moisture": 0.85},
        )

        seen_segment_update = False
        for _ in range(20):
            msg = ws.receive_json()
            if msg.get("type") == "segment_update" and msg.get("id") == "S4":
                seen_segment_update = True
                break
        assert seen_segment_update


def test_inject_monsoon_invalid_segment_returns_422(client):
    response = client.post(
        "/api/inject/monsoon",
        json={"segment_id": "S99", "rainfall": 0.9, "soil_moisture": 0.85},
    )
    assert response.status_code == 422


def test_inject_monsoon_missing_segment_returns_422(client):
    response = client.post(
        "/api/inject/monsoon",
        json={"rainfall": 0.9, "soil_moisture": 0.85},
    )
    assert response.status_code == 422


def test_inject_monsoon_out_of_range_rainfall_returns_422(client):
    response = client.post(
        "/api/inject/monsoon",
        json={"segment_id": "S4", "rainfall": 1.5, "soil_moisture": 0.85},
    )
    assert response.status_code == 422


def test_inject_monsoon_segment_id_abuse_returns_422(client):
    response = client.post(
        "/api/inject/monsoon",
        json={"segment_id": "S4'; DROP TABLE segments;--", "rainfall": 0.9, "soil_moisture": 0.85},
    )
    assert response.status_code == 422


def test_inject_anomaly_invalid_segment_returns_422(client):
    response = client.post(
        "/api/inject/anomaly",
        json={"segment_id": "INVALID"},
    )
    assert response.status_code == 422


def test_inject_anomaly_missing_segment_returns_422(client):
    response = client.post(
        "/api/inject/anomaly",
        json={},
    )
    assert response.status_code == 422
