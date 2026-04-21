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

// MRA 2025-26 income tax brackets (monthly)
const BRACKETS = [
  { limit: 25000, rate: 0 },      // 0% up to Rs 25,000/month (Rs 300K/year)
  { limit: 83333, rate: 0.15 },   // 15% up to Rs 83,333/month (Rs 1M/year)
  { limit: Infinity, rate: 0.20 },// 20% above
];

// CSG rates 2025-26 (employee)
const CSG_EMPLOYEE = 0.015; // 1.5% of basic salary
const CSG_EMPLOYER = 0.03;  // 3% of basic salary
const NSF_EMPLOYEE = 0.01;  // 1% (max Rs 375/month)
const NSF_MAX = 375;
const FSC_RATE = 0.005; // 0.5% financial services
const NPF_EMPLOYEE = 0.03; // 3% NPF (private sector)
const NPF_EMPLOYER = 0.06; // 6% NPF employer

function calcPAYE(grossMonthly) {
  let tax = 0;
  let remaining = grossMonthly;
  let prevLimit = 0;
  for (const bracket of BRACKETS) {
    if (remaining <= 0) break;
    const bandSize = bracket.limit - prevLimit;
    const taxable = Math.min(remaining, bandSize);
    tax += taxable * bracket.rate;
    remaining -= taxable;
    prevLimit = bracket.limit;
  }
  return tax;
}

export default function PAYECalculator() {
  const [gross, setGross] = useState("");
  const [employeeType, setEmployeeType] = useState("private"); // private | public

  const grossNum = parseFloat(gross.replace(/,/g, "")) || 0;

  const paye = calcPAYE(grossNum);
  const csgEmployee = grossNum * CSG_EMPLOYEE;
  const csgEmployer = grossNum * CSG_EMPLOYER;
  const nsfEmployee = Math.min(grossNum * NSF_EMPLOYEE, NSF_MAX);
  const npfEmployee = employeeType === "private" ? grossNum * NPF_EMPLOYEE : 0;
  const npfEmployer = employeeType === "private" ? grossNum * NPF_EMPLOYER : 0;

  const totalDeductions = paye + csgEmployee + nsfEmployee + npfEmployee;
  const netPay = grossNum - totalDeductions;
  const totalEmployerCost = grossNum + csgEmployer + npfEmployer;

  const fmt = (n) => "Rs " + n.toLocaleString("en-MU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function reset() { setGross(""); setEmployeeType("private"); }

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>PAYE Calculator</span>
          </div>
          </Link>
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

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
          <span style={{ display: "block" }}>Mauritius PAYE</span>
          <span style={{ display: "block", color: CORAL }}>Calculator 2025/26</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
          Income tax, CSG, NSF and NPF based on MRA 2025/26 rates.
        </p>

        {/* Employee type */}
        <div style={{ background: "#f3f4f6", borderRadius: 12, padding: 4, display: "inline-flex", marginBottom: 24 }}>
          {[
            { value: "private", label: "Private sector" },
            { value: "public", label: "Public sector" },
          ].map(m => (
            <button
              key={m.value}
              onClick={() => setEmployeeType(m.value)}
              style={{
                padding: "8px 18px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none",
                background: employeeType === m.value ? "#fff" : "transparent",
                color: employeeType === m.value ? NAVY : "#9ca3af",
                boxShadow: employeeType === m.value ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >{m.label}</button>
          ))}
        </div>

        {/* Gross salary input */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
            Gross monthly salary (Rs)
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#6b7280" }}>Rs</span>
            <input
              type="number"
              value={gross}
              onChange={e => setGross(e.target.value)}
              placeholder="0"
              style={{ width: "100%", padding: "14px 14px 14px 44px", fontSize: 22, fontWeight: 700, border: "2px solid #e5e7eb", borderRadius: 12, outline: "none", color: NAVY, boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = CORAL)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
        </div>

        {grossNum > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Employee view */}
            <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ background: NAVY, padding: "14px 20px" }}>
                <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: "0.05em" }}>EMPLOYEE — MONTHLY PAYSLIP</p>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  { label: "Gross salary", value: fmt(grossNum), sub: "", highlight: false },
                  { label: "Income Tax (PAYE)", value: `- ${fmt(paye)}`, sub: `${grossNum <= 25000 ? "0%" : grossNum <= 83333 ? "15%" : "15–20%"} bracket`, highlight: false, color: CORAL },
                  { label: "CSG (employee 1.5%)", value: `- ${fmt(csgEmployee)}`, sub: "", highlight: false, color: CORAL },
                  { label: "NSF (employee 1%)", value: `- ${fmt(nsfEmployee)}`, sub: nsfEmployee === NSF_MAX ? "capped at Rs 375" : "", highlight: false, color: CORAL },
                  ...(employeeType === "private" ? [{ label: "NPF (employee 3%)", value: `- ${fmt(npfEmployee)}`, sub: "", highlight: false, color: CORAL }] : []),
                  { label: "Total deductions", value: `- ${fmt(totalDeductions)}`, sub: "", highlight: false, color: "#374151" },
                  { label: "NET PAY", value: fmt(netPay), sub: "", highlight: true },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <span style={{ fontSize: 14, color: "#6b7280" }}>{row.label}</span>
                      {row.sub && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{row.sub}</span>}
                    </div>
                    <span style={{ fontSize: row.highlight ? 22 : 16, fontWeight: row.highlight ? 800 : 600, color: row.color || (row.highlight ? NAVY : "#374151") }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Employer cost */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Employer total cost</h3>
              {[
                { label: "Gross salary", value: fmt(grossNum) },
                { label: "CSG (employer 3%)", value: fmt(csgEmployer) },
                ...(employeeType === "private" ? [{ label: "NPF (employer 6%)", value: fmt(npfEmployer) }] : []),
                { label: "Total employer cost", value: fmt(totalEmployerCost), bold: true },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f9fafb" }}>
                  <span style={{ fontSize: 13, color: "#6b7280" }}>{row.label}</span>
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.bold ? NAVY : "#374151" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, background: "#f9fafb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 13, color: "#6b7280" }}>
            Rates: Income tax 0%/15%/20% · CSG 1.5% employee, 3% employer · NSF 1% (max Rs 375) · NPF 3%/6% (private sector).{" "}
            Verify at{" "}
            <a href="https://www.mra.mu/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
              mra.mu <ExternalLink size={11} />
            </a>. 🇲🇺 Not professional tax advice.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
          <EmailCapture source="/paye" message="Get notified when PAYE brackets or CSG rates are updated." />
      </div>
      <footer className="bg-white border-t border-gray-200" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu · Not tax advice ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
