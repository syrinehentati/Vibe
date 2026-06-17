import { useState } from "react"
import axios from "axios"

const API = "https://vibe-production-1126.up.railway.app"

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
      setError("Something went wrong. Try again.")
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
    <div style={{ maxWidth: 700, margin: "60px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Vibe ✉️</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Paste emails from your contact. Get a reply that sounds exactly like them.
      </p>

      <label style={{ fontWeight: 600 }}>Email history from your contact</label>
      <p style={{ fontSize: 12, color: "#999", margin: "4px 0 8px" }}>
        Separate multiple emails with a line containing only ---
      </p>
      <textarea
        rows={6}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
        placeholder={"Hey, just checking in on the proposal...\n---\nThanks for the update, looking forward to it!"}
        value={emails}
        onChange={e => setEmails(e.target.value)}
      />

      <label style={{ fontWeight: 600, display: "block", marginTop: 20 }}>What do you want to say?</label>
      <textarea
        rows={3}
        style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginTop: 8, boxSizing: "border-box" }}
        placeholder="Follow up on the proposal and ask about their timeline"
        value={context}
        onChange={e => setContext(e.target.value)}
      />

      <button
        onClick={generate}
        disabled={loading || !emails || !context}
        style={{
          marginTop: 16, padding: "12px 28px", background: loading ? "#999" : "#000",
          color: "#fff", border: "none", borderRadius: 8, fontSize: 15,
          cursor: loading ? "not-allowed" : "pointer", width: "100%"
        }}
      >
        {loading ? "Generating..." : "Generate Reply"}
      </button>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 32, padding: 20, background: "#f9f9f9", borderRadius: 8, border: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 12, color: "#999" }}>Detected tone</span>
              <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 14 }}>{result.detected_tone}</p>
            </div>
            <div>
              <span style={{ fontSize: 12, color: "#999" }}>Subject</span>
              <p style={{ margin: "2px 0 0", fontWeight: 600, fontSize: 14 }}>{result.subject}</p>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "12px 0" }} />
          <p style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{result.email}</p>
          <button
            onClick={copy}
            style={{ marginTop: 12, padding: "8px 20px", background: copied ? "#22c55e" : "#fff", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            {copied ? "Copied!" : "Copy email"}
          </button>
        </div>
      )}
    </div>
  )
}