// background.js
// Its job: receive messages from content script, call Gmail API + Vibe API
const API = "https://vibe-production-1126.up.railway.app";

// ── Auth ────────────────────────────────────────────────────────────────

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// ── Gmail body extraction (UTF-8 safe, recursive) ──────────────────────

function decodeBase64Url(data) {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

function extractEmailBody(msgData) {
  function walk(part) {
    if (!part) return null;
    if (part.mimeType === "text/plain" && part.body?.data) {
      return decodeBase64Url(part.body.data);
    }
    for (const p of part.parts || []) {
      const found = walk(p);
      if (found) return found;
    }
    return null;
  }
  return walk(msgData.payload);
}

// ── Tone source: emails from this sender ────────────────────────────────

async function getEmailsFromSender(token, senderEmail) {
  const searchRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=from:${senderEmail}&maxResults=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const searchData = await searchRes.json();

  if (!searchData.messages || searchData.messages.length === 0) {
    return [];
  }

  const emails = await Promise.all(
    searchData.messages.slice(0, 10).map(async (msg) => {
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const msgData = await msgRes.json();
      return extractEmailBody(msgData);
    }),
  );

  return emails.filter(Boolean);
}

// ── Context source: candidate emails for semantic ranking (Slice 1) ────

function extractKeywords(text) {
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "about",
    "dans",
    "pour",
    "avec",
    "cette",
    "les",
    "des",
    "une",
    "est",
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  return [...new Set(words)].slice(0, 4).join(" OR ");
}

async function fetchCandidates(token, senderEmail, contextText) {
  const queries = [`from:${senderEmail}`];
  const keywords = extractKeywords(contextText);
  if (keywords) queries.push(`subject:(${keywords})`);

  const seen = new Set();
  const ids = [];
  for (const q of queries) {
    const res = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=15`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data = await res.json();
    for (const msg of data.messages || []) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        ids.push(msg.id);
      }
    }
  }

  const detailed = await Promise.all(
    ids.slice(0, 20).map(async (id) => {
      const res = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const msgData = await res.json();
      const headers = msgData.payload?.headers || [];
      const getH = (n) => headers.find((h) => h.name === n)?.value || "";
      return {
        id,
        subject: getH("Subject"),
        date: getH("Date"),
        snippet: extractEmailBody(msgData) || msgData.snippet || "",
      };
    }),
  );
  return detailed.filter((c) => c.snippet);
}

// ── Message handlers ────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GENERATE_EMAIL") {
    handleGenerate(message.payload).then(sendResponse);
    return true;
  }
  if (message.type === "RANK_CONTEXT") {
    handleRankContext(message.payload).then(sendResponse);
    return true;
  }
});

async function handleGenerate(payload) {
  try {
    let emailHistory = payload.email_history;

    if (payload.sender_email) {
      const token = await getAuthToken();
      const gmailHistory = await getEmailsFromSender(
        token,
        payload.sender_email,
      );
      if (gmailHistory.length > 0) {
        emailHistory = gmailHistory;
      }
    }

    const res = await fetch(`${API}/emails/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_history: emailHistory,
        context: payload.context,
        config: { tone: payload.tone, technical: false },
        selected_context: payload.selected_context || null,
      }),
    });

    const data = await res.json();
    return { data, emailCount: emailHistory.length };
  } catch (err) {
    return { error: err.message };
  }
}

async function handleRankContext(payload) {
  try {
    const token = await getAuthToken();
    const candidates = await fetchCandidates(
      token,
      payload.sender_email,
      payload.context,
    );
    if (candidates.length === 0) return { data: { results: [] }, full: {} };

    const res = await fetch(`${API}/emails/rank-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_email: payload.current_email,
        context: payload.context,
        candidates: candidates.map((c) => ({
          id: c.id,
          subject: c.subject,
          snippet: c.snippet.slice(0, 1500),
          date: c.date,
        })),
        top_k: 5,
      }),
    });
    const data = await res.json();

    // Keep full bodies extension-side so Generate doesn't refetch
    const full = Object.fromEntries(candidates.map((c) => [c.id, c.snippet]));
    return { data, full };
  } catch (err) {
    return { error: err.message };
  }
}
