"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const NAVY    = "#0A1628";
const CORAL   = "#0D9488";
const GOLD    = "#F4C430";
const GREEN   = "#0F7B3F";
const BLUE    = "#1E5AA0";
const PRIMARY = "#0F6E56";
const CREAM   = "#F5F0E8";
const DIVIDER = "#d0c9be";

interface Tool { href: string; emoji: string; title: string; desc: string }
interface VoteItem { id: string; title: string; desc: string; hot?: boolean }
interface ModalState { featureId: string; title: string }

const STARTING: Tool[] = [
  { href: "/structure", emoji: "🏗️", title: "Business Structure Advisor", desc: "Sole trader, partnership, or Ltd? 5 questions, clear answer." },
  { href: "/lookup",    emoji: "🔍", title: "BRN Lookup",                  desc: "Search any Mauritian registered company. Official registry." },
  { href: "/plan",      emoji: "📋", title: "Business Plan Generator",      desc: "Professional plan in 10 minutes — AI-drafted, Mauritius-focused." },
];

const FUNDING: Tool[] = [
  { href: "/grants", emoji: "💰", title: "Grants Finder",               desc: "Find every SME grant you qualify for — TINNS, ICDS and more." },
  { href: "/apply",  emoji: "📝", title: "Grant Application Generator", desc: "AI-drafted first version of your grant application in minutes." },
];

const COMPLIANCE: Tool[] = [
  { href: "/calendar", emoji: "📅", title: "Compliance Calendar", desc: "Every MRA deadline for 2026, downloadable to your calendar." },
  { href: "/vat",      emoji: "🧮", title: "VAT Calculator",      desc: "Calculate VAT instantly — standard, zero-rated, and exempt." },
  { href: "/paye",     emoji: "👥", title: "PAYE Calculator",     desc: "Net pay, employer contributions, CSG and NSF in one click." },
];

const COMING_NEXT: VoteItem[] = [
  { id: "tiktok",      title: "AI TikTok Creator",  desc: "Auto-generate product videos for your business", hot: true },
  { id: "website",     title: "Website Builder",     desc: "Launch a business site in minutes" },
  { id: "marketplace", title: "Marketplace",         desc: "List and sell your products locally" },
  { id: "ai-learning", title: "AI Learning Space",   desc: "Upskill your team with AI-powered training" },
];

const SECTION_HEADER: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#999",
  textTransform: "uppercase", paddingBottom: 8,
  borderBottom: "1px solid #e0d9ce", marginBottom: 8,
};

