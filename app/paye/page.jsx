"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, RotateCcw, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

// MRA 2025-26 PAYE TAX BRACKETS (Monthly) — effective 1 July 2025
const PAYE_BRACKETS = [
  { limit: 38462, rate: 0 },        // 0% up to Rs 38,462/month (exempt threshold)
  { limit: 83333, rate: 0.15 },     // 15% from Rs 38,463 to Rs 83,333
  { limit: Infinity, rate: 0.20 },  // 20% above Rs 83,333
];

// Social contributions 2025/26
const CSG_EMPLOYEE = 0.01;  // CSG/NCS Employee 1% (levy on basic salary)
const CSG_EMPLOYER = 0.015; // CSG/NCS Employer 1.5% (levy on basic salary)
const NSF_EMPLOYEE = 0.01;  // NSF Employee 1% on basic salary
const NSF_EMPLOYER = 0.025; // NSF Employer 2.5% on basic salary
const TRAINING_LEVY = 0.015; // Training Levy 1.5% employer on basic salary

// NSF min/max ceilings 2025/26
const NSF_MIN = 5250;   // Minimum insurable salary
const NSF_MAX = 69200;  // Maximum insurable salary (as of July 2025)

// Allowance exemptions
const TRANSPORT_EXEMPT = 3000;  // Transport allowance exempt
const MEAL_EXEMPT = 1500;       // Meal allowance exempt

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

function capNSF(basic, amount) {
  // NSF contributions are capped at the ceiling
  const cappedBasic = Math.min(Math.max(basic, NSF_MIN), NSF_MAX);
  return cappedBasic * amount;
}

