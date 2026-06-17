# Vibe — AI Email Agent

Most AI email tools write emails that sound like AI wrote them.
Vibe doesn't. It reads how your contact actually writes — their rhythm, their tone, their quirks — and writes back in their exact style.

Not generic. Not robotic. Actually them.

---

## What it does

You give Vibe a history of emails from a contact and what you want to say.
It figures out how they write, then generates a reply that sounds like it came from them — not from a template.

- **Tone detection** — analyzes email history to extract writing style, formality, personality
- **Style-matched generation** — writes emails that mirror the contact's actual voice
- **MCP tool** — exposes `generate_email` as an MCP tool, plugs directly into any AI client
- **Configurable** — control tone, technical level, and extra instructions per request

---

## Why MCP

Most AI integrations are one-off API calls. MCP (Model Context Protocol) is different — it lets AI clients like Claude Desktop discover and call your tools automatically, without you wiring anything manually.

You deploy Vibe once. Any MCP-compatible client can use it forever.

```
Claude Desktop / any MCP client
        ↓
   Vibe MCP Server  (SSE transport)
        ↓
   Tone detection → Email generation
        ↓
   Email that sounds human
```

---

## Stack

`Python` `FastMCP` `Google Gemini API` `Pydantic` `Uvicorn` `Railway`

---

## Live deployment

```
https://vibe-production-3686.up.railway.app/
```

---

## Run locally

```bash
git clone https://github.com/syrinehentati/Vibe
cd Vibe/backend
pip install -r requirements.txt
```

Create a `.env` file:
```
GEMINI_API_KEY=your_key_here
```

Start the server:
```bash
python mcp_server.py
```

Your MCP endpoint is now running at `http://localhost:8080/sse`

---

## Connect to Claude Desktop

Add this to your Claude Desktop config:

```json
{
  "mcpServers": {
    "vibe": {
      "url": "https://vibe-production-1126.up.railway.app/sse",
      "transport": "sse"
    }
  }
}
```

Claude will automatically discover the `generate_email` tool.

---

## Why I built this

I kept getting emails that needed replies that matched the other person's energy — formal clients, casual teammates, anxious users. Writing those manually takes more thought than it should.

So I built something that reads the room for me.

---

*Built by [Syrine Hentati](https://github.com/syrinehentati)*