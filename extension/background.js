//background.js
//Its job: receive messages from content script, call the API
const API = "https://vibe-production-1126.up.railway.app";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GENERATE_EMAIL") {
    fetch(`${API}/emails/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_history: message.payload.email_history,
        context: message.payload.context,
        config: { tone: "warm", technical: false },
      }),
    })
      .then((res) => res.json())
      .then((data) => sendResponse({ data }))
      .catch((err) => sendResponse({ error: err.message }));

    return true;
  }
});
