//background.js
//Its job: receive messages from content script, call the API
const API = "https://vibe-production-1126.up.railway.app";

// Get OAuth token from Chrome
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

// Get sender's email address from current thread
async function getEmailsFromSender(token, senderEmail) {
  // Search Gmail for all emails from this sender
  const searchRes = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=from:${senderEmail}&maxResults=20`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const searchData = await searchRes.json();

  if (!searchData.messages || searchData.messages.length === 0) {
    return [];
  }

  // Fetch the body of each email
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

// Extract plain text from Gmail API response
function extractEmailBody(msgData) {
  const parts = msgData.payload?.parts || [msgData.payload];
  for (const part of parts) {
    if (part?.mimeType === "text/plain" && part?.body?.data) {
      return atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GENERATE_EMAIL") {
    handleGenerate(message.payload).then(sendResponse);
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
      }),
    });

    const data = await res.json();
    return { data, emailCount: emailHistory.length }; // ← return the REAL count used
  } catch (err) {
    return { error: err.message };
  }
}
