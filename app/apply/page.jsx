"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, RotateCcw, Copy, Check } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const SCHEMES = [
  { id: "tins", name: "TINS — Technology & Innovation Scheme", agency: "SME Mauritius", max: "Rs 150,000" },
  { id: "icds", name: "ICDS — Internal Capability Development Scheme", agency: "SME Mauritius", max: "Rs 200,000" },
  { id: "bts", name: "BTS — Business Transformation Scheme", agency: "SME Mauritius", max: "Rs 150,000" },
  { id: "marketing", name: "Marketing & Branding Scheme", agency: "SME Mauritius", max: "Rs 150,000" },
  { id: "green", name: "Green / Sustainability Scheme", agency: "SME Mauritius", max: "Rs 150,000" },
  { id: "crigs", name: "CRIGS — Collaborative R&D Innovation Grant", agency: "MRIC", max: "Rs 5,000,000" },
];

const STEPS = [
  { id: "scheme", label: "Select scheme" },
  { id: "business", label: "Your business" },
  { id: "project", label: "Your project" },
  { id: "generate", label: "Your letter" },
];

function hasKeyboardMash(value) {
  if (!value) return false;
  return value.split(/\s+/).some(w => w.length >= 4 && !/[aeiou]/i.test(w));
}

function validateBusiness(business) {
  const errors = {};
  if (!business.name?.trim()) {
    errors.name = "Business name is required.";
  } else if (hasKeyboardMash(business.name)) {
    errors.name = "This doesn't look like a valid business name.";
  }
  if (!business.ownerName?.trim()) {
    errors.ownerName = "Owner / Director name is required.";
  } else if (hasKeyboardMash(business.ownerName)) {
    errors.ownerName = "This doesn't look like a valid name.";
  }
  if (!business.sector?.trim()) {
    errors.sector = "Sector is required.";
  } else if (hasKeyboardMash(business.sector)) {
    errors.sector = "This doesn't look like a valid sector.";
  }
  return errors;
}

function validateProject(project) {
  const errors = {};
  if (!project.title?.trim()) {
    errors.title = "Project title is required.";
  } else if (hasKeyboardMash(project.title)) {
    errors.title = "This doesn't look like a valid project title.";
  }
  if (!project.objective?.trim()) {
    errors.objective = "Project objective is required.";
  } else if (hasKeyboardMash(project.objective)) {
    errors.objective = "This doesn't look like a valid objective.";
  }
  if (!project.activities?.trim()) {
    errors.activities = "Main activities / items are required.";
  } else if (hasKeyboardMash(project.activities)) {
    errors.activities = "This doesn't look like valid activities.";
  }
  if (!project.totalCost?.trim()) {
    errors.totalCost = "Total project cost is required.";
  } else if (!/Rs\s*[\d,]+/i.test(project.totalCost)) {
    errors.totalCost = "Cost must include Rs and a number (e.g. Rs 180,000).";
  }
  return errors;
}

function generateLetter({ scheme, business, project }) {
  const today = new Date().toLocaleDateString("en-MU", { day: "numeric", month: "long", year: "numeric" });
  const s = SCHEMES.find(s => s.id === scheme);
  return `${today}

The Scheme Manager
${s.agency}
Mauritius

Dear Sir/Madam,

RE: APPLICATION FOR ${s.name.toUpperCase()} — ${business.name.toUpperCase()}

I am writing on behalf of ${business.name}, a registered Mauritian SME (BRN: ${business.brn || "[BRN]"}), to apply for the ${s.name} offered by ${s.agency}.

ABOUT OUR BUSINESS

${business.name} is a ${business.sector} business based in ${business.location || "Mauritius"}, established in ${business.year || "[year]"}. We currently employ ${business.employees || "[number]"} staff and serve ${business.customers || "Mauritian"} customers. Our annual turnover is approximately ${business.turnover || "[Rs X]"}.

${business.description || "[Describe your business, what you do, and why you started it.]"}

OUR PROJECT

We propose to implement the following project: ${project.title || "[Project title]"}.

Project objective: ${project.objective || "[What will this project achieve for your business?]"}

The project involves: ${project.activities || "[Describe the main activities, equipment, or services you will purchase or implement.]"}

Expected outcomes:
- ${project.outcome1 || "Increased operational efficiency"}
- ${project.outcome2 || "Improved customer service quality"}
- ${project.outcome3 || "Revenue growth and job creation"}

Total project cost: ${project.totalCost || "[Rs X]"}
Grant amount requested (80%): ${project.grantAmount || "[Rs X]"}
Our contribution (20%): ${project.ownContribution || "[Rs X]"}

WHY THIS GRANT FITS

This project directly aligns with the objectives of the ${s.name}. ${project.alignment || "The investment will allow us to modernise our operations, improve our competitiveness, and contribute to the growth of the Mauritian economy."}

We have obtained ${project.quotes || "three"} competitive quotes from qualified suppliers, which are attached to this application.

COMMITMENT

${business.name} commits to:
- Implementing the project within the agreed timeframe
- Maintaining documentation of all expenditures
- Submitting progress and completion reports as required
- Not duplicating this grant with other public funding for the same cost items

We confirm that we are current on all MRA tax filings and have no outstanding arrears.

We would welcome the opportunity to discuss this application further. Please do not hesitate to contact us.

Yours faithfully,

${business.ownerName || "[Your full name]"}
${business.ownerTitle || "Director / Managing Director"}
${business.name}
Tel: ${business.phone || "[phone]"}
Email: ${business.email || "[email]"}
BRN: ${business.brn || "[BRN]"}

Attachments:
1. BRN Certificate
2. Trade Licence
3. MRA Tax Clearance Certificate
4. Bank Statements (last 3 months)
5. Vendor quotes (${project.quotes || "3"} quotes)
6. Project description and budget breakdown`;
}

