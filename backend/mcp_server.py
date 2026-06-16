from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings
import uvicorn
import os

mcp = FastMCP(
    "vibe",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=False
    )
)

@mcp.tool()
def generate_email(email_history, context, tone="warm", technical=False):
    return {
        "email": "test",
        "detected_tone": "warm",
        "subject": "Hello"
    }

app = mcp.sse_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)