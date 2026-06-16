import os
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("vibe")


@mcp.tool()
def generate_email(email_history, context, tone="warm", technical=False):
    return {
        "email": "test",
        "detected_tone": "warm",
        "subject": "Hello"
    }


if __name__ == "__main__":
    mcp.run(transport="sse")