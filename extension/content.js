//content.js runs inside Gmail's page
// Its job: read the email thread, inject the Vibe sidebar
// content.js runs inside Gmail's page

function getEmailThread() {
  const emails = [];

  // Try to expand collapsed messages
  document
    .querySelectorAll('[aria-label="Show trimmed content"]')
    .forEach((btn) => btn.click());

  document
    .querySelectorAll('[data-tooltip="Expand all"]')
    .forEach((btn) => btn.click());

  // Read ALL data-message-id blocks
  const emailBlocks = document.querySelectorAll("[data-message-id]");

  emailBlocks.forEach((block) => {
    // Try multiple selectors
    const selectors = [".a3s", ".ii.gt", ".Am", '[dir="ltr"]'];
    for (const sel of selectors) {
      const body = block.querySelector(sel);
      if (body && body.innerText.trim().length > 10) {
        emails.push(body.innerText.trim());
        break;
      }
    }
  });

  return emails;
}

function renderEmailList(emails) {
  const container = document.getElementById("vibe-email-list");
  if (!container) return;

  if (emails.length === 0) {
    container.innerHTML = `<p style="color:#bbb;font-size:12px">No emails found in thread.</p>`;
    return;
  }

  container.innerHTML = emails
    .map(
      (email, i) => `
    <div class="vibe-email-item">
      <label class="vibe-email-label">
        <input 
          type="checkbox" 
          class="vibe-email-checkbox" 
          data-index="${i}" 
          checked
        />
        <span class="vibe-email-preview">
          ${email.slice(0, 60).trim()}${email.length > 60 ? "..." : ""}
        </span>
      </label>
    </div>
  `,
    )
    .join("");
}

function injectSidebar() {
  if (document.getElementById("vibe-sidebar")) {
    document.getElementById("vibe-sidebar").style.display = "block";
    // Reset result and recheck emails for new thread
    document.getElementById("vibe-result").style.display = "none";
    document.getElementById("vibe-error").style.display = "none";
    document.getElementById("vibe-email-list").innerHTML = "";
    document.getElementById("vibe-context").value = "";
    checkEmailState(); // ← recheck for new email
    return;
  }
  const sidebar = document.createElement("div");
  sidebar.id = "vibe-sidebar";
  // Replace the sidebar.innerHTML inside injectSidebar() with this:

  sidebar.innerHTML = `
  <div id="vibe-header">
    <span id="vibe-wordmark">Vibe</span>
    <button id="vibe-close">×</button>
  </div>
  <div id="vibe-body">

    <div id="vibe-empty" style="display:none">
      <div id="vibe-empty-icon">✉️</div>
      <p>Open an email to start generating replies with Vibe</p>
    </div>

    <div id="vibe-main">

      <label class="vibe-label">Emails found in thread</label>
      <div id="vibe-email-list"></div>

      <div class="vibe-spacer"></div>

      <label class="vibe-label">Tone</label>
      <select id="vibe-tone-select">
        <option value="warm">🌿 Warm</option>
        <option value="formal">🎩 Formal</option>
        <option value="casual">😊 Casual</option>
        <option value="direct">⚡ Direct</option>
        <option value="friendly">✨ Friendly</option>
      </select>

      <div class="vibe-spacer"></div>

      <label class="vibe-label">What do you want to say?</label>
      <textarea id="vibe-context" rows="3" 
        placeholder="e.g. Follow up on the proposal..."></textarea>

      <button id="vibe-generate">Generate Reply</button>

      <div id="vibe-loading" style="display:none">
        <p id="vibe-loading-text">Analysing tone...</p>
      </div>

      <div id="vibe-result" style="display:none">
        <div id="vibe-detected-tone"></div>
        <div id="vibe-subject-line"></div>
        <div id="vibe-used-emails"></div>
        <div id="vibe-email-text"></div>
        <div class="vibe-actions">
          <button class="vibe-action-btn" id="vibe-copy">Copy</button>
          <button class="vibe-action-btn primary" id="vibe-insert">Insert into Gmail</button>
        </div>
      </div>

      <div id="vibe-error" style="display:none"></div>
    </div>

  </div>
`;

  document.body.appendChild(sidebar);

  // Close button — hides but doesn't remove
  document.getElementById("vibe-close").onclick = () => {
    sidebar.style.display = "none";
    // Show reopen button
    document.getElementById("vibe-reopen").style.display = "flex";
  };

  // Generate button
  document.getElementById("vibe-generate").onclick = async () => {
    const context = document.getElementById("vibe-context").value;
    const tone = document.getElementById("vibe-tone-select").value;
    if (!context) return;

    const emailHistory = getEmailThread();
    const senderEmail = getSenderEmail(); // ← get sender

    if (emailHistory.length === 0) {
      showError("No emails found in this thread.");
      return;
    }

    setLoading(true);

    chrome.runtime.sendMessage(
      {
        type: "GENERATE_EMAIL",
        payload: {
          email_history: emailHistory,
          context,
          tone,
          sender_email: senderEmail,
        },
      },
      (response) => {
        setLoading(false);
        if (!response || response.error) {
          showError(response?.error || "Something went wrong.");
        } else {
          showResult(response.data, response.emailCount); // ← use the real count, not the local one
        }
      },
    );
  };
  // Copy button
  document.getElementById("vibe-copy").onclick = () => {
    const text = document.getElementById("vibe-email-text").innerText;
    navigator.clipboard.writeText(text);
  };

  // Insert button
  document.getElementById("vibe-insert").onclick = () => {
    const text = document.getElementById("vibe-email-text").innerText;
    const composeBox =
      document.querySelector('[contenteditable="true"][aria-label]') ||
      document.querySelector('[contenteditable="true"]');

    if (!composeBox) {
      const replyButton =
        document.querySelector('[data-tooltip="Reply"]') ||
        document.querySelector('[aria-label="Reply"]');
      if (replyButton) replyButton.click();
      setTimeout(() => {
        const box = document.querySelector(
          '[contenteditable="true"][aria-label]',
        );
        if (box) {
          box.focus();
          document.execCommand("insertText", false, text);
        }
      }, 500);
    } else {
      composeBox.focus();
      document.execCommand("insertText", false, text);
    }
  };

  checkEmailState();
}

