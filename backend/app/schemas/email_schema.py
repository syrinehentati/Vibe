from pydantic import BaseModel, Field
from typing import Optional

class EmailConfig(BaseModel):
    tone: str = Field(default="warm", description="warm, direct, formal, casual")
    technical: bool = Field(default=False, description="Use technical language or not")
    extra_instructions: Optional[str] = Field(default=None, description="Any extra instructions for the AI")

class EmailRequest(BaseModel):
    email_history: list[str] = Field(..., description="Previous emails with this contact")
    context: str = Field(..., description="What the email should be about")
    config: EmailConfig = Field(default_factory=EmailConfig)

class EmailResponse(BaseModel):
    email: str = Field(..., description="Generated email body")
    detected_tone: str = Field(..., description="Tone detected from email history")
    subject: str = Field(..., description="Suggested email subject")