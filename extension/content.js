//content.js runs inside Gmail's page
// Its job: read the email thread, inject the Vibe sidebar

function getEmailThread() {
  const emails = [];

  //Gmail rendetrs each email in the thread as a div with this attribute
  const emailBlocks = document.querySelectorAll("[data-message-id]");
  emailBlocks.forEach((block) => {
    const body = block.querySelector(".as3"); //Gmail's email body class
    if (body) {
      emails.push(body.innerText.trim());
    }
  });
  return emails;
}

function getSenderName() {
  const sender = document.querySelector(".gD");
  return sender ? sender.getAttribute("email") : "your contact";
}

function injectSidebar() {
  // Don't inject twice
  if (document.getElementById("vibe-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "vibe-sidebar";
  sidebar.innerHTML = `
    <div id="vibe-header">
      <span id="vibe-wordmark">Vibe</span>
      <button id="vibe-close">×</button>
    </div>
    <div id="vibe-body">
      <label class="vibe-label">What do you want to say?</label>
      <textarea id="vibe-context" placeholder="Follow up on the proposal..."></textarea>
      <button id="vibe-generate">Generate Reply</button>
      <div id="vibe-result" style="display:none">
        <div id="vibe-tone"></div>
        <div id="vibe-email-text"></div>
        <button id="vibe-copy">Copy</button>
        <button id="vibe-insert">Insert into Gmail</button>
      </div>
      <div id="vibe-error" style="display:none"></div>
    </div>
  `;

  document.body.appendChild(sidebar);

  // Close button
  document.getElementById("vibe-close").onclick = () => {
    sidebar.style.display = "none";
  };

  //Generate button
  document.getElementById("vibe-generate").onclick = async () => {
    const context = document.getElementById("vibe-context").Value;
    if (!context) return;
    const emailHistory = getEmailThread();
    if (emailHistory.length === 0) {
      showError("No emails found in this thread");
      return;
    }

    setLoading(true);

    //Send message to background worker
    //Background worker makes the API call
    chrome.runtime.sendMessage(
      {
        type: "GENERATE_EMAIL",
        payload: { email_history: emailHistory, context },
      },
      (response) => {
        setLoading(false);
        if (response.error) {
          showError(response.error);
        } else {
          showResult(response.data);
        }
      },
    );
  };

  //copy button
  document.getElementById("vibe-copy").onclick = () => {
    const text = document.getElementById("vibe-email-text").innerText;
    navigator.clipboard.writeText(text);
  };

  // Insert into Gmail compose box
  document.getElementById("vibe-insert").onclick = () => {
    const text = document.getElementById("vibe-email-text").innerText;
    const composeBox = document.querySelector('[contenteditable="true"]');
    if (composeBox) {
      composeBox.innerText = text;
    }
  };
}

function setLoading(isLoading) {
  const btn = document.getElementById("vibe-generate");
  btn.textContent = isLoading ? "Generating..." : "Generate Reply";
  btn.disabled = isLoading;
}

function showResult(data) {
  document.getElementById("vibe-result").style.display = "block";
  document.getElementById("vibe-error").style.display = "none";
  document.getElementById("vibe-tone").textContent =
    `Tone: ${data.detected_tone}`;
  document.getElementById("vibe-email-text").textContent = data.email;
}

function showError(message) {
  document.getElementById("vibe-error").style.display = "block";
  document.getElementById("vibe-error").textContent = message;
  document.getElementById("vibe-result").style.display = "none";
}

// Gmail is a single page app — we watch for URL changes
// to know when the user opens an email

function isEmailOpen() {
  // Gmail email URLs contain #inbox/ or #sent/ followed by a thread ID
  return (
    location.hash.includes("#inbox/") ||
    location.hash.includes("#sent/") ||
    location.hash.includes("#search/") ||
    location.hash.includes("#label/")
  );
}

let lastUrl = location.href;

new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;

    if (isEmailOpen()) {
      setTimeout(injectSidebar, 1000);
    } else {
      // Hide sidebar when user goes back to inbox
      const sidebar = document.getElementById("vibe-sidebar");
      if (sidebar) sidebar.style.display = "none";
    }
  }
}).observe(document.body, { subtree: true, childList: true });