function injectReopenButton() {
  if (document.getElementById("vibe-reopen")) return;
  const btn = document.createElement("div");
  btn.id = "vibe-reopen";
  btn.innerHTML = "✉️";
  btn.title = "Open Vibe";
  btn.style.cssText = `
    position:fixed;bottom:24px;right:24px;width:48px;height:48px;
    background:#7c6fff;border-radius:50%;display:none;align-items:center;
    justify-content:center;font-size:20px;cursor:pointer;z-index:9999;
    box-shadow:0 4px 12px rgba(124,111,255,0.4);
  `;
  btn.onclick = () => {
    document.getElementById("vibe-sidebar").style.display = "block";
    btn.style.display = "none";
  };
  document.body.appendChild(btn);
}

function checkEmailState() {
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const emailHistory = getEmailThread();
    const empty = document.getElementById("vibe-empty");
    const main = document.getElementById("vibe-main");
    if (!empty || !main) {
      clearInterval(interval);
      return;
    }

    if (emailHistory.length > 0) {
      empty.style.display = "none";
      main.style.display = "block";
      renderEmailList(emailHistory);
      clearInterval(interval);
    } else if (attempts > 20) {
      clearInterval(interval);
    }
  }, 800); // ← increased to 800ms
}

function getSenderEmail() {
  // Gmail shows sender email in .gD span with email attribute
  const sender = document.querySelector(".gD");
  return sender ? sender.getAttribute("email") : null;
}

function setLoading(isLoading) {
  document.getElementById("vibe-loading").style.display = isLoading
    ? "block"
    : "none";
  document.getElementById("vibe-generate").style.display = isLoading
    ? "none"
    : "block";
}

function showResult(data, emailCount) {
  document.getElementById("vibe-result").style.display = "block";
  document.getElementById("vibe-error").style.display = "none";
  document.getElementById("vibe-detected-tone").textContent =
    `Detected tone: ${data.detected_tone}`;
  document.getElementById("vibe-subject-line").textContent =
    `Subject: ${data.subject}`;
  document.getElementById("vibe-used-emails").textContent =
    `Based on ${emailCount} email${emailCount > 1 ? "s" : ""}`;
  document.getElementById("vibe-email-text").textContent = data.email;
}

function showError(message) {
  document.getElementById("vibe-error").style.display = "block";
  document.getElementById("vibe-error").textContent = message;
  document.getElementById("vibe-result").style.display = "none";
}

function isEmailOpen() {
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
      setTimeout(() => {
        injectReopenButton();
        injectSidebar();
      }, 1000);
    } else {
      const sidebar = document.getElementById("vibe-sidebar");
      if (sidebar) sidebar.style.display = "none";
      const reopen = document.getElementById("vibe-reopen");
      if (reopen) reopen.style.display = "none";
    }
  }
}).observe(document.body, { subtree: true, childList: true });

if (isEmailOpen()) {
  setTimeout(() => {
    injectReopenButton();
    injectSidebar();
  }, 1000);
}
