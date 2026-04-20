"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, RotateCcw, ExternalLink } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const VAT_RATE = 0.15;
const THRESHOLD = 3000000;

export default function VATCalculator() {
  const [mode, setMode] = useState("add"); // "add" = price excl VAT, "extract" = price incl VAT
  const [amount, setAmount] = useState("");
  const [rateType, setRateType] = useState("standard"); // standard | zero | exempt

  const num = parseFloat(amount.replace(/,/g, "")) || 0;

  let exclVAT = 0, vatAmount = 0, inclVAT = 0;
  if (rateType === "standard") {
    if (mode === "add") {
      exclVAT = num;
      vatAmount = num * VAT_RATE;
      inclVAT = num + vatAmount;
    } else {
      inclVAT = num;
      exclVAT = num / (1 + VAT_RATE);
      vatAmount = inclVAT - exclVAT;
    }
  } else {
    // zero or exempt — no VAT
    exclVAT = num;
    vatAmount = 0;
    inclVAT = num;
  }

  const fmt = (n) => n.toLocaleString("en-MU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function reset() {
    setAmount("");
    setMode("add");
    setRateType("standard");
  }

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      {/* Flag bar */}
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>VAT Calculator</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              <RotateCcw size={14} /> Reset
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
          <span style={{ display: "block" }}>Mauritius VAT</span>
          <span style={{ display: "block", color: CORAL }}>Calculator 2026</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
          MRA standard VAT rate: <strong>15%</strong>. Registration threshold: <strong>Rs {(THRESHOLD/1000000).toFixed(0)}M turnover</strong>.
        </p>

        {/* Mode toggle */}
        <div style={{ background: "#f3f4f6", borderRadius: 12, padding: 4, display: "inline-flex", marginBottom: 24 }}>
          {[
            { value: "add", label: "Add VAT to price" },
            { value: "extract", label: "Extract VAT from price" },
          ].map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              style={{
                padding: "8px 18px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none",
                background: mode === m.value ? "#fff" : "transparent",
                color: mode === m.value ? NAVY : "#9ca3af",
                boxShadow: mode === m.value ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >{m.label}</button>
          ))}
        </div>

        {/* Rate type */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Supply type</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { value: "standard", label: "Standard (15%)" },
              { value: "zero", label: "Zero-rated (0%)" },
              { value: "exempt", label: "Exempt" },
            ].map(r => (
              <button
                key={r.value}
                onClick={() => setRateType(r.value)}
                style={{
                  padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: rateType === r.value ? CORAL : "#fff",
                  color: rateType === r.value ? "#fff" : "#374151",
                  border: `2px solid ${rateType === r.value ? CORAL : "#e5e7eb"}`,
                }}
              >{r.label}</button>
            ))}
          </div>
          {rateType === "exempt" && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>⚠️ Exempt supplies: you cannot reclaim input VAT on costs.</p>
          )}
          {rateType === "zero" && (
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>ℹ️ Zero-rated: you charge 0% VAT but can still reclaim input VAT.</p>
          )}
        </div>

        {/* Amount input */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
            {mode === "add" ? "Price excluding VAT (Rs)" : "Price including VAT (Rs)"}
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#6b7280" }}>Rs</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              style={{ width: "100%", padding: "14px 14px 14px 44px", fontSize: 22, fontWeight: 700, border: "2px solid #e5e7eb", borderRadius: 12, outline: "none", color: NAVY, boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = CORAL)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
        </div>

        {/* Results */}
        {num > 0 && (
          <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
            <div style={{ background: NAVY, padding: "14px 20px" }}>
              <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>VAT Breakdown</p>
            </div>
            <div style={{ padding: "20px" }}>
              {[
                { label: "Price excl. VAT", value: `Rs ${fmt(exclVAT)}`, highlight: false },
                { label: `VAT (${rateType === "standard" ? "15%" : "0%"})`, value: `Rs ${fmt(vatAmount)}`, highlight: false, color: CORAL },
                { label: "Price incl. VAT", value: `Rs ${fmt(inclVAT)}`, highlight: true },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ fontSize: 15, color: "#6b7280" }}>{row.label}</span>
                  <span style={{ fontSize: row.highlight ? 22 : 17, fontWeight: row.highlight ? 800 : 600, color: row.color || (row.highlight ? NAVY : "#374151") }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info box */}
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "16px 18px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 8 }}>Key MRA VAT rules (2026)</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
            <li>Register when annual turnover exceeds <strong>Rs 3 million</strong></li>
            <li>File monthly — return due by <strong>20th of following month</strong></li>
            <li>File via{" "}
              <a href="https://eservices.mra.mu/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
                MRA e-Services <ExternalLink size={11} />
              </a>
            </li>
            <li>Late penalty: <strong>Rs 2,000/month</strong> + 0.5% interest</li>
          </ul>
        </div>
      </div>
      <div style={{ maxWidth: 650, margin: "0 auto", padding: "0 20px" }}>
          <EmailCapture source="/vat" message="Get notified when VAT rates or thresholds change in Mauritius." />
      </div>
      <footer className="bg-white border-t border-gray-200" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu · Not tax advice — verify with MRA or your accountant ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
