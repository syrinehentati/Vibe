import pytest
from pydantic import ValidationError
from app.schemas.email_schema import (
    EmailConfig, EmailRequest, EmailResponse,
    CandidateEmail, RankContextRequest,
)


def test_config_defaults():
    c = EmailConfig()
    assert c.tone == "warm"
    assert c.technical is False
    assert c.extra_instructions is None


@pytest.mark.parametrize("tone", ["warm", "direct", "formal", "casual"])
def test_documented_tones_accepted(tone):
    assert EmailConfig(tone=tone).tone == tone


def test_request_applies_default_config():
    r = EmailRequest(email_history=["hi"], context="follow up")
    assert r.config.tone == "warm"
    assert r.selected_context is None


@pytest.mark.parametrize("payload,missing", [
    ({"context": "x"}, "email_history"),
    ({"email_history": ["x"]}, "context"),
    ({}, "email_history"),
])
def test_required_fields_enforced(payload, missing):
    with pytest.raises(ValidationError) as exc:
        EmailRequest(**payload)
    assert missing in str(exc.value)


@pytest.mark.parametrize("bad", [
    {"email_history": "not a list", "context": "x"},
    {"email_history": [1, 2, 3], "context": "x"},
    {"email_history": ["x"], "context": "y", "config": {"technical": "maybe"}},
])
def test_wrong_types_rejected(bad):
    with pytest.raises(ValidationError):
        EmailRequest(**bad)


def test_rank_request_defaults_top_k_to_five():
    r = RankContextRequest(
        current_email="a", context="b",
        candidates=[CandidateEmail(id="1", snippet="s")],
    )
    assert r.top_k == 5
    assert r.candidates[0].subject == ""