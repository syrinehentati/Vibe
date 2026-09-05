from pydantic import BaseModel, Field
from typing import Optional, Literal


class EmailConfig(BaseModel):
    tone: Literal["warm", "direct", "formal", "casual"] = Field(
        default="warm", description="Tone to write in"
    )
    technical: bool = Field(default=False, description="Use technical language or not")
    extra_instructions: Optional[str] = Field(
        default=None, description="Any extra instructions for the AI"
    )


class EmailRequest(BaseModel):
    email_history: list[str] = Field(
        ..., min_length=1, description="Previous emails with this contact"
    )
    context: str = Field(
        ..., min_length=1, description="What the email should be about"
    )
    config: EmailConfig = Field(default_factory=EmailConfig)
    selected_context: Optional[list[str]] = Field(
        default=None,
        description="Past email threads the user selected as relevant context",
    )

class EmailRequest(BaseModel):
    email_history: list[str] = Field(..., description="Previous emails with this contact")
    context: str = Field(..., description="What the email should be about")
    config: EmailConfig = Field(default_factory=EmailConfig)
    selected_context: Optional[list[str]] = Field(
        default=None,
        description="Past email threads the user selected as relevant context",
    )


class EmailResponse(BaseModel):
    email: str = Field(..., description="Generated email body")
    detected_tone: str = Field(..., description="Tone detected from email history")
    subject: str = Field(..., description="Suggested email subject")


# ── Context ranking (Slice 1) ──────────────────────────────────────────

class CandidateEmail(BaseModel):
    id: str = Field(..., description="Gmail message ID")
    subject: str = ""
    snippet: str = Field(..., description="Body or snippet text used for matching")
    date: Optional[str] = None


class RankContextRequest(BaseModel):
    current_email: str = Field(..., description="The email being replied to")
    context: str = Field(..., description="What the reply should be about")
    candidates: list[CandidateEmail]
    top_k: int = 5


class RankedEmail(BaseModel):
    id: str
    subject: str
    snippet: str
    score: float


class RankContextResponse(BaseModel):
    results: list[RankedEmail]