// MOVED OUTSIDE: Field component to prevent re-renders
function Field({ fieldKey, label, placeholder, value, onChange, textarea, error, inputStyle }) {
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 };
  const errorStyle = { fontSize: 12, color: "#ef4444", marginBottom: 10 };
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
          placeholder={placeholder}
          value={value || ""}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      ) : (
        <input
          type="text"
          style={inputStyle}
          placeholder={placeholder}
          value={value || ""}
          onChange={e => onChange(fieldKey, e.target.value)}
        />
      )}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

export default function GrantApply() {
  const [step, setStep] = useState(0);
  const [scheme, setScheme] = useState("");
  const [business, setBusiness] = useState({});
  const [project, setProject] = useState({});
  const [letter, setLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState({});

  function handleNextToBusiness() {
    const errs = validateBusiness(business);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep(2);
  }

  function handleGenerate() {
    const errs = validateProject(project);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLetter(generateLetter({ scheme, business, project }));
    setStep(3);
  }

  function copy() {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setStep(0);
    setScheme("");
    setBusiness({});
    setProject({});
    setLetter("");
    setErrors({});
  }

  const updateBusiness = (k, v) => {
    setBusiness(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };
  const updateProject = (k, v) => {
    setProject(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const getInputStyle = (key) => ({
    width: "100%", padding: "11px 14px", fontSize: 14,
    border: `1.5px solid ${errors[key] ? "#ef4444" : "#e5e7eb"}`,
    borderRadius: 10, outline: "none", color: NAVY, boxSizing: "border-box",
    marginBottom: errors[key] ? 4 : 14,
  });

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Grant Application Generator</span>
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

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? CORAL : "#e5e7eb" }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 6 }}>Select a grant scheme</h1>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 24 }}>We'll generate a professional application letter tailored to the scheme.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SCHEMES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setScheme(s.id); setStep(1); }}
                  style={{ textAlign: "left", padding: "16px 18px", borderRadius: 12, border: `2px solid ${scheme === s.id ? CORAL : "#e5e7eb"}`, background: "#fff", cursor: "pointer" }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = CORAL)}
                  onMouseOut={e => (e.currentTarget.style.borderColor = scheme === s.id ? CORAL : "#e5e7eb")}
                >
                  <div style={{ fontWeight: 700, color: NAVY }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{s.agency} · Max {s.max}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 6 }}>About your business</h1>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 24 }}>Fill in what you can — you can edit the letter afterwards.</p>
            {[
              { key: "name", label: "Business name *", placeholder: "e.g. Sunshine Bakery Ltd" },
              { key: "brn", label: "BRN number", placeholder: "e.g. C12345678" },
              { key: "ownerName", label: "Owner / Director name *", placeholder: "e.g. Priya Ramnarain" },
              { key: "ownerTitle", label: "Title", placeholder: "e.g. Managing Director" },
              { key: "sector", label: "Sector *", placeholder: "e.g. Food & Beverage, ICT, Retail" },
              { key: "location", label: "Location", placeholder: "e.g. Curepipe" },
              { key: "year", label: "Year established", placeholder: "e.g. 2019" },
              { key: "employees", label: "Number of employees", placeholder: "e.g. 8" },
              { key: "turnover", label: "Annual turnover (approx)", placeholder: "e.g. Rs 3.5 million" },
              { key: "phone", label: "Phone", placeholder: "e.g. +230 5XXX XXXX" },
              { key: "email", label: "Email", placeholder: "e.g. contact@yourbusiness.mu" },
            ].map(f => (
              <Field 
                key={f.key} 
                fieldKey={f.key} 
                label={f.label} 
                placeholder={f.placeholder} 
                value={business[f.key]} 
                onChange={updateBusiness}
                error={errors[f.key]}
                inputStyle={getInputStyle(f.key)}
              />
            ))}
            <Field 
              fieldKey="description" 
              label="Brief business description" 
              placeholder="What does your business do? Who are your customers?" 
              value={business.description} 
              onChange={updateBusiness}
              textarea
              error={errors.description}
              inputStyle={getInputStyle("description")}
            />
            <button onClick={handleNextToBusiness} style={{ width: "100%", padding: "14px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 8 }}>
              Next: Project details →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, marginBottom: 6 }}>About your project</h1>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 24 }}>Describe what you want the grant to fund.</p>
            {[
              { key: "title", label: "Project title *", placeholder: "e.g. E-commerce platform and POS system upgrade" },
              { key: "objective", label: "Project objective *", placeholder: "e.g. To digitise our sales and inventory management" },
              { key: "activities", label: "Main activities / items *", placeholder: "e.g. Purchase of Shopify subscription, POS hardware, staff training" },
              { key: "totalCost", label: "Total project cost *", placeholder: "e.g. Rs 180,000" },
              { key: "grantAmount", label: "Grant amount requested (80%)", placeholder: "e.g. Rs 144,000" },
              { key: "ownContribution", label: "Your contribution (20%)", placeholder: "e.g. Rs 36,000" },
              { key: "quotes", label: "Number of vendor quotes", placeholder: "e.g. 3" },
            ].map(f => (
              <Field 
                key={f.key} 
                fieldKey={f.key} 
                label={f.label} 
                placeholder={f.placeholder} 
                value={project[f.key]} 
                onChange={updateProject}
                error={errors[f.key]}
                inputStyle={getInputStyle(f.key)}
              />
            ))}
            <Field 
              fieldKey="outcome1" 
              label="Expected outcome 1" 
              placeholder="e.g. 30% increase in online sales" 
              value={project.outcome1} 
              onChange={updateProject}
              error={errors.outcome1}
              inputStyle={getInputStyle("outcome1")}
            />
            <Field 
              fieldKey="outcome2" 
              label="Expected outcome 2" 
              placeholder="e.g. 10 hours/week saved on inventory management" 
              value={project.outcome2} 
              onChange={updateProject}
              error={errors.outcome2}
              inputStyle={getInputStyle("outcome2")}
            />
            <Field 
              fieldKey="outcome3" 
              label="Expected outcome 3" 
              placeholder="e.g. Creation of 2 new jobs within 12 months" 
              value={project.outcome3} 
              onChange={updateProject}
              error={errors.outcome3}
              inputStyle={getInputStyle("outcome3")}
            />

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setErrors({}); setStep(1); }} style={{ flex: 1, padding: "14px", background: "#fff", color: NAVY, border: "2px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                ← Back
              </button>
              <button onClick={handleGenerate} style={{ flex: 2, padding: "14px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Generate letter →
              </button>
            </div>
          </>
        )}

        {step === 3 && letter && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>Your application letter</h1>
              <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: copied ? GREEN : CORAL, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy letter</>}
              </button>
            </div>
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "24px", fontFamily: "Georgia, serif", fontSize: 14, lineHeight: 1.8, color: NAVY, whiteSpace: "pre-wrap", marginBottom: 20 }}>
              {letter}
            </div>
            <div style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#92400e" }}>
                ⚠️ <strong>Review before sending.</strong> This is a starting draft — personalise it, verify all figures, and have it reviewed by an accountant or business advisor before submission. Attach all required documents.
              </p>
            </div>
            <button onClick={reset} style={{ fontSize: 14, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Start over with a new application
            </button>
          </>
        )}
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
        <EmailCapture source="/apply" message="Get alerts when grant application windows open." />
      </div>
      <footer className="bg-white border-t border-gray-200" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu · Not legal advice ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
