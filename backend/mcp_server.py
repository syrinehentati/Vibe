from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
from app.services.email_service import EmailService
from app.schemas.email_schema import EmailRequest, EmailConfig
import uvicorn
import os

mcp = FastMCP(
    "vibe",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False
    )
)

email_service = EmailService()

@mcp.tool()
def generate_email(
    email_history: list[str],
    context: str,
    tone: str = "warm",
    technical: bool = False
) -> dict:
    """
    Generate an email that matches the customer's tone and vibe.
    Analyzes email history to detect writing style, then writes
    a reply in that exact style.
    """
    request = EmailRequest(
        email_history=email_history,
        context=context,
        config=EmailConfig(tone=tone, technical=technical)
    )
    result = email_service.generate(request)
    return {
        "email": result.email,
        "detected_tone": result.detected_tone,
        "subject": result.subject
    }

app = mcp.sse_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)