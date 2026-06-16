from mcp.server.fastmcp import FastMCP
import uvicorn
import os

mcp = FastMCP(
    "vibe",
    host="0.0.0.0",
    port=8080,
    allowed_hosts=["*"]
)

@mcp.tool()
def generate_email(email_history, context, tone="warm", technical=False):
    return {
        "email": "test",
        "detected_tone": "warm",
        "subject": "Hello"
    }

if __name__ == "__main__":
    mcp.run(transport="sse")