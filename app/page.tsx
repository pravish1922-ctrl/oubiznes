"use client";
import Link from "next/link";
import { useState } from "react";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const tools = [
  {
    group: "Starting a Business",
    items: [
      {
        href: "/structure",
        emoji: "🏗️",
        title: "Business Structure Advisor",
        desc: "Sole trader, partnership, or Ltd? 5 questions, clear answer.",
        tag: "New",
        tagColor: GREEN,
        live: true,
      },
      {
        href: "/lookup",
        emoji: "🔍",
        title: "BRN Lookup",
        desc: "Search any Mauritian registered company.Powered by the official Mauritius company registry",
        tag: "New",
        tagColor: GREEN,
        /*tag: "Coming Soon",
        tagColor: GOLD,
        tagTextColor: NAVY,*/
        live: true,
        //notice: "We're in discussion with the Corporate and Business Registration Department (CBRD) to enable free live lookup for Mauritian businesses.",
      },
    ],
  },
  {
    group: "Funding & Growth",
    items: [
      {
        href: "/grants",
        emoji: "💰",
        title: "Grants Finder",
        desc: "Find every SME grant you qualify for — TINNS, ICDS, and 18 more.",
        live: true,
      },
      {
        href: "/apply",
        emoji: "📝",
        title: "Grant Application Generator",
        desc: "AI-drafted first version of your grant application in minutes.",
        live: true,
      },
    ],
  },
  {
    group: "Compliance & Operations",
    items: [
      {
        href: "/calendar",
        emoji: "📅",
        title: "Compliance Calendar",
        desc: "Every MRA deadline for 2026, downloadable to your calendar.",
        live: true,
      },
      {
        href: "/vat",
        emoji: "🧮",
        title: "VAT Calculator",
        desc: "Calculate VAT instantly — standard, zero-rated, and exempt.",
        live: true,
      },
      {
        href: "/paye",
        emoji: "👥",
        title: "PAYE Calculator",
        desc: "Net pay, employer contributions, CSG and NSF in one click.",
        live: true,
      },
    ],
  },
];

export default function Home() {
  const [hoveredHref, setHoveredHref] = useState(null);

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 900, fontSize: 36, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 900, fontSize: 36, color: NAVY }}>.mu</span>
          </div>
          <p style={{ fontSize: 18, color: NAVY, fontWeight: 700, marginBottom: 6 }}>
            Free tools for Mauritian businesses.
          </p>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
            Start, register, fund, and run your business — no consultants, no subscriptions, no jargon.
          </p>
        </div>

        {/* Tool groups */}
        {tools.map(group => (
          <div key={group.group} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              {group.group}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {group.items.map(tool => {
                const isHovered = hoveredHref === tool.href;
                const card = (
                  <div
                    style={{
                      background: "#fff",
                      border: `1.5px solid ${isHovered && tool.live ? CORAL : "#e5e7eb"}`,
                      borderRadius: 14,
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      cursor: tool.live ? "pointer" : "default",
                      transition: "border-color 0.15s ease",
                      opacity: tool.live ? 1 : 0.85,
                    }}
                    onMouseEnter={() => setHoveredHref(tool.href)}
                    onMouseLeave={() => setHoveredHref(null)}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0, marginTop: 1 }}>{tool.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{tool.title}</span>
                        {tool.tag && (
                          <span style={{
                            background: tool.tagColor,
                            color: tool.tagTextColor || "#fff",
                            fontSize: 10, fontWeight: 700,
                            padding: "2px 8px", borderRadius: 99,
                          }}>
                            {tool.tag}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>{tool.desc}</p>
                      {tool.notice && (
                        <div style={{ marginTop: 8, background: "#F0F7FF", borderRadius: 8, padding: "8px 12px" }}>
                          <p style={{ fontSize: 12, color: "#1E5AA0", margin: 0, lineHeight: 1.5 }}>
                            🤝 {tool.notice}
                          </p>
                        </div>
                      )}
                    </div>
                    {tool.live && (
                      <span style={{ color: "#d1d5db", fontSize: 18, flexShrink: 0, alignSelf: "center" }}>→</span>
                    )}
                  </div>
                );

                return tool.live ? (
                  <Link key={tool.href} href={tool.href} style={{ textDecoration: "none" }}>
                    {card}
                  </Link>
                ) : (
                  <div key={tool.href}>{card}</div>
                );
              })}
            </div>
          </div>
        ))}
        {/* Email capture */}
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
            Stay updated — free tools, new features, grant alerts.
          </p>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            No spam. One email when something useful drops.
          </p>
          <form
            action="https://formspree.io/f/maqabeqb"
            method="POST"
            style={{ display: "flex", gap: 8 }}
          >
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, color: NAVY, outline: "none" }}
            />
            <button
              type="submit"
              style={{ padding: "11px 20px", background: CORAL, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              Notify me
            </button>
          </form>
        </div>
        {/* Footer tagline */}
        <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 14, color: "#9ca3af", fontStyle: "italic" }}>
            Ou biznes, nou lafors. 🇲🇺
          </p>
          <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>
            © 2026 OuBiznes.mu ·{" "}
            <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>contact@oubiznes.mu</a>
          </p>
        </div>
      </div>
    </div>
  );
}
