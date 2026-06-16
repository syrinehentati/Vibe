from mcp.server.fastmcp import FastMCP
from starlette.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os

mcp = FastMCP("vibe")

@mcp.tool()
def generate_email(email_history, context, tone="warm", technical=False):
    return {
        "email": "test",
        "detected_tone": "warm",
        "subject": "Hello"
    }

app = mcp.sse_app()

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)