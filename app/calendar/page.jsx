"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, Download, RotateCcw, ExternalLink } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Helper: wraps month to following month; flags year:2027 when it crosses Dec→Jan
function followingMonth(i) {
  const m = (i + 1) % 12;
  return { month: m, year: m === 0 ? 2027 : 2026 };
}

const DEADLINES = [
  // VAT — due 20th of following month
  ...Array.from({ length: 12 }, (_, i) => {
    const { month, year } = followingMonth(i);
    return {
      id: `vat-${i}`,
      type: "VAT",
      label: `VAT Return — ${MONTHS[i]} 2026`,
      month,
      day: 20,
      year,
      color: CORAL,
      agency: "MRA",
      url: "https://eservices.mra.mu/",
      note: "File via MRA e-Services by 20th of following month",
    };
  }),

  // PAYE — due 28th of following month
  ...Array.from({ length: 12 }, (_, i) => {
    const { month, year } = followingMonth(i);
    return {
      id: `paye-${i}`,
      type: "PAYE",
      label: `PAYE — ${MONTHS[i]} 2026`,
      month,
      day: 28,
      year,
      color: BLUE,
      agency: "MRA",
      url: "https://eservices.mra.mu/",
      note: "Employee income tax deductions — file and pay by 28th of following month",
    };
  }),

  // CSG/NSF — due 28th of following month
  ...Array.from({ length: 12 }, (_, i) => {
    const { month, year } = followingMonth(i);
    return {
      id: `csg-${i}`,
      type: "CSG/NSF",
      label: `CSG / NSF — ${MONTHS[i]} 2026`,
      month,
      day: 28,
      year,
      color: GREEN,
      agency: "MRA",
      url: "https://eservices.mra.mu/",
      note: "Social contributions — due 28th of following month (same remittance as PAYE)",
    };
  }),

  // HRDC Training Levy — due 28th of following month (employer only, 1.5% of basic)
  ...Array.from({ length: 12 }, (_, i) => {
    const { month, year } = followingMonth(i);
    return {
      id: `hrdc-${i}`,
      type: "HRDC",
      label: `HRDC Training Levy — ${MONTHS[i]} 2026`,
      month,
      day: 28,
      year,
      color: "#0891b2",
      agency: "HRDC",
      url: "https://www.hrdc.mu/",
      note: "Training levy 1.5% of basic salary (employer only) — due 28th of following month",
    };
  }),

  // TDS — quarterly, due 15th of month after quarter end
  { id: "tds-q1", type: "TDS", label: "TDS Return — Q1 2026 (Jan–Mar)", month: 3, day: 15, year: 2026, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly return" },
  { id: "tds-q2", type: "TDS", label: "TDS Return — Q2 2026 (Apr–Jun)", month: 6, day: 15, year: 2026, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly return" },
  { id: "tds-q3", type: "TDS", label: "TDS Return — Q3 2026 (Jul–Sep)", month: 9, day: 15, year: 2026, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly return" },
  { id: "tds-q4", type: "TDS", label: "TDS Return — Q4 2026 (Oct–Dec)", month: 0, day: 15, year: 2027, color: "#8B5CF6", agency: "MRA", url: "https://eservices.mra.mu/", note: "Tax Deducted at Source — quarterly return" },

  // APS — quarterly advance income tax, due last day of month after quarter end
  { id: "aps-q1", type: "APS", label: "APS (Advance Payment System) — Q1", month: 3, day: 30, year: 2026, color: "#B45309", agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment — Q1 (Jan–Mar)" },
  { id: "aps-q2", type: "APS", label: "APS — Q2", month: 6, day: 31, year: 2026, color: "#B45309", agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment — Q2 (Apr–Jun)" },
  { id: "aps-q3", type: "APS", label: "APS — Q3", month: 9, day: 31, year: 2026, color: "#B45309", agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment — Q3 (Jul–Sep)" },
  { id: "aps-q4", type: "APS", label: "APS — Q4", month: 0, day: 31, year: 2027, color: "#B45309", agency: "MRA", url: "https://eservices.mra.mu/", note: "Advance income tax payment — Q4 (Oct–Dec)" },

  // Annual
  { id: "corp-tax", type: "Annual", label: "Corporate / Income Tax Return — FY2025/26", month: 8, day: 30, year: 2026, color: NAVY, agency: "MRA", url: "https://eservices.mra.mu/", note: "Annual tax return for financial year ending June 2026" },
  { id: "annual-return", type: "Annual", label: "Annual Return — MNS", month: 0, day: 28, year: 2027, color: "#6b7280", agency: "MNS", url: "https://onlinesearch.mns.mu", note: "Annual company return — due date varies by incorporation month; check MNS" },
];

const TYPE_COLORS = {
  VAT: CORAL,
  PAYE: BLUE,
  "CSG/NSF": GREEN,
  HRDC: "#0891b2",
  TDS: "#8B5CF6",
  APS: "#B45309",
  Annual: NAVY,
};

const ALL_TYPES = ["VAT", "PAYE", "CSG/NSF", "HRDC", "TDS", "APS", "Annual"];

export default function ComplianceCalendar() {
  const [selectedTypes, setSelectedTypes] = useState(ALL_TYPES);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [vatRegistered, setVatRegistered] = useState(true);
  const [hasEmployees, setHasEmployees] = useState(true);

  function toggleType(t) {
    setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  const now = new Date();
  const currentMonth = now.getMonth();

  const EMPLOYEE_TYPES = new Set(["PAYE", "CSG/NSF", "HRDC"]);

  const filtered = DEADLINES
    .filter(d => selectedTypes.includes(d.type))
    .filter(d => vatRegistered || d.type !== "VAT")
    .filter(d => hasEmployees || !EMPLOYEE_TYPES.has(d.type))
    .filter(d => selectedMonth === null || d.month === selectedMonth)
    .sort((a, b) => {
      const ya = a.year || 2026;
      const yb = b.year || 2026;
      if (ya !== yb) return ya - yb;
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });

  function generateICS() {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//OuBiznes.mu//Compliance Calendar//EN",
      "CALSCALE:GREGORIAN",
    ];
    filtered.forEach((d, idx) => {
      const year = d.year || 2026;
      const m = String(d.month + 1).padStart(2, "0");
      const day = String(d.day).padStart(2, "0");
      // Reminder: 3 days before at 09:00 Mauritius time (UTC+4)
      const reminderDate = new Date(year, d.month, d.day - 3);
      const ry = reminderDate.getFullYear();
      const rm = String(reminderDate.getMonth() + 1).padStart(2, "0");
      const rd = String(reminderDate.getDate()).padStart(2, "0");
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${d.id}-2026@oubiznes.mu`);
      lines.push(`SUMMARY:${d.label}`);
      lines.push(`DTSTART;VALUE=DATE:${year}${m}${day}`);
      lines.push(`DTEND;VALUE=DATE:${year}${m}${day}`);
      lines.push(`DESCRIPTION:${d.note} | Agency: ${d.agency} | Source: mra.mu`);
      lines.push(`URL:${d.url}`);
      lines.push("BEGIN:VALARM");
      lines.push("TRIGGER;VALUE=DATE-TIME:" + `${ry}${rm}${rd}T050000Z`);
      lines.push("ACTION:DISPLAY");
      lines.push(`DESCRIPTION:Reminder: ${d.label} due in 3 days`);
      lines.push("END:VALARM");
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
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Compliance Calendar 2026</span>
            </div>
          </Link>
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
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 16 }}>
          Every VAT, PAYE, CSG/NSF, HRDC, TDS, APS and annual filing deadline for Mauritius. Download to Google or Apple Calendar.
        </p>

        {/* Info box */}
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "12px 16px", marginBottom: 12, fontSize: 13, color: "#0369a1" }}>
          ℹ️ Deadlines sourced from MRA Mauritius. Always verify at{" "}
          <a href="https://www.mra.mu/important-dates" target="_blank" rel="noopener noreferrer" style={{ color: "#0369a1", fontWeight: 700, textDecoration: "underline" }}>
            mra.mu/important-dates
          </a>. Last updated April 2026.
        </div>

        {/* Disclaimer */}
        <div style={{ background: "#FEF9C3", border: "1px solid #FCD34D", borderRadius: 10, padding: "10px 16px", marginBottom: 24, fontSize: 13, color: "#92400e" }}>
          Deadlines shown are estimates based on MRA rules effective July 2025. Always verify at{" "}
          <a href="https://www.mra.mu" target="_blank" rel="noopener noreferrer" style={{ color: "#92400e", fontWeight: 700, textDecoration: "underline" }}>mra.mu</a>{" "}
          before filing.
        </div>

        {/* Business profile toggles */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setVatRegistered(v => !v)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "2px solid",
              background: vatRegistered ? GREEN : "#fff",
              color: vatRegistered ? "#fff" : "#6b7280",
              borderColor: vatRegistered ? GREEN : "#e5e7eb",
            }}
          >
            {vatRegistered ? "✓ " : ""}VAT Registered
          </button>
          <button
            onClick={() => setHasEmployees(v => !v)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "2px solid",
              background: hasEmployees ? GREEN : "#fff",
              color: hasEmployees ? "#fff" : "#6b7280",
              borderColor: hasEmployees ? GREEN : "#e5e7eb",
            }}
          >
            {hasEmployees ? "✓ " : ""}Has Employees
          </button>
        </div>

        {/* Filing type filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          {ALL_TYPES.map(t => (
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

        {/* Deadline count */}
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
          {filtered.length} deadline{filtered.length !== 1 ? "s" : ""} shown
        </p>

        {/* Deadlines */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No deadlines match your filters.</div>
          )}
          {filtered.map(d => {
            const year = d.year || 2026;
            const isPast = new Date(year, d.month, d.day) < now;
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
                  {year === 2027 && <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>2027</div>}
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
      </div>

      <EmailCapture source="/calendar" message="Get alerted when MRA deadlines or tax rules are updated." />

      <footer className="bg-white border-t border-gray-200 print:hidden" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
