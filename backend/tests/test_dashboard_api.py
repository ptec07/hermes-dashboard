from fastapi.testclient import TestClient

from app.main import app


def test_dashboard_endpoint_returns_snapshot_shape():
    client = TestClient(app)

    response = client.get("/api/dashboard")

    assert response.status_code == 200
    body = response.json()
    assert body["status"]["provider"]
    assert "session_store" in body
    assert "recent_sessions" in body
    assert "skills" in body