export default function PAYECalculator() {
  const [basic, setBasic] = useState("");
  const [transport, setTransport] = useState("");
  const [meals, setMeals] = useState("");
  const [housing, setHousing] = useState("");
  const [employeeType, setEmployeeType] = useState("private");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const basicNum = parseFloat(basic.replace(/,/g, "")) || 0;
  const transportNum = parseFloat(transport.replace(/,/g, "")) || 0;
  const mealsNum = parseFloat(meals.replace(/,/g, "")) || 0;
  const housingNum = parseFloat(housing.replace(/,/g, "")) || 0;

  // Gross = all components
  const grossMonthly = basicNum + transportNum + mealsNum + housingNum;

  // Exempt allowances
  const transportExempt = Math.min(transportNum, TRANSPORT_EXEMPT);
  const mealExempt = Math.min(mealsNum, MEAL_EXEMPT);
  const transportTaxable = Math.max(transportNum - TRANSPORT_EXEMPT, 0);
  const mealTaxable = Math.max(mealsNum - MEAL_EXEMPT, 0);

  // Taxable income for PAYE
  const taxableForPAYE = basicNum + transportTaxable + mealTaxable + housingNum;

  // PAYE calculation
  const paye = calcPAYE(taxableForPAYE);

  // CSG/NCS (1% employee on basic only)
  const csgEmployee = basicNum * CSG_EMPLOYEE;
  const csgEmployer = basicNum * CSG_EMPLOYER;

  // NSF (1% employee, 2.5% employer on basic, capped)
  const nsfEmployee = capNSF(basicNum, NSF_EMPLOYEE);
  const nsfEmployer = capNSF(basicNum, NSF_EMPLOYER);

  // Training Levy (employer only)
  const trainingLevy = basicNum * TRAINING_LEVY;

  // Total deductions for employee
  const totalDeductions = paye + csgEmployee + nsfEmployee;
  const netPay = grossMonthly - totalDeductions;

  // Total employer cost
  const totalEmployerCost = grossMonthly + csgEmployer + nsfEmployer + trainingLevy;

  const fmt = (n) => "Rs " + n.toLocaleString("en-MU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function reset() {
    setBasic("");
    setTransport("");
    setMeals("");
    setHousing("");
    setEmployeeType("private");
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
          Accurate PAYE, CSG, NSF with allowance exemptions. MRA compliant.
        </p>

        {/* Input section */}
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 16 }}>Monthly Salary Components</label>

          {[
            { key: "basic", label: "Basic salary *", placeholder: "e.g. 50000" },
            { key: "transport", label: "Transport allowance (exempt up to Rs 3,000)", placeholder: "e.g. 2500" },
            { key: "meals", label: "Meal allowance (exempt up to Rs 1,500)", placeholder: "e.g. 1200" },
            { key: "housing", label: "Housing / Other allowances", placeholder: "e.g. 5000" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{f.label}</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontWeight: 600, color: "#9ca3af", fontSize: 14 }}>Rs</span>
                <input
                  type="number"
                  value={f.key === "basic" ? basic : f.key === "transport" ? transport : f.key === "meals" ? meals : housing}
                  onChange={e => {
                    if (f.key === "basic") setBasic(e.target.value);
                    else if (f.key === "transport") setTransport(e.target.value);
                    else if (f.key === "meals") setMeals(e.target.value);
                    else setHousing(e.target.value);
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
                <p style={{ color: "#9ca3af", fontSize: 12, margin: 0, fontWeight: 600, letterSpacing: "0.05em" }}>EMPLOYEE — MONTHLY PAYSLIP</p>
              </div>
              <div style={{ padding: "20px" }}>
                {[
                  { label: "Basic salary", value: fmt(basicNum), sub: "", bold: false },
                  { label: "Transport allowance", value: fmt(transportNum), sub: `(${fmt(transportExempt)} exempt)`, bold: false },
                  { label: "Meal allowance", value: fmt(mealsNum), sub: `(${fmt(mealExempt)} exempt)`, bold: false },
                  { label: "Housing / Other", value: fmt(housingNum), sub: "", bold: false },
                  { label: "GROSS MONTHLY", value: fmt(grossMonthly), sub: "", bold: true, line: true },
                  { label: "Income Tax (PAYE)", value: `- ${fmt(paye)}`, sub: `on Rs ${fmt(taxableForPAYE)} taxable`, bold: false, color: CORAL },
                  { label: "CSG Levy (1%)", value: `- ${fmt(csgEmployee)}`, sub: "on basic only", bold: false, color: CORAL },
                  { label: "NSF (1%)", value: `- ${fmt(nsfEmployee)}`, sub: `on basic, capped at Rs ${NSF_MAX.toLocaleString()}`, bold: false, color: CORAL },
                  { label: "Total deductions", value: `- ${fmt(totalDeductions)}`, sub: "", bold: false },
                  { label: "NET PAY", value: fmt(netPay), sub: "", bold: true, highlight: true },
                ].map((row, i) => (
                  <div key={i} style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "10px 0", 
                    borderBottom: row.line ? `2px solid ${CORAL}` : "1px solid #f3f4f6",
                    marginBottom: row.line ? 8 : 0,
                  }}>
                    <div>
                      <span style={{ fontSize: row.bold ? 15 : 14, fontWeight: row.bold ? 700 : 500, color: "#374151" }}>{row.label}</span>
                      {row.sub && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 8 }}>{row.sub}</span>}
                    </div>
                    <span style={{ fontSize: row.highlight ? 22 : row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 600, color: row.color || (row.highlight ? NAVY : "#374151") }}>
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
                { label: "Basic salary", value: fmt(basicNum) },
                { label: "Transport allowance", value: fmt(transportNum) },
                { label: "Meal allowance", value: fmt(mealsNum) },
                { label: "Housing / Other", value: fmt(housingNum) },
                { label: "Subtotal (employee receives)", value: fmt(grossMonthly), bold: true },
                { label: "CSG Levy — Employer (1.5%)", value: fmt(csgEmployer), sub: "on basic" },
                { label: "NSF — Employer (2.5%)", value: fmt(nsfEmployer), sub: `on basic, capped` },
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

            {/* Breakdown toggle */}
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: CORAL, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAdvanced ? "Hide" : "Show"} calculation breakdown
            </button>

            {showAdvanced && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Calculation details</h4>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.8 }}>
                  <p><strong>Taxable income for PAYE:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Basic ({fmt(basicNum)}) + Taxable transport ({fmt(transportTaxable)}) + Taxable meals ({fmt(mealTaxable)}) + Housing ({fmt(housingNum)}) = {fmt(taxableForPAYE)}
                  </p>
                  <p style={{ marginTop: 8 }}><strong>Tax brackets applied:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    {taxableForPAYE <= 38462 ? `Rs 0 (below exemption threshold of Rs 38,462)` :
                     taxableForPAYE <= 83333 ? `15% on Rs ${(taxableForPAYE - 38462).toLocaleString()} = Rs ${((taxableForPAYE - 38462) * 0.15).toLocaleString("en-MU", {maximumFractionDigits: 2})}` :
                     `15% on Rs ${(83333 - 38462).toLocaleString()} + 20% on Rs ${(taxableForPAYE - 83333).toLocaleString()} = Rs ${paye.toLocaleString("en-MU", {maximumFractionDigits: 2})}`
                    }
                  </p>
                  <p style={{ marginTop: 8 }}><strong>Allowance exemptions:</strong></p>
                  <p style={{ marginLeft: 12, fontSize: 12 }}>
                    Transport: Rs {transportNum.toLocaleString()} provided, Rs {TRANSPORT_EXEMPT.toLocaleString()} exempt, Rs {transportTaxable.toLocaleString()} taxable<br/>
                    Meals: Rs {mealsNum.toLocaleString()} provided, Rs {MEAL_EXEMPT.toLocaleString()} exempt, Rs {mealTaxable.toLocaleString()} taxable
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 24, background: "#f9fafb", borderRadius: 12, padding: "14px 18px" }}>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
            <strong>2025/26 Rates:</strong> PAYE 0%/15%/20% · CSG Levy 1% employee / 1.5% employer · NSF 1%/2.5% (capped) · Training Levy 1.5% employer · Transport exempt up to Rs 3,000 · Meals exempt up to Rs 1,500.{" "}
            <a href="https://www.mra.mu/" target="_blank" rel="noopener noreferrer" style={{ color: CORAL, textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 2 }}>
              Verify at mra.mu <ExternalLink size={11} />
            </a>. 🇲🇺 Not professional tax advice.
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
