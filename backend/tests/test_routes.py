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