"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, Download, RotateCcw, ExternalLink } from "lucide-react";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const DEADLINES = [
  // VAT — 20th of following month
  ...Array.from({length: 12}, (_, i) => ({
    id: `vat-${i}`,
    type: "VAT",
    label: `VAT Return — ${MONTHS[i]} 2026`,
    month: (i + 1) % 12,
    day: 20,
    color: CORAL,
    agency: "MRA",
    url: "https://eservices.mra.mu/",
    note: "File via MRA e-Services by 20th",
  })),
  // PAYE — 28th of same month
  ...Array.from({length: 12}, (_, i) => ({
    id: `paye-${i}`,
    type: "PAYE",
    label: `PAYE / NPF — ${MONTHS[i]} 2026`,
    month: i,
    day: 28,
    color: BLUE,
    agency: "MRA",
    url: "https://eservices.mra.mu/",
    note: "Employee deductions — file and pay by 28th",
  })),
  // CSG/NSF — 28th of same month
  ...Array.from({length: 12}, (_, i) => ({
    id: `csg-${i}`,
    type: "CSG/NSF",
    label: `CSG / NSF — ${MONTHS[i]} 2026`,
    month: i,
    day: 28,
    color: GREEN,
    agency: "MRA / NSF",
    url: "https://eservices.mra.mu/",
    note: "Social contributions — file same day as PAYE",
  })),
  // TDS — quarterly
  { id: "tds-q1", type: "TDS", label: "TDS Return — Q1 2026 (Jan–Mar)", month: 3, day: 15, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly" },
  { id: "tds-q2", type: "TDS", label: "TDS Return — Q2 2026 (Apr–Jun)", month: 6, day: 15, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly" },
  { id: "tds-q3", type: "TDS", label: "TDS Return — Q3 2026 (Jul–Sep)", month: 9, day: 15, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly" },
  { id: "tds-q4", type: "TDS", label: "TDS Return — Q4 2026 (Oct–Dec)", month: 0, day: 15, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly", year: 2027 },
  // APS — quarterly
  { id: "aps-q1", type: "APS", label: "APS (Advance Payment System) — Q1", month: 3, day: 30, color: GOLD, agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment" },
  { id: "aps-q2", type: "APS", label: "APS — Q2", month: 6, day: 31, color: GOLD, agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment" },
  { id: "aps-q3", type: "APS", label: "APS — Q3", month: 9, day: 31, color: GOLD, agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment" },
  // Annual
  { id: "corp-tax", type: "Annual", label: "Corporate / Income Tax Return — FY2025", month: 8, day: 30, color: NAVY, agency: "MRA", url: "https://eservices.mra.mu/", note: "Annual tax return for FY ending June 2025" },
  { id: "annual-return", type: "Annual", label: "Annual Return — CBRD", month: 0, day: 28, color: "#6b7280", agency: "CBRD", url: "https://cbrd.govmu.org/", note: "Annual company return — varies by incorporation month" },
];

const TYPE_COLORS = {
  VAT: CORAL,
  PAYE: BLUE,
  "CSG/NSF": GREEN,
  TDS: "#8B5CF6",
  APS: "#B45309",
  Annual: NAVY,
};

export default function ComplianceCalendar() {
  const [selectedTypes, setSelectedTypes] = useState(["VAT", "PAYE", "CSG/NSF", "TDS", "APS", "Annual"]);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const allTypes = ["VAT", "PAYE", "CSG/NSF", "TDS", "APS", "Annual"];

  function toggleType(t) {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  const now = new Date();
  const currentMonth = now.getMonth();

  const filtered = DEADLINES
    .filter(d => selectedTypes.includes(d.type))
    .filter(d => selectedMonth === null || d.month === selectedMonth)
    .sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

  function generateICS() {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OuBiznes.mu//Compliance Calendar//EN"];
    DEADLINES.forEach(d => {
      const year = d.year || 2026;
      const m = String(d.month + 1).padStart(2, "0");
      const day = String(d.day).padStart(2, "0");
      lines.push("BEGIN:VEVENT");
      lines.push(`SUMMARY:${d.label}`);
      lines.push(`DTSTART;VALUE=DATE:${year}${m}${day}`);
      lines.push(`DTEND;VALUE=DATE:${year}${m}${day}`);
      lines.push(`DESCRIPTION:${d.note} | ${d.agency}`);
      lines.push(`URL:${d.url}`);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "oubiznes-compliance-2026.ics";
    a.click();
  }

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
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Compliance Calendar 2026</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={generateICS} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#fff", background: CORAL, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>
              <Download size={14} /> Download .ics
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
          <span style={{ display: "block" }}>MRA Compliance</span>
          <span style={{ display: "block", color: CORAL }}>Calendar 2026</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
          Every VAT, PAYE, TDS, APS and annual filing deadline for Mauritius. Download to Google or Apple Calendar.
        </p>

        {/* Type filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {allTypes.map(t => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "2px solid",
                background: selectedTypes.includes(t) ? TYPE_COLORS[t] : "#fff",
                color: selectedTypes.includes(t) ? "#fff" : "#6b7280",
                borderColor: selectedTypes.includes(t) ? TYPE_COLORS[t] : "#e5e7eb",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Month filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 28 }}>
          <button
            onClick={() => setSelectedMonth(null)}
            style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid", background: selectedMonth === null ? NAVY : "#fff", color: selectedMonth === null ? "#fff" : "#6b7280", borderColor: selectedMonth === null ? NAVY : "#e5e7eb" }}
          >All months</button>
          {MONTHS.map((m, i) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(i === selectedMonth ? null : i)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1.5px solid",
                background: selectedMonth === i ? NAVY : i === currentMonth ? "#f0f4ff" : "#fff",
                color: selectedMonth === i ? "#fff" : NAVY,
                borderColor: selectedMonth === i ? NAVY : i === currentMonth ? BLUE : "#e5e7eb",
              }}
            >{m}</button>
          ))}
        </div>

        {/* Deadlines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No deadlines match your filters.</div>
          )}
          {filtered.map(d => {
            const isPast = new Date(2026, d.month, d.day) < now;
            return (
              <div key={d.id} style={{
                background: "#fff",
                border: `1.5px solid ${isPast ? "#e5e7eb" : d.color}`,
                borderLeft: `5px solid ${d.color}`,
                borderRadius: 10,
                padding: "14px 18px",
                opacity: isPast ? 0.55 : 1,
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}>
                <div style={{ textAlign: "center", minWidth: 44 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: d.color }}>{d.day}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{MONTHS[d.month]}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{d.label}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{d.note}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: d.color, color: "#fff" }}>{d.type}</span>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: CORAL, textDecoration: "underline", display: "flex", alignItems: "center", gap: 3 }}>
                    {d.agency} <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 28, background: "#f9fafb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            🇲🇺 Deadlines sourced from MRA Mauritius. Always verify at{" "}
            <a href="https://www.mra.mu/important-dates" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 3 }}>
              mra.mu/important-dates <ExternalLink size={12} />
            </a>. Last updated April 2026.
          </p>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 print:hidden" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
