"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const STEPS = [
  { id: "business", label: "Your business", icon: "🏢" },
  { id: "market", label: "Market & customers", icon: "🎯" },
  { id: "operations", label: "Operations", icon: "⚙️" },
  { id: "financials", label: "Financials", icon: "💰" },
  { id: "plan", label: "Your plan", icon: "📋" },
];

const SECTORS = [
  "Retail & Commerce",
  "Food & Beverage",
  "ICT & Digital Services",
  "Tourism & Hospitality",
  "Manufacturing",
  "Professional Services",
  "Health & Wellness",
  "Education & Training",
  "Real Estate",
  "Export-Oriented",
  "Green/Sustainability",
  "Other",
];

async function generatePlan(formData) {
  const response = await fetch("/api/business/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to generate plan");
  return data.plan;
}

function parseSections(planText) {
  const parts = planText.split(/(?:^|\n)## /);
  return parts
    .filter((p) => p.trim())
    .map((part) => {
      const firstNewline = part.indexOf("\n");
      const title = (firstNewline === -1 ? part : part.substring(0, firstNewline)).trim();
      const content = firstNewline === -1 ? "" : part.substring(firstNewline + 1).trim();
      return { title, content };
    })
    .filter((s) => s.content.length >= 20);
}

function buildDocxParagraphs(markdown, { Paragraph, TextRun, HeadingLevel }) {
  function parseInline(text) {
    const runs = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        runs.push(new TextRun({ text: text.slice(lastIndex, match.index) }));
      }
      const inner = match[0];
      if (inner.startsWith("**")) {
        runs.push(new TextRun({ text: inner.slice(2, -2), bold: true }));
      } else {
        runs.push(new TextRun({ text: inner.slice(1, -1), italics: true }));
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      runs.push(new TextRun({ text: text.slice(lastIndex) }));
    }
    return runs.length > 0 ? runs : [new TextRun({ text: "" })];
  }

  const lines = markdown.split("\n");
  const paragraphs = [];

  for (const line of lines) {
    if (!line.trim()) {
      paragraphs.push(new Paragraph({ text: "" }));
      continue;
    }
    if (line.startsWith("### ")) {
      paragraphs.push(new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 }));
      continue;
    }
    if (line.startsWith("#### ")) {
      paragraphs.push(new Paragraph({ text: line.slice(5), heading: HeadingLevel.HEADING_4 }));
      continue;
    }
    if (/^[-*] /.test(line)) {
      paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: parseInline(line.slice(2)) }));
      continue;
    }
    paragraphs.push(new Paragraph({ children: parseInline(line) }));
  }

  return paragraphs;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadSectionAsDocx(section, businessName) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, HeadingLevel } = docx;
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
        ...buildDocxParagraphs(section.content, docx),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${businessName.replace(/\s+/g, "_")}_${section.title.replace(/\s+/g, "_")}.docx`);
}

async function downloadFullPlanAsDocx(sections, businessName) {
  const docx = await import("docx");
  const { Document, Packer, Paragraph, HeadingLevel } = docx;
  const children = [];
  for (const section of sections) {
    children.push(
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_1 }),
      ...buildDocxParagraphs(section.content, docx),
      new Paragraph({ text: "" }),
    );
  }
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${businessName.replace(/\s+/g, "_")}_Business_Plan.docx`);
}

