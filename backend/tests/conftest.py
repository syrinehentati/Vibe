import os

# Must run before ANY app import: app.config builds Settings() at module level
# and app.routers.emails constructs EmailService() (and a genai.Client) on import.
os.environ.setdefault("GEMINI_API_KEY", "test-key-not-real")
os.environ.setdefault("ENVIRONMENT", "test")

import json
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def app_instance():
    """Import the app with the Gemini SDK stubbed out at the class level."""
    with patch("google.genai.Client", MagicMock()):
        from app.main import app
        yield app


@pytest.fixture
def client(app_instance):
    return TestClient(app_instance)


@pytest.fixture
def gemini(app_instance):
    """The MagicMock standing in for the real Gemini client, reset per test."""
    from app.routers.emails import email_service
    email_service.client.reset_mock(return_value=True, side_effect=True)
    return email_service.client


@pytest.fixture
def valid_generation(gemini):
    """Make generate_content return a payload that satisfies EmailResponse."""
    gemini.models.generate_content.return_value = MagicMock(
        text=json.dumps({
            "email": "Hey - sounds good, I'll take a look this afternoon.",
            "detected_tone": "casual",
            "subject": "Re: Q3 numbers",
        })
    )
    return gemini


@pytest.fixture
def sample_request():
    return {
        "email_history": ["Hi - attached.", "Thanks, looks right."],
        "context": "Ask for the updated figures",
        "config": {"tone": "casual", "technical": False},
    }