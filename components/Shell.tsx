import Link from "next/link";
import { Home, ExternalLink } from "lucide-react";

const NAVY = "#0A1628";
const CORAL = "#E94F37";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

export default function Shell({ toolLabel, children, actions = [], externalLinks = [] }) {
  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: CORAL }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            {toolLabel && <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>{toolLabel}</span>}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {actions}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {children}
      </div>

      {/* Footer */}
      <footer style={{ background: "#fff", borderTop: "1px solid #e5e7eb", padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu
          {externalLinks.map((l, i) => (
            <span key={i}>
              {" · "}
              <a href={l.href} target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
                {l.label} <ExternalLink size={11} />
              </a>
            </span>
          ))}
          {" · "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
