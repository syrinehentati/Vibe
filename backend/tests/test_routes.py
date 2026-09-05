def test_root_is_alive(client):
    assert client.get("/").status_code == 200


def test_health_reports_status(client):
    r = client.get("/emails/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_generate_returns_email(client, valid_generation, sample_request):
    r = client.post("/emails/generate", json=sample_request)
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"email", "detected_tone", "subject"}
    assert body["detected_tone"] == "casual"


def test_malformed_body_is_422(client):
    r = client.post("/emails/generate", json={"context": "no history"})
    assert r.status_code == 422


def test_prompt_carries_history_and_context(client, valid_generation, sample_request):
    client.post("/emails/generate", json=sample_request)
    kwargs = valid_generation.models.generate_content.call_args.kwargs
    prompt = kwargs["contents"]
    assert "Thanks, looks right." in prompt
    assert "Ask for the updated figures" in prompt


def test_selected_context_injected_into_prompt(client, valid_generation, sample_request):
    sample_request["selected_context"] = ["Earlier thread about the login bug"]
    client.post("/emails/generate", json=sample_request)
    prompt = valid_generation.models.generate_content.call_args.kwargs["contents"]
    assert "login bug" in prompt


def test_upstream_failure_does_not_leak_details(client, gemini, sample_request):
    gemini.models.generate_content.side_effect = Exception(
        "401 API key AIzaSyFAKE1234 invalid"
    )
    r = client.post("/emails/generate", json=sample_request)
    assert r.status_code >= 500
    assert "AIzaSy" not in r.text


def test_rank_context_returns_scored_results(client, monkeypatch):
    from app.routers import emails
    monkeypatch.setattr(
        emails.embedding_service, "rank",
        lambda q, t, k: [(1, 0.91), (0, 0.42)]
    )
    r = client.post("/emails/rank-context", json={
        "current_email": "the login is broken",
        "context": "auth bug",
        "candidates": [
            {"id": "m1", "snippet": "old thread"},
            {"id": "m2", "snippet": "auth failure"},
        ],
    })
    assert r.status_code == 200
    results = r.json()["results"]
    assert [x["id"] for x in results] == ["m2", "m1"]
    assert results[0]["score"] == 0.91


def test_rank_context_failure_is_502(client, monkeypatch):
    from app.routers import emails
    def boom(*a, **k):
        raise Exception("embedding API down")
    monkeypatch.setattr(emails.embedding_service, "rank", boom)
    r = client.post("/emails/rank-context", json={
        "current_email": "x", "context": "y",
        "candidates": [{"id": "m1", "snippet": "s"}],
    })
    assert r.status_code == 502
    assert "embedding API down" not in r.text   