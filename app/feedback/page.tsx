"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, Send, ExternalLink, ChevronUp } from "lucide-react";

const NAVY    = "#0A1628";
const CORAL   = "#0D9488";
const GOLD    = "#F4C430";
const GREEN   = "#0F7B3F";
const BLUE    = "#1E5AA0";
const PRIMARY = "#0F6E56";

interface Suggestion {
  id:            string;
  title:         string;
  problem:       string | null;
  target_user:   string | null;
  willing_to_pay: string | null;
  votes:         number;
  created_at:    string;
}

type FormState = "idle" | "sending" | "done" | "error";

export default function FeedbackPage() {
  // Section 1 — Business profile
  const [profile, setProfile] = useState({
    businessName:     "",
    businessType:     "",
    industry:         "",
    biggestChallenge: "",
    email:            "",
  });
  const [profileState, setProfileState] = useState<FormState>("idle");

  // Section 2 — Tool suggestion
  const [suggestion, setSuggestion] = useState({
    title:         "",
    problem:       "",
    targetUser:    "",
    willingToPay:  "",
    email:         "",
  });
  const [suggestionState, setSuggestionState] = useState<FormState>("idle");

  // Existing suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [voteModal, setVoteModal]     = useState<{ id: string; title: string } | null>(null);
  const [voteEmail, setVoteEmail]     = useState("");
  const [voteState, setVoteState]     = useState<FormState>("idle");
  const [votedIds, setVotedIds]       = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/feedback/suggestions")
      .then(r => r.ok ? r.json() : [])
      .then(setSuggestions)
      .catch(() => {});

    // Restore voted state from localStorage
    const restored = new Set<string>();
    try {
      const raw = localStorage.getItem("feedback_voted");
      if (raw) JSON.parse(raw).forEach((id: string) => restored.add(id));
    } catch {}
    setVotedIds(restored);
  }, []);

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (profileState === "sending") return;
    setProfileState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "profile", ...profile }),
      });
      setProfileState(res.ok ? "done" : "error");
    } catch {
      setProfileState("error");
    }
  }

  async function submitSuggestion(e: React.FormEvent) {
    e.preventDefault();
    if (suggestionState === "sending" || !suggestion.title.trim()) return;
    setSuggestionState("sending");
    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "suggestion", ...suggestion }),
      });
      if (res.ok) {
        setSuggestionState("done");
        // Refresh suggestions list
        fetch("/api/feedback/suggestions").then(r => r.ok ? r.json() : []).then(setSuggestions).catch(() => {});
      } else {
        setSuggestionState("error");
      }
    } catch {
      setSuggestionState("error");
    }
  }

  async function handleVote(e: React.FormEvent) {
    e.preventDefault();
    if (!voteModal || !voteEmail || voteState === "sending") return;
    setVoteState("sending");
    try {
      const res = await fetch("/api/feedback/suggestions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ suggestion_id: voteModal.id, email: voteEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        const newVoted = new Set(votedIds).add(voteModal.id);
        setVotedIds(newVoted);
        try { localStorage.setItem("feedback_voted", JSON.stringify([...newVoted])); } catch {}
        if (!data.already) {
          setSuggestions(prev =>
            prev.map(s => s.id === voteModal.id ? { ...s, votes: s.votes + 1 } : s)
          );
        }
        setVoteState("done");
      } else {
        setVoteState("error");
      }
    } catch {
      setVoteState("error");
    }
  }

  function openVote(s: Suggestion) {
    if (votedIds.has(s.id)) return;
    setVoteModal({ id: s.id, title: s.title });
    setVoteEmail("");
    setVoteState("idle");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    border: "1px solid #e0d9ce", borderRadius: 8,
    padding: "10px 14px", fontSize: 14, color: NAVY,
    background: "#faf9f7", outline: "none", marginBottom: 10,
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
  const labelStyle: React.CSSProperties  = { fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 };

  return (
    <div style={{ background: "#FAF5EE", minHeight: "100vh", colorScheme: "light" }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Feedback</span>
          </Link>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
            <Home size={14} /> Home
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>Share your feedback</h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32 }}>
          Help us understand your business — and tell us what to build next.
        </p>

        {/* Section 1 — Business Profile */}
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>About your business</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Takes 30 seconds. Helps us build tools for real Mauritian businesses.</p>

          {profileState === "done" ? (
            <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: "#065F46" }}>
              ✓ Thank you! Your profile has been saved.
            </div>
          ) : (
            <form onSubmit={submitProfile}>
              <label style={labelStyle}>Business name (optional)</label>
              <input style={inputStyle} type="text" placeholder="e.g. Moris Tech Ltd"
                value={profile.businessName} onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))} />

              <label style={labelStyle}>Business type *</label>
              <select style={selectStyle} required
                value={profile.businessType} onChange={e => setProfile(p => ({ ...p, businessType: e.target.value }))}>
                <option value="">Select...</option>
                <option>Sole trader</option>
                <option>Partnership</option>
                <option>Private Ltd (Ltd)</option>
                <option>Just starting up</option>
                <option>Not yet registered</option>
              </select>

              <label style={labelStyle}>Industry *</label>
              <select style={selectStyle} required
                value={profile.industry} onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}>
                <option value="">Select...</option>
                <option>Retail</option>
                <option>Food & Beverage</option>
                <option>Services</option>
                <option>Construction</option>
                <option>IT / Technology</option>
                <option>Agriculture</option>
                <option>Tourism & Hospitality</option>
                <option>Manufacturing</option>
                <option>Other</option>
              </select>

              <label style={labelStyle}>Biggest challenge right now *</label>
              <select style={selectStyle} required
                value={profile.biggestChallenge} onChange={e => setProfile(p => ({ ...p, biggestChallenge: e.target.value }))}>
                <option value="">Select...</option>
                <option>Compliance & tax</option>
                <option>Getting funding</option>
                <option>Marketing & finding customers</option>
                <option>Managing cash flow</option>
                <option>Hiring & HR</option>
                <option>Other</option>
              </select>

              <label style={labelStyle}>Your email *</label>
              <input style={inputStyle} type="email" placeholder="your@email.com" required
                value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />

              {profileState === "error" && (
                <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 10 }}>
                  Something went wrong. Please try again.
                </div>
              )}

              <button type="submit" disabled={profileState === "sending"} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: PRIMARY, color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 18px", fontWeight: 700, fontSize: 14,
                cursor: profileState === "sending" ? "wait" : "pointer",
                opacity: profileState === "sending" ? 0.7 : 1,
              }}>
                <Send size={14} /> {profileState === "sending" ? "Saving..." : "Save my profile"}
              </button>
            </form>
          )}
        </div>

        {/* Section 2 — Tool Suggestion */}
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "24px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Suggest a new tool</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>What should we build next? We read every suggestion.</p>

          {suggestionState === "done" ? (
            <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: "#065F46" }}>
              ✓ Your suggestion has been submitted — thank you!
            </div>
          ) : (
            <form onSubmit={submitSuggestion}>
              <label style={labelStyle}>Tool idea title *</label>
              <input style={inputStyle} type="text" placeholder="e.g. Invoice Generator" required
                value={suggestion.title} onChange={e => setSuggestion(s => ({ ...s, title: e.target.value }))} />

              <label style={labelStyle}>What problem does it solve?</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                placeholder="Describe the problem Mauritian businesses face..."
                value={suggestion.problem} onChange={e => setSuggestion(s => ({ ...s, problem: e.target.value }))} />

              <label style={labelStyle}>Who would use it?</label>
              <select style={selectStyle}
                value={suggestion.targetUser} onChange={e => setSuggestion(s => ({ ...s, targetUser: e.target.value }))}>
                <option value="">Select...</option>
                <option>Any business</option>
                <option>Sole traders</option>
                <option>Ltd companies</option>
                <option>Startups</option>
                <option>All</option>
              </select>

              <label style={labelStyle}>Would you pay for this?</label>
              <select style={selectStyle}
                value={suggestion.willingToPay} onChange={e => setSuggestion(s => ({ ...s, willingToPay: e.target.value }))}>
                <option value="">Select...</option>
                <option>Yes — Rs 100-200/month</option>
                <option>Yes — Rs 300-500/month</option>
                <option>No — only if free</option>
                <option>Not sure</option>
              </select>

              <label style={labelStyle}>Your email *</label>
              <input style={inputStyle} type="email" placeholder="your@email.com" required
                value={suggestion.email} onChange={e => setSuggestion(s => ({ ...s, email: e.target.value }))} />

              {suggestionState === "error" && (
                <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 10 }}>
                  Something went wrong. Please try again.
                </div>
              )}

              <button type="submit" disabled={suggestionState === "sending"} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: PRIMARY, color: "#fff", border: "none", borderRadius: 8,
                padding: "10px 18px", fontWeight: 700, fontSize: 14,
                cursor: suggestionState === "sending" ? "wait" : "pointer",
                opacity: suggestionState === "sending" ? 0.7 : 1,
              }}>
                <Send size={14} /> {suggestionState === "sending" ? "Submitting..." : "Submit idea"}
              </button>
            </form>
          )}
        </div>

        {/* Existing suggestions */}
        {suggestions.length > 0 && (
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Community suggestions</h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Sorted by votes. Click to add your voice.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {suggestions.map(s => (
                <div key={s.id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 2 }}>{s.title}</div>
                    {s.problem && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{s.problem}</div>}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {s.target_user && (
                        <span style={{ fontSize: 11, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 99 }}>{s.target_user}</span>
                      )}
                      {s.willing_to_pay && (
                        <span style={{ fontSize: 11, background: "#f0fdf4", color: GREEN, padding: "2px 8px", borderRadius: 99 }}>{s.willing_to_pay}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <button
                      onClick={() => openVote(s)}
                      disabled={votedIds.has(s.id)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                        background: votedIds.has(s.id) ? "#f3f4f6" : "#eff6ff",
                        border: `1.5px solid ${votedIds.has(s.id) ? "#e5e7eb" : BLUE}`,
                        borderRadius: 8, padding: "6px 12px",
                        cursor: votedIds.has(s.id) ? "default" : "pointer",
                        color: votedIds.has(s.id) ? "#9ca3af" : BLUE,
                      }}
                    >
                      <ChevronUp size={16} />
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{s.votes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vote modal */}
      {voteModal && (
        <div onClick={() => setVoteModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", maxWidth: 380, width: "90%", position: "relative" }}>
            <button onClick={() => setVoteModal(null)} style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", fontSize: 18, color: "#999", cursor: "pointer" }}>×</button>
            <div style={{ fontWeight: 700, fontSize: 16, color: NAVY, marginBottom: 6 }}>Vote for &ldquo;{voteModal.title}&rdquo;</div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>Enter your email to register your vote.</div>
            {voteState === "done" ? (
              <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#065F46" }}>Vote recorded! Thank you.</div>
            ) : (
              <form onSubmit={handleVote}>
                <input type="email" value={voteEmail} onChange={e => setVoteEmail(e.target.value)}
                  placeholder="your@email.com" required autoFocus
                  style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e0d9ce", borderRadius: 8, padding: "10px 14px", fontSize: 13, outline: "none", marginBottom: 10 }} />
                {voteState === "error" && (
                  <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#991B1B", marginBottom: 10 }}>Something went wrong. Try again.</div>
                )}
                <button type="submit" disabled={voteState === "sending"} style={{
                  width: "100%", background: PRIMARY, color: "#fff", border: "none",
                  borderRadius: 8, padding: 10, fontWeight: 700, fontSize: 13,
                  cursor: voteState === "sending" ? "wait" : "pointer",
                  opacity: voteState === "sending" ? 0.7 : 1,
                }}>
                  {voteState === "sending" ? "Submitting..." : "Submit Vote"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>{" "}·{" "}
          <Link href="/feedback" style={{ color: CORAL, textDecoration: "underline" }}>
            <ExternalLink size={11} style={{ display: "inline", verticalAlign: "middle" }} /> Suggest a tool
          </Link>
        </p>
      </footer>
    </div>
  );
}
