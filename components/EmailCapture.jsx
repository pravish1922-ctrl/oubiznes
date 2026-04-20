"use client";
import { useState } from "react";

const NAVY = "#0A1628";
const TEAL = "#0D9488";

export default function EmailCapture({ source, message }) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [email, setEmail] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("https://formspree.io/f/maqabeqb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        background: "#F0FDF4", border: "1.5px solid #86EFAC",
        borderRadius: 14, padding: "16px 20px", marginTop: 24,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>✅</span>
        <div>
          <p style={{ fontWeight: 700, color: "#166534", fontSize: 14, margin: 0 }}>You're on the list!</p>
          <p style={{ color: "#166534", fontSize: 13, margin: 0 }}>We'll email you when something useful drops.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", border: "1.5px solid #e5e7eb",
      borderRadius: 14, padding: "20px 20px", marginTop: 24,
    }}>
      <p style={{ fontWeight: 700, color: NAVY, fontSize: 14, marginBottom: 4 }}>
        Stay updated
      </p>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
        {message || "Get free alerts when tools, grants, or rules change."}
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading"}
          style={{
            flex: 1, padding: "11px 14px", borderRadius: 10,
            border: "1.5px solid #e5e7eb", fontSize: 14,
            color: NAVY, outline: "none",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          style={{
            padding: "11px 18px", background: TEAL, color: "#fff",
            border: "none", borderRadius: 10, fontWeight: 700,
            fontSize: 14, cursor: "pointer",
            opacity: status === "loading" || !email.trim() ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "..." : "Notify me"}
        </button>
      </form>
      {status === "error" && (
        <p style={{ color: "#dc2626", fontSize: 12, marginTop: 8 }}>
          Something went wrong. Please try again.
        </p>
      )}
      <p style={{ color: "#d1d5db", fontSize: 11, marginTop: 10 }}>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
