"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, RotateCcw, ExternalLink, AlertCircle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

// MRA 2025-26 PAYE TAX BRACKETS (Monthly) — effective 1 July 2025
const PAYE_BRACKETS = [
  { limit: 38462, rate: 0 },        // 0% exempt threshold
  { limit: 83333, rate: 0.15 },     // 15%
  { limit: Infinity, rate: 0.20 },  // 20%
];

// Social contributions 2025/26
const CSG_EMPLOYEE = 0.01;   // CSG Levy 1% on basic
const CSG_EMPLOYER = 0.015;  // CSG Employer 1.5% on basic
const NSF_EMPLOYEE = 0.01;   // NSF 1% on basic (capped at ceiling)
const NSF_EMPLOYER = 0.025;  // NSF Employer 2.5% on basic (capped)
const TRAINING_LEVY = 0.015; // Training Levy 1.5% employer on basic

// Allowance exemptions per MRA
const TRAVELLING_EXEMPT_PCT = 0.25; // 25% of basic
const TRAVELLING_EXEMPT_MAX = 20000; // max Rs 20,000
const TELECOMMUTING_EXEMPT = 1500;  // Fully exempt if provided
const MEAL_EXEMPT = 1500;           // Meal allowance exempt

function calcPAYE(taxable) {
  if (taxable <= 0) return 0;
  let tax = 0;
  let remaining = taxable;
  let prevLimit = 0;
  for (const bracket of PAYE_BRACKETS) {
    if (remaining <= 0) break;
    const bandSize = bracket.limit - prevLimit;
    const taxable_in_band = Math.min(remaining, bandSize);
    tax += taxable_in_band * bracket.rate;
    remaining -= taxable_in_band;
    prevLimit = bracket.limit;
  }
  return tax;
}

function WarningBox({ title, children }) {
  return (
    <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 10, padding: 12, marginBottom: 14, display: "flex", gap: 10 }}>
      <AlertCircle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#92400e", margin: "0 0 4px 0" }}>{title}</p>
        <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>{children}</p>
      </div>
    </div>
  );
}

function InfoTooltip({ label, info }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button 
        onClick={() => setShow(!show)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: CORAL, fontSize: 12, textDecoration: "underline" }}
      >
        {label} <HelpCircle size={12} style={{ display: "inline-block", marginLeft: 2 }} />
      </button>
      {show && (
        <div style={{ position: "absolute", top: 24, left: 0, background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, padding: 10, fontSize: 12, color: "#374151", maxWidth: 250, zIndex: 10, lineHeight: 1.5 }}>
          {info}
        </div>
      )}
    </div>
  );
}