function ToolRow({ tool, hovered, onEnter, onLeave }: {
  tool: Tool;
  hovered: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <Link href={tool.href} style={{ textDecoration: "none", display: "block", marginBottom: 6 }}>
      <div
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          background: "#fff",
          border: `1px solid ${hovered ? PRIMARY : "#e8e3da"}`,
          borderRadius: 8,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{tool.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{tool.title}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{tool.desc}</div>
        </div>
        <span style={{ color: "#d1d5db", fontSize: 14, flexShrink: 0 }}>→</span>
      </div>
    </Link>
  );
}

type ModalStatus = "idle" | "sending" | "done" | "already" | "error";
type SubState    = "idle" | "sending" | "done" | "already" | "error";

export default function Home() {
  const [hovered, setHovered]     = useState<string | null>(null);
  const [votes, setVotes]         = useState<Record<string, number>>(
    Object.fromEntries(COMING_NEXT.map(c => [c.id, 0]))
  );
  const [voted, setVoted]         = useState<Set<string>>(new Set());
  const [statusLine, setStatusLine] = useState<string>(
    "All 8 tools live and monitored. Powered by SPAK"
  );

  // Subscribe strip
  const [email, setEmail]         = useState("");
  const [subState, setSubState]   = useState<SubState>("idle");
  const emailRef = useRef<HTMLInputElement>(null);

  // Vote modal
  const [modal, setModal]           = useState<ModalState | null>(null);
  const [modalEmail, setModalEmail] = useState("");
  const [modalStatus, setModalStatus] = useState<ModalStatus>("idle");

  // Load vote counts from Supabase
  useEffect(() => {
    fetch("/api/votes")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setVotes(data); })
      .catch(() => {});
  }, []);

  // Load SPAK status for footer
  useEffect(() => {
    fetch("/api/spak/status")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.status_line) setStatusLine(data.status_line); })
      .catch(() => {});
  }, []);

  function openVoteModal(item: VoteItem) {
    if (voted.has(item.id)) return;
    setModal({ featureId: item.id, title: item.title });
    setModalEmail("");
    setModalStatus("idle");
  }

  function closeModal() {
    setModal(null);
    setModalEmail("");
    setModalStatus("idle");
  }

  async function handleVoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || !modalEmail || modalStatus === "sending") return;
    setModalStatus("sending");
    try {
      const res = await fetch("/api/votes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ feature_id: modal.featureId, email: modalEmail }),
      });
      const data = await res.json();
      if (data.already) {
        setModalStatus("already");
      } else if (res.ok || data.ok) {
        setVotes(v => ({ ...v, [modal.featureId]: v[modal.featureId] + 1 }));
        setVoted(s => new Set(s).add(modal.featureId));
        setModalStatus("done");
      } else {
        setModalStatus("error");
      }
    } catch {
      setModalStatus("error");
    }
  }

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || subState === "sending" || subState === "done" || subState === "already") return;
    setSubState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok || data.ok) {
        setSubState(data.already ? "already" : "done");
        setEmail("");
      } else {
        setSubState("error");
      }
    } catch {
      setSubState("error");
    }
  }

  const col: React.CSSProperties = { background: CREAM, padding: "16px 24px", alignContent: "start" };
  const hairline = "1px solid #ede8df";
  const col1: React.CSSProperties = { ...col, borderRight: hairline };
  const col2: React.CSSProperties = { ...col, borderRight: hairline };
  const col3: React.CSSProperties = { ...col };

  return (
    <>
      <style>{`
        .home-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          grid-template-rows: auto;
          gap: 0;
          background: transparent;
          flex: 1;
        }
        .email-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
          .email-strip {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* Vote modal */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 400,
              width: "90%",
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              style={{
                position: "absolute", top: 14, right: 16,
                background: "none", border: "none",
                fontSize: 18, color: "#999", cursor: "pointer", lineHeight: 1,
              }}
            >
              ×
            </button>

            <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2332", marginBottom: 6 }}>
              Vote for {modal.title}
            </div>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>
              Enter your email to register your vote. We&apos;ll only contact you when this feature is ready.
            </div>

            {modalStatus === "done" && (
              <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#065F46", marginBottom: 12 }}>
                Vote recorded! We&apos;ll email you when it&apos;s ready.
              </div>
            )}

            {modalStatus === "already" && (
              <div style={{ background: "#D1FAE5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#065F46", marginBottom: 12 }}>
                You&apos;ve already voted! We&apos;ll notify you when it launches.
              </div>
            )}

            {modalStatus === "error" && (
              <div style={{ background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#991B1B", marginBottom: 12 }}>
                Something went wrong. Please try again.
              </div>
            )}

            {(modalStatus === "done" || modalStatus === "already") ? null : (
              <form onSubmit={handleVoteSubmit}>
                <input
                  type="email"
                  value={modalEmail}
                  onChange={e => setModalEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1px solid #e0d9ce", borderRadius: 8,
                    padding: "10px 14px", fontSize: 13,
                    background: CREAM, color: NAVY, outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={modalStatus === "sending"}
                  style={{
                    width: "100%", marginTop: 10,
                    background: PRIMARY, color: "#fff",
                    border: "none", borderRadius: 8,
                    padding: 10, fontWeight: 700, fontSize: 13,
                    cursor: modalStatus === "sending" ? "wait" : "pointer",
                    opacity: modalStatus === "sending" ? 0.7 : 1,
                  }}
                >
                  {modalStatus === "sending" ? "Submitting..." : "Submit Vote"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: CREAM, colorScheme: "light" }}>

        {/* Flag bar */}
        <div style={{ height: 8, display: "flex", flexShrink: 0 }}>
          <div style={{ flex: 1, background: "#CC0000" }} />
          <div style={{ flex: 1, background: BLUE }} />
          <div style={{ flex: 1, background: GOLD }} />
          <div style={{ flex: 1, background: GREEN }} />
        </div>

        {/* Header */}
        <header style={{ padding: "14px 28px", background: CREAM, flexShrink: 0, borderBottom: `1px solid ${DIVIDER}` }}>
          <div>
            <span style={{ fontWeight: 900, fontSize: 22, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 900, fontSize: 22, color: NAVY }}>.mu</span>
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0 0" }}>
            Free tools for Mauritian businesses — start, fund, and run smarter.
          </p>
        </header>

        {/* 3-column grid */}
        <main className="home-grid">

          {/* Col 1: Starting a Business + Funding & Growth */}
          <div style={col1}>
            <div style={SECTION_HEADER}>Starting a Business</div>
            {STARTING.map(t => (
              <ToolRow key={t.href} tool={t} hovered={hovered === t.href}
                onEnter={() => setHovered(t.href)} onLeave={() => setHovered(null)} />
            ))}
            <div style={{ borderTop: hairline, marginTop: 16, paddingTop: 16 }}>
              <div style={SECTION_HEADER}>Funding &amp; Growth</div>
              {FUNDING.map(t => (
                <ToolRow key={t.href} tool={t} hovered={hovered === t.href}
                  onEnter={() => setHovered(t.href)} onLeave={() => setHovered(null)} />
              ))}
            </div>
          </div>

          {/* Col 2: Compliance & Operations */}
          <div style={col2}>
            <div style={SECTION_HEADER}>Compliance &amp; Operations</div>
            {COMPLIANCE.map(t => (
              <ToolRow key={t.href} tool={t} hovered={hovered === t.href}
                onEnter={() => setHovered(t.href)} onLeave={() => setHovered(null)} />
            ))}
          </div>

          {/* Col 3: Coming Next — Vote */}
          <div style={col3}>
            <div style={SECTION_HEADER}>Coming Next — Vote</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {COMING_NEXT.map(item => {
                const hasVoted = voted.has(item.id);
                return (
                  <div key={item.id} style={{ background: "#fff", border: "1px solid #e8e3da", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2332" }}>{item.title}</span>
                      {item.hot && (
                        <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF9C3", color: "#854F0B", padding: "1px 6px", borderRadius: 99 }}>
                          Hot
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: "#aaa", marginBottom: 8, lineHeight: 1.4 }}>{item.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <button
                        onClick={() => openVoteModal(item)}
                        disabled={hasVoted}
                        style={{
                          background: hasVoted ? "#e5e7eb" : PRIMARY,
                          color: hasVoted ? "#9ca3af" : "#fff",
                          border: "none", borderRadius: 10, padding: "4px 11px",
                          fontWeight: 700, fontSize: 11,
                          cursor: hasVoted ? "default" : "pointer",
                          transition: "background 0.15s",
                        }}
                      >
                        {hasVoted ? "Voted" : "Vote"}
                      </button>
                      <span style={{ fontSize: 10, color: "#bbb" }}>{votes[item.id]} votes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Email signup strip */}
        <div className="email-strip" style={{ background: "#fff", borderTop: `1px solid #e0d9ce`, padding: "12px 40px", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>Stay updated — free tools, new features, grant alerts.</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>No spam. One email when something useful drops.</div>
          </div>
          {(subState === "done" || subState === "already") ? (
            <div style={{ fontSize: 13, color: PRIMARY, fontWeight: 600 }}>
              {subState === "already" ? "You’re already on the list!" : "You’re on the list."}
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (subState === "error") setSubState("idle"); }}
                placeholder="your@email.com"
                required
                style={{
                  padding: "8px 14px", borderRadius: 8,
                  border: `1px solid ${subState === "error" ? "#FCA5A5" : "#e0d9ce"}`,
                  fontSize: 13, color: NAVY, outline: "none", width: 200,
                }}
              />
              <button
                type="submit"
                disabled={subState === "sending"}
                style={{
                  padding: "8px 16px", background: PRIMARY, color: "#fff",
                  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13,
                  cursor: subState === "sending" ? "wait" : "pointer",
                  opacity: subState === "sending" ? 0.7 : 1,
                }}
              >
                {subState === "sending" ? "..." : "Notify me"}
              </button>
            </form>
          )}
        </div>

        {/* SPAK status bar */}
        <footer style={{ background: "#1a2332", padding: "10px 40px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: PRIMARY, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#9ca3af" }}>{statusLine}</span>
        </footer>

      </div>
    </>
  );
}
