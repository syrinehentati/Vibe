# Vibe — AI Email Agent

Most AI email tools write emails that sound like AI wrote them.
Vibe doesn't. It reads how your contact actually writes — their rhythm, their tone, their quirks — and writes back in their exact style.

Not generic. Not robotic. Actually them.

---

## What it does

Vibe reads your contact's full email history, detects how they actually write, and generates a reply that sounds exactly like it came from them.

- **Gmail API integration** — reads your contact's full email history across your entire mailbox, not just the current thread
- **Tone detection** — analyzes writing style, formality, personality, and rhythm using Gemini AI
- **Style-matched generation** — writes replies that mirror the contact's actual voice
- **Chrome extension** — injects a sidebar directly into Gmail. One click to generate, one click to insert
- **MCP server** — exposes `generate_email` as an MCP tool, plugs directly into AI clients like Claude Desktop
- **Configurable** — control tone (warm, formal, casual, direct, friendly) per request

---

## How it works

```
You open an email in Gmail
        ↓
Vibe sidebar appears automatically
        ↓
OAuth flow — you approve Gmail read access once
        ↓
Vibe fetches full email history from that sender via Gmail API
        ↓
Gemini AI detects their tone from real history
        ↓
Generates a reply that sounds exactly like them
        ↓
One click to insert into Gmail compose box
```

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

**Backend:** Python · FastAPI · FastMCP · Gemini API · Pydantic · Railway

**Frontend:** React · TypeScript · Axios

**Extension:** Chrome Extension (Manifest V3) · Gmail API · OAuth 2.0 · chrome.identity

---

## Project structure

```
Vibe/
├── backend/          — FastAPI + MCP server (deployed on Railway)
├── frontend/         — React web app (deployed on Railway)
└── extension/        — Chrome extension for Gmail
```

---

## Live demo

**Web app:** `https://vibe-production-3686.up.railway.app`

**MCP endpoint:** `https://vibe-production-1126.up.railway.app/sse`

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

Your MCP endpoint: `http://localhost:8080/sse`

---

## Chrome Extension

Load the `extension/` folder as an unpacked extension in Chrome Developer Mode.

The extension:
- Injects a sidebar into Gmail automatically when you open an email
- Requests Gmail read-only OAuth permission on first use
- Fetches full email history from the sender via Gmail API
- Calls the Vibe backend to generate a tone-matched reply
- Inserts the reply directly into Gmail's compose box

---

## Connect to Claude Desktop

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