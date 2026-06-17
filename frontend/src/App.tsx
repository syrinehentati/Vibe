import { useState } from "react"
import axios from "axios"

const API = process.env.REACT_APP_API_URL || ""
interface EmailResponse {
  email: string
  detected_tone: string
  subject: string
}

export default function App() {
  const [emails, setEmails] = useState("")
  const [context, setContext] = useState("")
  const [result, setResult] = useState<EmailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${API}/emails/generate`, {
        email_history: emails.split("\n---\n"),
        context,
        config: { tone: "warm", technical: false }
      })
      setResult(res.data)
    } catch (e) {
      setError("Generation failed. Check your inputs and try again.")
    } finally {
      setLoading(false)
    }
  }

  function copy() {
    if (!result) return
    navigator.clipboard.writeText(result.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0d0d0d;
          color: #f0ede8;
          font-family: 'Inter', -apple-system, sans-serif;
          min-height: 100vh;
        }

        .app {
          max-width: 680px;
          margin: 0 auto;
          padding: 64px 24px 80px;
        }

        .header {
          margin-bottom: 56px;
        }

        .wordmark {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #7c6fff;
          margin-bottom: 24px;
        }

        .headline {
          font-size: 36px;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #f0ede8;
          margin-bottom: 14px;
        }

        .headline em {
          font-style: normal;
          color: #7c6fff;
        }

        .subline {
          font-size: 15px;
          color: #888;
          line-height: 1.6;
        }

        .field {
          margin-bottom: 28px;
        }

        .field-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 8px;
          display: block;
        }

        .field-hint {
          font-size: 12px;
          color: #444;
          margin-bottom: 8px;
        }

        textarea {
          width: 100%;
          background: #161616;
          border: 1px solid #222;
          border-radius: 10px;
          padding: 14px 16px;
          font-size: 14px;
          color: #f0ede8;
          font-family: inherit;
          line-height: 1.6;
          resize: vertical;
          transition: border-color 0.15s;
          outline: none;
        }

        textarea::placeholder { color: #444; }

        textarea:focus { border-color: #7c6fff; }

        .generate-btn {
          width: 100%;
          padding: 15px;
          background: #7c6fff;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          letter-spacing: 0.01em;
        }

        .generate-btn:hover:not(:disabled) { opacity: 0.88; }
        .generate-btn:active:not(:disabled) { transform: scale(0.99); }
        .generate-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .error {
          margin-top: 12px;
          font-size: 13px;
          color: #f87171;
        }

        .result {
          margin-top: 40px;
          border: 1px solid #222;
          border-radius: 12px;
          overflow: hidden;
        }

        .result-meta {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #222;
        }

        .meta-item {
          flex: 1;
          padding: 16px 20px;
          border-right: 1px solid #222;
        }

        .meta-item:last-child { border-right: none; }

        .meta-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #555;
          margin-bottom: 5px;
        }

        .meta-value {
          font-size: 13px;
          color: #f0ede8;
          line-height: 1.4;
        }

        .result-body {
          padding: 24px 20px;
        }

        .email-text {
          font-size: 14px;
          line-height: 1.8;
          color: #ccc;
          white-space: pre-wrap;
        }

        .copy-btn {
          margin-top: 20px;
          padding: 9px 18px;
          background: transparent;
          border: 1px solid #333;
          border-radius: 7px;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .copy-btn:hover { border-color: #7c6fff; color: #7c6fff; }
        .copy-btn.copied { border-color: #22c55e; color: #22c55e; }

        .loading-dots::after {
          content: '';
          animation: dots 1.2s steps(4, end) infinite;
        }

        @keyframes dots {
          0%   { content: ''; }
          25%  { content: '.'; }
          50%  { content: '..'; }
          75%  { content: '...'; }
          100% { content: ''; }
        }
      `}</style>

      <div className="app">
        <div className="header">
          <div className="wordmark">Vibe</div>
          <h1 className="headline">
            Emails that sound like<br /><em>them</em>, not like AI.
          </h1>
          <p className="subline">
            Paste a contact's emails. Vibe reads their tone and writes back in their exact style.
          </p>
        </div>

        <div className="field">
          <label className="field-label">Email history</label>
          <p className="field-hint">Paste 2–3 emails from your contact. Separate them with ---</p>
          <textarea
            rows={7}
            placeholder={"Hey! Just checking in, no rush but let me know when you can 😊\n---\nOmg yes totally, I'm so down for this!"}
            value={emails}
            onChange={e => setEmails(e.target.value)}
          />
        </div>

        <div className="field">
          <label className="field-label">What to say</label>
          <textarea
            rows={3}
            placeholder="Confirm the meeting is set for Friday at 3pm"
            value={context}
            onChange={e => setContext(e.target.value)}
          />
        </div>

        <button
          className="generate-btn"
          onClick={generate}
          disabled={loading || !emails || !context}
        >
          {loading ? <span className="loading-dots">Analysing tone</span> : "Generate Reply"}
        </button>

        {error && <p className="error">{error}</p>}

        {result && (
          <div className="result">
            <div className="result-meta">
              <div className="meta-item">
                <div className="meta-label">Detected tone</div>
                <div className="meta-value">{result.detected_tone}</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Subject</div>
                <div className="meta-value">{result.subject}</div>
              </div>
            </div>
            <div className="result-body">
              <p className="email-text">{result.email}</p>
              <button
                className={`copy-btn${copied ? " copied" : ""}`}
                onClick={copy}
              >
                {copied ? "Copied!" : "Copy email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}