export default function BusinessPlanGenerator() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    owner: "",
    sector: "",
    location: "",
    description: "",
    targetCustomers: "",
    competitors: "",
    customerAcquisition: "",
    employees: "",
    suppliers: "",
    challenges: "",
    startupCost: "",
    year1Revenue: "",
    fundingNeeded: false,
    fundingAmount: "",
    exportPlans: false,
    exportDetails: "",
  });
  const [plan, setPlan] = useState("");
  const [sections, setSections] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [downloadingFull, setDownloadingFull] = useState(false);
  const [downloadingBank, setDownloadingBank] = useState(false);
  const [error, setError] = useState("");

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleGenerate = async () => {
    if (!form.name || !form.owner || !form.sector) {
      setError("Please fill in Business Name, Owner Name, and Sector.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const generatedPlan = await generatePlan(form);
      setPlan(generatedPlan);
      setSections(parseSections(generatedPlan));
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadFull = async () => {
    setDownloadingFull(true);
    try {
      await downloadFullPlanAsDocx(sections, form.name);
    } finally {
      setDownloadingFull(false);
    }
  };

  const handleDownloadBank = async () => {
    setDownloadingBank(true);
    try {
      const bankSections = sections.filter((s) =>
        /executive summary/i.test(s.title) || /financial/i.test(s.title)
      );
      await downloadFullPlanAsDocx(bankSections, form.name + "_Bank_Submission");
    } finally {
      setDownloadingBank(false);
    }
  };

  const reset = () => {
    setStep(0);
    setForm({
      name: "",
      owner: "",
      sector: "",
      location: "",
      description: "",
      targetCustomers: "",
      competitors: "",
      customerAcquisition: "",
      employees: "",
      suppliers: "",
      challenges: "",
      startupCost: "",
      year1Revenue: "",
      fundingNeeded: false,
      fundingAmount: "",
      exportPlans: false,
      exportDetails: "",
    });
    setPlan("");
    setSections([]);
    setError("");
  };

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", minHeight: "100vh" }}>
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      <header style={{ borderBottom: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Business Plan</span>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              ↻ Reset
            </button>
            <Link href="/" style={{ fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              ⌂ Home
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
          Mauritius Business
          <br />
          <span style={{ color: CORAL }}>Plan Generator</span>
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
          Answer a few questions and get a professional business plan in minutes.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ background: i <= step ? CORAL : "#e5e7eb", color: i <= step ? "#fff" : "#9ca3af", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px", fontWeight: 700, fontSize: 16 }}>
                {s.icon}
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0, fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#dc2626", fontSize: 14 }}>
            {error}
          </div>
        )}

        {step === 0 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20 }}>🏢 About your business</h2>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Business name *</label>
            <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. TechStart Mauritius Ltd" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Owner/Director name *</label>
            <input type="text" value={form.owner} onChange={(e) => updateForm("owner", e.target.value)} placeholder="e.g. Pria Ramnen" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Sector *</label>
            <select value={form.sector} onChange={(e) => updateForm("sector", e.target.value)} style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 20, boxSizing: "border-box" }}>
              <option value="">Select a sector</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Location in Mauritius</label>
            <input type="text" value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="e.g. Port Louis / Ebène" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Business description</label>
            <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="What does your business do?" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", minHeight: 100, resize: "vertical" }} />

            <button onClick={() => setStep(1)} style={{ width: "100%", padding: "14px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
              Next: Market & Customers →
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20 }}>🎯 Market & Customers</h2>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Target customers</label>
            <textarea value={form.targetCustomers} onChange={(e) => updateForm("targetCustomers", e.target.value)} placeholder="e.g. SMEs in Mauritius" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Competitors</label>
            <textarea value={form.competitors} onChange={(e) => updateForm("competitors", e.target.value)} placeholder="e.g. XYZ Ltd, ABC Services" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Customer acquisition</label>
            <textarea value={form.customerAcquisition} onChange={(e) => updateForm("customerAcquisition", e.target.value)} placeholder="e.g. Digital marketing, networking" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ flex: 1, padding: "14px", background: "#fff", color: NAVY, border: "2px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Next: Operations →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20 }}>⚙️ Operations</h2>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Employees planned</label>
            <input type="number" value={form.employees} onChange={(e) => updateForm("employees", e.target.value)} placeholder="e.g. 5" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Suppliers & partners</label>
            <textarea value={form.suppliers} onChange={(e) => updateForm("suppliers", e.target.value)} placeholder="e.g. Local manufacturers, vendors" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Challenges</label>
            <textarea value={form.challenges} onChange={(e) => updateForm("challenges", e.target.value)} placeholder="e.g. Import costs, skilled staff" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", background: "#fff", color: NAVY, border: "2px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ flex: 1, padding: "14px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Next: Financials →</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 16 }}>💰 Financials</h2>

            <div style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: "#92400e" }}>
              ⚠️ Please ensure all figures are accurate. A bank or SMEDA officer will verify this information.
            </div>

            {((form.startupCost && parseFloat(form.startupCost) < 10000) || (form.year1Revenue && parseFloat(form.year1Revenue) < 10000)) && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: "#dc2626" }}>
                ⚠️ These figures seem very low for a business plan. Please double-check before generating.
              </div>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Startup costs (Rs)</label>
            <input type="number" value={form.startupCost} onChange={(e) => updateForm("startupCost", e.target.value)} placeholder="e.g. 500000" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Year 1 revenue target (Rs)</label>
            <input type="number" value={form.year1Revenue} onChange={(e) => updateForm("year1Revenue", e.target.value)} placeholder="e.g. 2000000" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              <input type="checkbox" checked={form.fundingNeeded} onChange={(e) => updateForm("fundingNeeded", e.target.checked)} style={{ marginRight: 8 }} />
              Need external funding?
            </label>
            {form.fundingNeeded && (
              <input type="number" value={form.fundingAmount} onChange={(e) => updateForm("fundingAmount", e.target.value)} placeholder="Amount in Rs" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 14, boxSizing: "border-box" }} />
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>
              <input type="checkbox" checked={form.exportPlans} onChange={(e) => updateForm("exportPlans", e.target.checked)} style={{ marginRight: 8 }} />
              Plan to export?
            </label>
            {form.exportPlans && (
              <textarea value={form.exportDetails} onChange={(e) => updateForm("exportDetails", e.target.value)} placeholder="Which countries?" style={{ width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid #e5e7eb", borderRadius: 10, marginBottom: 20, boxSizing: "border-box", minHeight: 80, resize: "vertical" }} />
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", background: "#fff", color: NAVY, border: "2px solid #e5e7eb", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>← Back</button>
              <button onClick={handleGenerate} disabled={generating} style={{ flex: 1, padding: "14px", background: generating ? "#cbd5e1" : CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: generating ? "not-allowed" : "pointer" }}>
                {generating ? "⟳ Generating..." : "Generate Plan →"}
              </button>
            </div>
          </>
        )}

        {step === 4 && sections.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, margin: 0 }}>📋 Your Business Plan</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleDownloadFull} disabled={downloadingFull} style={{ padding: "10px 16px", background: downloadingFull ? "#0a5242" : "#0F6E56", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: downloadingFull ? "not-allowed" : "pointer" }}>
                  {downloadingFull ? "⟳ Building..." : "📄 Download Full Plan"}
                </button>
                <button onClick={handleDownloadBank} disabled={downloadingBank} style={{ padding: "10px 16px", background: "#fff", color: downloadingBank ? "#94a3b8" : "#0F6E56", border: `1.5px solid ${downloadingBank ? "#e5e7eb" : "#0F6E56"}`, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: downloadingBank ? "not-allowed" : "pointer" }}>
                  {downloadingBank ? "⟳ Building..." : "🏦 Download for Bank"}
                </button>
              </div>
            </div>

            {sections.map((section, i) => (
              <div key={i} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, marginBottom: 16, overflow: "hidden" }}>
                <div style={{ background: "#1a2332", padding: "12px 20px" }}>
                  <h3 style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>{section.title}</h3>
                </div>
                <div className="plan-section-content" style={{ padding: "16px 20px", fontSize: 14, color: NAVY, lineHeight: 1.75, fontFamily: "Georgia, serif" }}>
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            ))}

            <div style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
                ⚠️ <strong>Review before use.</strong> This is an AI draft. Customize and review with a professional before submitting to banks.
              </p>
            </div>

            <button onClick={reset} style={{ fontSize: 14, color: "#6b7280", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              ↻ Start a new plan
            </button>
          </>
        )}
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
        <EmailCapture source="/plan" message="Get resources for Mauritian entrepreneurs and SME grant updates." />
      </div>

      <footer style={{ padding: "16px 24px", textAlign: "center", borderTop: "1px solid #e5e7eb", background: "white" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>

      <style>{`
        .plan-section-content p { margin: 0 0 10px; }
        .plan-section-content p:last-child { margin-bottom: 0; }
        .plan-section-content h3 { font-size: 15px; font-weight: 700; color: ${NAVY}; margin: 14px 0 6px; }
        .plan-section-content h4 { font-size: 14px; font-weight: 600; color: #374151; margin: 10px 0 4px; }
        .plan-section-content ul, .plan-section-content ol { margin: 0 0 10px; padding-left: 20px; }
        .plan-section-content li { margin-bottom: 4px; line-height: 1.65; }
        .plan-section-content strong { font-weight: 700; }
        .plan-section-content em { font-style: italic; }
      `}</style>
    </div>
  );
}