export default function PAYECalculator() {
  const [basic, setBasic] = useState("");
  const [travelling, setTravelling] = useState("");
  const [telecommuting, setTelecommuting] = useState("");
  const [other, setOther] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const basicNum = parseFloat(basic.replace(/,/g, "")) || 0;
  const travellingNum = parseFloat(travelling.replace(/,/g, "")) || 0;
  const telecommutingNum = parseFloat(telecommuting.replace(/,/g, "")) || 0;
  const otherNum = parseFloat(other.replace(/,/g, "")) || 0;

  const grossMonthly = basicNum + travellingNum + telecommutingNum + otherNum;

  // Apply travelling allowance exemption: 25% of basic, capped at Rs 20,000
  const travellingExemptAmount = Math.min(basicNum * TRAVELLING_EXEMPT_PCT, TRAVELLING_EXEMPT_MAX);
  const travellingTaxable = Math.max(travellingNum - travellingExemptAmount, 0);

  // Telecommuting fully exempt per MRA rules
  const telecommutingTaxable = 0;

  // Other allowances (taxable unless specified as exempt)
  const otherTaxable = otherNum;

  // Taxable income for PAYE
  const taxableForPAYE = basicNum + travellingTaxable + telecommutingTaxable + otherTaxable;

  // PAYE
  const paye = calcPAYE(taxableForPAYE);

  // CSG on basic only
  const csgEmployee = basicNum * CSG_EMPLOYEE;
  const csgEmployer = basicNum * CSG_EMPLOYER;

  // NSF on basic only
  const nsfEmployee = basicNum * NSF_EMPLOYEE;
  const nsfEmployer = basicNum * NSF_EMPLOYER;

  // Training Levy
  const trainingLevy = basicNum * TRAINING_LEVY;

  const totalDeductions = paye + csgEmployee + nsfEmployee;
  const netPay = grossMonthly - totalDeductions;
  const totalEmployerCost = grossMonthly + csgEmployer + nsfEmployer + trainingLevy;

  const fmt = (n) => "Rs " + n.toLocaleString("en-MU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function reset() {
    setBasic("");
    setTravelling("");
    setTelecommuting("");
    setOther("");
  }

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
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 24 }}>
          Based on MRA rules. <strong>See disclaimers below</strong> — your actual payslip may differ due to cumulative PAYE, EDF reliefs, or pension caps.
        </p>

        {/* Critical disclaimer */}
        <WarningBox title="⚠️ Important: This is an estimate">
          This calculator shows <strong>simple monthly PAYE</strong> based on current year MRA brackets. Your employer may use <strong>cumulative PAYE</strong> (year-to-date) and apply your EDF relief amounts, which can significantly change your actual tax. NSF contributions may also be capped by your pension scheme. <strong>Always verify with your payroll team.</strong>
        </WarningBox>

        {/* Input section */}
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 16 }}>Monthly salary components</label>

          {[
            { key: "basic", label: "Basic salary *", placeholder: "e.g. 50000", info: "Your base monthly salary on which CSG, NSF, and Training Levy are calculated." },
            { key: "travelling", label: "Travelling vehicle owners allowance", placeholder: "e.g. 27000", info: "Exempt up to 25% of basic salary or Rs 20,000 (whichever is less). Excess is taxable for PAYE." },
            { key: "telecommuting", label: "Telecommuting allowance", placeholder: "e.g. 1500", info: "Fully exempt from PAYE per MRA rules for remote work allowances." },
            { key: "other", label: "Other allowances (housing, etc.)", placeholder: "e.g. 5000", info: "Housing and other allowances are generally taxable. Specify if you have specific exemptions." },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{f.label}</label>
                <InfoTooltip label="?" info={f.info} />
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Rs</span>
                <input
                  type="number"
                  value={f.key === "basic" ? basic : f.key === "travelling" ? travelling : f.key === "telecommuting" ? telecommuting : other}
                  onChange={e => {
                    if (f.key === "basic") setBasic(e.target.value);
                    else if (f.key === "travelling") setTravelling(e.target.value);
                    else if (f.key === "telecommuting") setTelecommuting(e.target.value);
                    else setOther(e.target.value);
                  }}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px 10px 44px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, outline: "none", color: NAVY, boxSizing: "border-box" }}
                  onFocus={e => (e.target.style.borderColor = CORAL)}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>
          ))}
        </div>

        {grossMonthly > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Employee payslip */}
            <div style={{ background: "#fff", border: "2px solid #e5e7eb", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ background: NAVY, padding: "14px 20px" }}>
                <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: "0.05em" }}>EMPLOYEE — ESTIMATED MONTHLY PAYSLIP</p>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  { label: "Basic salary", value: fmt(basicNum), sub: "", bold: false },
                  { label: "Travelling allowance", value: fmt(travellingNum), sub: `(${fmt(travellingExemptAmount)} exempt, ${fmt(travellingTaxable)} taxable)`, bold: false },
                  { label: "Telecommuting allowance", value: fmt(telecommutingNum), sub: "(fully exempt)", bold: false },
                  { label: "Other allowances", value: fmt(otherNum), sub: "", bold: false },
                  { label: "GROSS MONTHLY", value: fmt(grossMonthly), sub: "", bold: true, line: true },
                  { label: "Income Tax (PAYE)", value: `- ${fmt(paye)}`, sub: `on Rs ${fmt(taxableForPAYE)} taxable (simple monthly)`, bold: false, color: CORAL, warning: true },
                  { label: "CSG Levy (1%)", value: `- ${fmt(csgEmployee)}`, sub: "on basic only", bold: false, color: CORAL },
                  { label: "NSF (1%)", value: `- ${fmt(nsfEmployee)}`, sub: "on basic only (may be capped)", bold: false, color: CORAL, warning: true },
                  { label: "Total deductions", value: `- ${fmt(totalDeductions)}`, sub: "", bold: false },
                  { label: "NET PAY (ESTIMATE)", value: fmt(netPay), sub: "", bold: true, highlight: true, warning: true },
                ].map((row, i) => (
                  <div key={i} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start", 
                    padding: "10px 0", 
                    borderBottom: row.line ? `2px solid ${CORAL}` : "1px solid #f3f4f6",
                    marginBottom: row.line ? 8 : 0,
                  }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: row.bold ? 15 : 14, fontWeight: row.bold ? 700 : 500, color: "#374151" }}>
                        {row.label}
                        {row.warning && <span style={{ color: "#dc2626", marginLeft: 4, fontSize: 10, fontWeight: 700 }}>*</span>}
                      </span>
                      {row.sub && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8, display: "block", marginTop: 2 }}>{row.sub}</span>}
                    </div>
                    <span style={{ fontSize: row.highlight ? 22 : row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 600, color: row.color || (row.highlight ? NAVY : "#374151"), flexShrink: 0, marginLeft: 12 }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimers on variables */}
            <div style={{ background: "#efe6ff", border: "1px solid #ddd6fe", borderRadius: 12, padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#6b21a8", margin: "0 0 8px 0" }}>⚠️ Fields marked * are estimates only:</p>
              <ul style={{ fontSize: 12, color: "#6b21a8", margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li><strong>PAYE:</strong> Uses simple monthly calculation. Your employer may use cumulative PAYE (year-to-date) and apply EDF relief amounts, which will change your actual tax significantly.</li>
                <li><strong>NSF:</strong> May be capped by your pension scheme ceiling. Your actual contribution could be different.</li>
                <li><strong>Net Pay:</strong> This is an estimate. Always compare with your actual payslip.</li>
              </ul>
            </div>

            {/* Employer cost */}
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "18px 20px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Employer total cost</h3>
              {[
                { label: "Gross pay to employee", value: fmt(grossMonthly) },
                { label: "CSG Levy — Employer (1.5%)", value: fmt(csgEmployer), sub: "on basic" },
                { label: "NSF — Employer (2.5%)", value: fmt(nsfEmployer), sub: "on basic (capped)" },
                { label: "Training Levy (1.5%)", value: fmt(trainingLevy), sub: "on basic" },
                { label: "TOTAL EMPLOYER COST", value: fmt(totalEmployerCost), bold: true, highlight: true },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: row.bold ? "1px solid #e5e7eb" : "none" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 500, color: "#6b7280" }}>{row.label}</span>
                    {row.sub && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{row.sub}</span>}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.highlight ? NAVY : "#374151" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Rules & disclaimers */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: CORAL, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAdvanced ? "Hide" : "Show"} MRA rules & calculation details
            </button>

            {showAdvanced && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>MRA Rules Applied</h4>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>
                  <p><strong>✓ Travelling Allowance Exemption:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Lesser of: (a) actual amount paid, or (b) 25% of basic salary (max Rs 20,000). Amount: {fmt(travellingExemptAmount)} exempted.
                  </p>

                  <p style={{ marginTop: 12 }}><strong>✓ Telecommuting Allowance:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Fully exempt per MRA rules for remote work. No tax applied to {fmt(telecommutingNum)}.
                  </p>

                  <p style={{ marginTop: 12 }}><strong>✓ PAYE Calculation (Simple Monthly):</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Taxable income: {fmt(taxableForPAYE)}<br/>
                    {taxableForPAYE <= 38462 ? `Fully exempt (below Rs 38,462 threshold)` :
                     taxableForPAYE <= 83333 ? `15% on Rs ${(taxableForPAYE - 38462).toLocaleString()} = ${fmt((taxableForPAYE - 38462) * 0.15)}` :
                     `15% on Rs ${(83333 - 38462).toLocaleString()} + 20% on Rs ${(taxableForPAYE - 83333).toLocaleString()} = ${fmt(paye)}`
                    }
                  </p>

                  <p style={{ marginTop: 12 }}><strong>⚠️ Important Note on PAYE:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12, color: "#dc2626" }}>
                    MRA requires <strong>cumulative PAYE</strong> calculation (year-to-date from July each year), not simple monthly. This calculator shows simple monthly for educational purposes only. Your actual PAYE depends on your EDF relief amounts (dependents, disabilities, mortgage, pension contributions, etc.) which are applied cumulatively.
                  </p>

                  <p style={{ marginTop: 12 }}><strong>✓ CSG Levy (1% employee, 1.5% employer):</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Applied on basic salary only. {fmt(csgEmployee)} deducted from employee, {fmt(csgEmployer)} paid by employer.
                  </p>

                  <p style={{ marginTop: 12 }}><strong>✓ NSF (1% employee, 2.5% employer):</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Applied on basic salary only, within insurable ceiling (Rs 5,250 – Rs 69,200 as of July 2025). {fmt(nsfEmployee)} deducted from employee. <strong>Note:</strong> May be capped if you're in a private pension scheme.
                  </p>

                  <p style={{ marginTop: 12 }}><strong>✓ Training Levy (1.5% employer only):</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Applied on basic salary. {fmt(trainingLevy)} paid by employer, not deducted from employee.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, background: "#f9fafb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
            <strong>MRA Compliance:</strong> Based on <a href="https://www.mra.mu/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline" }}>mra.mu</a> rules effective 1 July 2025. <strong>This is not a substitute for professional payroll advice.</strong> Always verify with your employer's payroll team — they may have pension schemes, relief amounts, or cumulative calculations that differ from this estimate. 🇲🇺
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
        <EmailCapture source="/paye" message="Get notified when PAYE brackets or contribution rates change." />
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
