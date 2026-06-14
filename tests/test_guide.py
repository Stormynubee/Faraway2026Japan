import pytest

from server.auth import reset_guide_rate_limits
from server.guide import _gemini_contents, _split_technical, DEFAULT_GEMINI_MODEL, _call_gemini


@pytest.fixture(autouse=True)
def _clear_guide_rate_limits():
    reset_guide_rate_limits()
    yield
    reset_guide_rate_limits()


def test_split_technical():
    answer, tech = _split_technical("Plain answer.\nTechnical: vib_z · S4")
    assert answer == "Plain answer."
    assert tech == "vib_z · S4"


def test_gemini_contents_maps_assistant_to_model():
    contents = _gemini_contents(
        [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": "Hello"}],
        "Next question",
    )
    assert contents[0]["role"] == "user"
    assert contents[1]["role"] == "model"
    assert contents[2]["role"] == "user"
    assert contents[2]["parts"][0]["text"] == "Next question"


def test_default_model_is_gemini_flash_lite():
    assert DEFAULT_GEMINI_MODEL == "gemini-3.1-flash-lite"


def test_call_gemini_sends_api_key_in_header_not_query(monkeypatch):
    captured = {}

    class FakeResponse:
        def read(self):
            return b'{"candidates":[{"content":{"parts":[{"text":"Plain answer."}]}}]}'

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

    def fake_urlopen(req, timeout=8):
        captured["url"] = req.full_url
        captured["api_key_header"] = next(
            (v for k, v in req.header_items() if k.lower() == "x-goog-api-key"),
            None,
        )
        return FakeResponse()

    monkeypatch.setattr("server.guide.urllib.request.urlopen", fake_urlopen)

    _call_gemini("test-secret-key", "gemini-test", "Hello", None)

    assert "key=" not in captured["url"]
    assert captured["api_key_header"] == "test-secret-key"


def test_guide_chat_http_returns_fallback_without_api_key(client, monkeypatch):
    monkeypatch.delenv("BOGIE_API_SECRET", raising=False)
    monkeypatch.delenv("GUIDE_AI_API_KEY", raising=False)

    response = client.post(
        "/api/guide/chat",
        json={"message": "What is corridor scrub?", "history": []},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "fallback"
    assert isinstance(data["answer"], str) and data["answer"]
    assert isinstance(data["technical"], str) and data["technical"]


def test_guide_chat_http_accepts_valid_history(client, monkeypatch):
    monkeypatch.delenv("BOGIE_API_SECRET", raising=False)
    monkeypatch.delenv("GUIDE_AI_API_KEY", raising=False)
    monkeypatch.setattr(
        "server.main.ai_guide_answer",
        lambda message, history=None: {
            "answer": f"Echo: {message}",
            "technical": "test",
            "source": "ai",
            "model": "gemini-test",
        },
    )

    response = client.post(
        "/api/guide/chat",
        json={
            "message": "Next?",
            "history": [
                {"role": "user", "content": "Hi"},
                {"role": "assistant", "content": "Hello"},
            ],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == "Echo: Next?"
    assert data["source"] == "ai"
    assert data["model"] == "gemini-test"


def test_guide_chat_http_rejects_empty_message(client, monkeypatch):
    monkeypatch.delenv("BOGIE_API_SECRET", raising=False)
    monkeypatch.delenv("GUIDE_AI_API_KEY", raising=False)

    response = client.post(
        "/api/guide/chat",
        json={"message": "", "history": []},
    )

    assert response.status_code == 422
