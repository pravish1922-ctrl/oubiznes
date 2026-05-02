"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Home, ExternalLink, RotateCcw, ChevronRight, ChevronDown, FileText } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

// Standard docs shared by most SME Mauritius grant schemes
const SME_DOCS = [
  "BRN Certificate (from CBRD)",
  "NID copy — business owner",
  "Last 3 months bank statements",
  "Tax Compliance Certificate (from MRA)",
  "2 supplier quotations for the funded item",
  "Brief project description / business case",
];

const SCHEMES = [
  {
    id: "tins",
    name: "Technology & Innovation Scheme (TINS)",
    agency: "SME Mauritius",
    amount: "Up to Rs 150,000",
    coverage: "80% of project cost",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Funds websites, ERP, POS, automation, green tech, productive equipment.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Technology", "Equipment", "Digital"],
    docs: SME_DOCS,
  },
  {
    id: "icds",
    name: "Internal Capability Development Scheme (ICDS)",
    agency: "SME Mauritius",
    amount: "Up to Rs 200,000",
    coverage: "80% of project cost",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Funds consultancy, process redesign, quality systems, training programmes.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Consultancy", "Capability", "Training"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "2 quotations from consultancy firm",
      "Scope of work / training plan",
    ],
  },
  {
    id: "bts",
    name: "Business Transformation Scheme (BTS)",
    agency: "SME Mauritius",
    amount: "Up to Rs 150,000",
    coverage: "80% of project cost",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Strategic redesign: business model review, governance, risk, marketing strategy.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Strategy", "Transformation"],
    docs: SME_DOCS,
  },
  {
    id: "marketing",
    name: "Marketing & Branding Scheme",
    agency: "SME Mauritius",
    amount: "Up to Rs 150,000",
    coverage: "80% of project cost",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Brand identity, packaging, digital campaigns, export-ready marketing materials.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Marketing", "Branding"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "2 quotations from marketing / design agency",
      "Marketing brief or campaign description",
    ],
  },
  {
    id: "green",
    name: "Green / Sustainability Scheme",
    agency: "SME Mauritius",
    amount: "Up to Rs 150,000",
    coverage: "80% of project cost",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Energy efficiency upgrades, ISO 14001 certification, waste reduction systems.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Green", "Sustainability"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "2 quotations for green equipment / audit",
      "Energy or sustainability assessment",
    ],
  },
  {
    id: "madeinmoris",
    name: "Made in Moris Certification Grant",
    agency: "SME Mauritius / MEXA",
    amount: "Rs 50,000",
    coverage: "One-off grant",
    type: "Grant",
    sectors: ["manufacturing", "agri", "food"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Certify your product under the Made in Moris label — trust signal for local and export buyers.",
    url: "https://www.madeinmoris.com/",
    tags: ["Certification", "Export", "Manufacturing"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Tax Compliance Certificate (from MRA)",
      "Product samples or product images",
      "Manufacturing process description",
      "Proof of local content / origin",
    ],
  },
  {
    id: "gs1",
    name: "GS1 Barcode Registration (100% funded)",
    agency: "SME Mauritius",
    amount: "~Rs 20,000 value",
    coverage: "100% of fees",
    type: "Grant",
    sectors: ["manufacturing", "food", "retail"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "SME Mauritius covers 100% of GS1 barcode registration — essential for supermarkets and export.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Barcode", "Retail", "Export"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Tax Compliance Certificate (from MRA)",
      "List of products requiring barcodes",
    ],
  },
  {
    id: "shetrades",
    name: "SheTrades Mauritius Hub",
    agency: "EDB Mauritius",
    amount: "Training + support",
    coverage: "Programme participation",
    type: "Programme",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    womenLed: true,
    desc: "Dedicated programme for women-led businesses. Export support, buyer networks, DHL Go Trade.",
    url: "https://shetrades.edbmauritius.org/",
    tags: ["Women", "Export", "Network"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — confirming woman ownership or management",
      "Business profile (1–2 pages)",
      "Export plan or intent statement",
    ],
  },
  {
    id: "crigs",
    name: "Collaborative R&D Innovation Grant (CRIGS)",
    agency: "MRIC",
    amount: "Up to Rs 5,000,000",
    coverage: "Matching grant",
    type: "R&D Grant",
    sectors: ["ict", "manufacturing", "agri", "health"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Up to Rs 5M matching grant for industry-academia R&D projects. Up to 24 months duration.",
    url: "https://mric.govmu.org/",
    tags: ["R&D", "Innovation", "Research"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — principal investigator / business owner",
      "Research proposal with objectives and methodology",
      "Academic or industry partner agreement",
      "Detailed project budget",
      "Team CVs (research leads)",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "ipps",
    name: "Industrial Property Protection Scheme (IPPS)",
    agency: "MRIC",
    amount: "50% of filing fees",
    coverage: "Patent & design registration",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "50% refund on patent filing and industrial design registration fees.",
    url: "https://mric.govmu.org/",
    tags: ["Patent", "IP", "Innovation"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — inventor / business owner",
      "Patent or design filing application",
      "Invention / design description",
      "Official filing fee receipts",
    ],
  },
  {
    id: "ai-tax",
    name: "AI Investment Tax Deduction",
    agency: "MRA / Budget 2025-26",
    amount: "Up to Rs 150,000",
    coverage: "Full tax deduction",
    type: "Tax Incentive",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Full tax deduction on AI software, training, integration and licensing costs.",
    url: "https://www.mra.mu/",
    tags: ["AI", "Tax", "Technology"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Invoices for qualifying AI expenditure",
      "Annual tax return (filed with MRA)",
    ],
  },
  {
    id: "mitci",
    name: "AI Innovation Start-Up Programme (MITCI)",
    agency: "Ministry of ICT",
    amount: "Mentorship + compute credits",
    coverage: "Programme",
    type: "Programme",
    sectors: ["ict", "ai"],
    minTurnover: 0,
    maxTurnover: 10000000,
    registered: true,
    desc: "National AI programme: mentorship, procurement access, AI compute credits for startups.",
    url: "https://mitci.govmu.org/",
    tags: ["AI", "Startup", "Tech"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — founder(s)",
      "AI project proposal or product demo",
      "Team profile and CVs",
      "Business plan (summary is sufficient)",
    ],
  },
  {
    id: "dbm",
    name: "Development Bank of Mauritius (DBM) SME Loan",
    agency: "DBM",
    amount: "Up to Rs 10,000,000",
    coverage: "Concessional loan",
    type: "Loan",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Concessional lending for SMEs at better rates than commercial banks. Business plan required.",
    url: "https://www.dbm.mu/",
    tags: ["Loan", "Finance", "Working capital"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — directors / guarantors",
      "Detailed business plan",
      "Financial statements (last 2 years, if available)",
      "Last 6 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "Collateral documents (if applicable)",
    ],
  },
  {
    id: "mcci",
    name: "MCCI SME Partnership Fund",
    agency: "MCCI",
    amount: "Matching investment",
    coverage: "Investment + mentoring",
    type: "Investment",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Matches SMEs with larger corporates for supply-chain integration and investment.",
    url: "https://www.mcci.org/",
    tags: ["Investment", "Network", "Growth"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Business profile (2–3 pages)",
      "Partnership proposal or integration plan",
      "Latest financial statements",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "tradefair",
    name: "International Trade Fair Participation Subsidy",
    agency: "EDB Mauritius",
    amount: "Partial subsidy",
    coverage: "Travel + stand costs",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Subsidy to attend international trade fairs in your sector.",
    url: "https://www.edbmauritius.org/",
    tags: ["Export", "Trade", "International"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Trade fair registration confirmation",
      "Business export profile",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "warehouse",
    name: "Africa Warehouse Subsidy",
    agency: "EDB Mauritius",
    amount: "Up to Rs 300,000/year",
    coverage: "60% of rental + admin, 3 years",
    type: "Grant",
    sectors: ["manufacturing", "retail", "agri"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    exporter: true,
    desc: "EDB covers 60% of your first 200m² warehouse in selected African countries for 3 years.",
    url: "https://www.edbmauritius.org/",
    tags: ["Export", "Africa", "Warehouse"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Export licence (if applicable)",
      "Signed warehouse lease agreement in target country",
      "Business plan for African market",
      "Last 6 months bank statements",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "young-entrepreneur",
    name: "TINS Young Entrepreneur Bonus",
    agency: "SME Mauritius",
    amount: "Up to Rs 50,000 (full grant)",
    coverage: "100% for non-ICT equipment",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    youngEntrepreneur: true,
    desc: "Full grant (not 80%) up to Rs 50,000 for entrepreneurs under 29 on non-ICT equipment.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Youth", "Equipment", "Bonus"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — confirming age under 29",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "2 quotations for non-ICT equipment",
    ],
  },
  {
    id: "edb-investment",
    name: "EDB Investment Support Scheme",
    agency: "EDB Mauritius",
    amount: "Custom",
    coverage: "Tax holidays + incentives",
    type: "Tax Incentive",
    sectors: ["manufacturing", "ict", "health", "agri"],
    minTurnover: 1000000,
    maxTurnover: 100000000,
    registered: true,
    desc: "Tax holidays, duty exemptions, and investment support for priority sectors.",
    url: "https://www.edbmauritius.org/",
    tags: ["Investment", "Tax holiday", "Priority sector"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — directors",
      "Investment proposal with sector focus",
      "5-year financial projections",
      "Detailed business plan",
      "Last 6 months bank statements",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "ndf",
    name: "National Development Fund (NDF) Grant",
    agency: "Ministry of Finance",
    amount: "Varies by project",
    coverage: "Public interest projects",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 100000000,
    registered: true,
    desc: "Discretionary grants for projects with strong social or economic impact.",
    url: "https://mof.govmu.org/",
    tags: ["Social impact", "National interest"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Project proposal with social / economic impact analysis",
      "Detailed budget breakdown",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
    ],
  },
  {
    id: "sme-smart",
    name: "SME Digitalisation Grant (Smart Mauritius)",
    agency: "MTCI / SME Mauritius",
    amount: "Up to Rs 75,000",
    coverage: "Up to 80%",
    type: "Grant",
    sectors: ["all"],
    minTurnover: 0,
    maxTurnover: 50000000,
    registered: true,
    desc: "Accelerated digital adoption grant under Smart Mauritius initiative for micro and small SMEs.",
    url: "https://www.smemu.com/schemes/",
    tags: ["Digital", "Smart Mauritius", "Small SME"],
    docs: [
      "BRN Certificate (from CBRD)",
      "NID copy — business owner",
      "Last 3 months bank statements",
      "Tax Compliance Certificate (from MRA)",
      "2 quotations for digital tools / software",
      "Brief digital transformation plan",
    ],
  },
];

const STEPS = [
  {
    id: "registered",
    question: "Is your business registered with CBRD?",
    subtitle: "You need a Business Registration Number (BRN)",
    options: [
      { value: "yes", label: "Yes, I have a BRN" },
      { value: "no", label: "Not yet registered" },
    ],
  },
  {
    id: "turnover",
    question: "What is your annual turnover?",
    subtitle: "Gross revenue — not profit",
    options: [
      { value: "under1m", label: "Under Rs 1 million" },
      { value: "1m-10m", label: "Rs 1M – Rs 10M" },
      { value: "10m-50m", label: "Rs 10M – Rs 50M" },
      { value: "50m-100m", label: "Rs 50M – Rs 100M" },
      { value: "over100m", label: "Over Rs 100M" },
    ],
  },
  {
    id: "sector",
    question: "What sector are you in?",
    subtitle: "Your primary business activity",
    options: [
      { value: "all", label: "General / Services" },
      { value: "ict", label: "ICT / Tech / AI" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "agri", label: "Agriculture / Agritech" },
      { value: "food", label: "Food & Beverage" },
      { value: "retail", label: "Retail / Commerce" },
      { value: "health", label: "Health / Medical" },
    ],
  },
  {
    id: "profile",
    question: "Any of these apply to you?",
    subtitle: "Unlock additional bonuses",
    options: [
      { value: "none", label: "None of these" },
      { value: "young", label: "Founder under 29 years old" },
      { value: "women", label: "Women-led business" },
      { value: "exporter", label: "Exporting or planning to export" },
      { value: "rd", label: "R&D / innovation project" },
    ],
  },
  {
    id: "goal",
    question: "What do you need funding for?",
    subtitle: "Your most immediate need",
    options: [
      { value: "tech", label: "Technology / software / equipment" },
      { value: "consulting", label: "Consultancy / capability building" },
      { value: "marketing", label: "Marketing / branding" },
      { value: "export", label: "Export / international expansion" },
      { value: "finance", label: "Working capital / finance" },
      { value: "rd", label: "Research & development" },
    ],
  },
];

function turnoverValue(t) {
  if (t === "under1m") return 500000;
  if (t === "1m-10m") return 5000000;
  if (t === "10m-50m") return 30000000;
  if (t === "50m-100m") return 75000000;
  return 200000000;
}

function scoreScheme(scheme, answers) {
  let score = 0;
  const tv = turnoverValue(answers.turnover);
  if (tv < scheme.minTurnover || tv > scheme.maxTurnover) return -1;
  if (answers.registered !== "yes" && scheme.registered) score -= 10;

  const sector = answers.sector;
  if (scheme.sectors.includes("all") || scheme.sectors.includes(sector)) score += 10;
  else score -= 5;

  if (scheme.youngEntrepreneur && answers.profile === "young") score += 20;
  if (scheme.womenLed && answers.profile === "women") score += 20;
  if (scheme.exporter && answers.profile === "exporter") score += 20;

  const goal = answers.goal;
  if (goal === "tech" && (scheme.tags.includes("Technology") || scheme.tags.includes("Digital") || scheme.tags.includes("Equipment"))) score += 15;
  if (goal === "consulting" && (scheme.tags.includes("Consultancy") || scheme.tags.includes("Capability") || scheme.tags.includes("Training"))) score += 15;
  if (goal === "marketing" && (scheme.tags.includes("Marketing") || scheme.tags.includes("Branding"))) score += 15;
  if (goal === "export" && (scheme.tags.includes("Export") || scheme.tags.includes("Africa") || scheme.tags.includes("International"))) score += 15;
  if (goal === "finance" && (scheme.tags.includes("Loan") || scheme.tags.includes("Finance") || scheme.tags.includes("Investment"))) score += 15;
  if (goal === "rd" && (scheme.tags.includes("R&D") || scheme.tags.includes("Research") || scheme.tags.includes("Innovation"))) score += 15;

  return score;
}

const RANK_COLORS = { 0: GOLD, 1: CORAL, 2: BLUE };

export default function GrantsFinder() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [expandedDocs, setExpandedDocs] = useState(new Set());
  const [lastVerified, setLastVerified] = useState(null);

  useEffect(() => {
    fetch("/api/regulatory-status")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.lastVerified) setLastVerified(data.lastVerified); })
      .catch(() => {});
  }, []);

  function toggleDocs(id) {
    setExpandedDocs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAnswer(key, value) {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const scored = SCHEMES.map(s => ({ ...s, score: scoreScheme(s, newAnswers) }))
        .filter(s => s.score >= 0)
        .sort((a, b) => b.score - a.score);
      setResults(scored);
    }
  }

  function reset() {
    setStep(0);
    setAnswers({});
    setResults(null);
    setExpandedDocs(new Set());
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
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
              <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Grants Finder</span>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={reset} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer" }}>
              <RotateCcw size={14} /> Reset
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
              <Home size={14} /> Home
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px" }}>
        {!results ? (
          <>
            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: 32 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? CORAL : "#e5e7eb" }} />
              ))}
            </div>

            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>Step {step + 1} of {STEPS.length}</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 6 }}>{STEPS[step].question}</h1>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>{STEPS[step].subtitle}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STEPS[step].options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(STEPS[step].id, opt.value)}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: 12,
                    border: "2px solid #e5e7eb",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 16,
                    fontWeight: 600,
                    color: NAVY,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = CORAL; e.currentTarget.style.background = "#fff8f7"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
                >
                  {opt.label}
                  <ChevronRight size={18} color="#d1d5db" />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
              {results.length} scheme{results.length !== 1 ? "s" : ""} match your profile
            </h1>

            {/* Disclaimer — must appear before results */}
            <div style={{ background: "#FEF9C3", border: "1px solid #FCD34D", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
              ⚠️ <strong>Grant information last verified {lastVerified
                ? new Date(lastVerified).toLocaleDateString('en-MU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Indian/Mauritius' })
                : 'periodically'
              }.</strong>{" "}
              Scheme terms, amounts, and eligibility conditions can change without notice. Always confirm directly with the issuing body before applying or incurring expenses.
            </div>

            {answers.registered !== "yes" && (
              <div style={{ background: "#FFF8F0", border: "1px solid #fde8d8", borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                  <strong>Not yet registered?</strong> Most grants below require a BRN.{" "}
                  <a href="https://companies.govmu.org" target="_blank" rel="noopener noreferrer" style={{ color: "#92400e", textDecoration: "underline" }}>Register your business first →</a>
                </p>
              </div>
            )}

            <EmailCapture source="/grants" message="Get alerts when new grants or schemes launch in Mauritius." />

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
              {results.map((scheme, idx) => (
                <div key={scheme.id} style={{
                  background: "#fff",
                  border: idx < 3 ? `2px solid ${RANK_COLORS[idx]}` : "1.5px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "18px 20px",
                  position: "relative",
                }}>
                  {idx < 3 && (
                    <div style={{
                      position: "absolute", top: -10, right: 16,
                      background: RANK_COLORS[idx], color: idx === 0 ? NAVY : "#fff",
                      fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                    }}>
                      {idx === 0 ? "🥇 Best match" : idx === 1 ? "🥈 Strong match" : "🥉 Good match"}
                    </div>
                  )}

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 2 }}>{scheme.name}</h3>
                  <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{scheme.agency}</p>
                  <p style={{ fontSize: 14, color: "#374151", marginBottom: 10 }}>{scheme.desc}</p>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    <span style={{ background: "#f3f4f6", color: NAVY, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                      {scheme.amount}
                    </span>
                    <span style={{ background: "#fef2f2", color: CORAL, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                      {scheme.type}
                    </span>
                    {scheme.coverage && (
                      <span style={{ background: "#f0fdf4", color: GREEN, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
                        {scheme.coverage}
                      </span>
                    )}
                  </div>

                  {/* Document checklist toggle */}
                  {scheme.docs && scheme.docs.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <button
                        onClick={() => toggleDocs(scheme.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 13, fontWeight: 600, color: BLUE,
                          background: "#eff6ff", border: "1px solid #bfdbfe",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                        }}
                      >
                        <FileText size={13} />
                        Documents required
                        {expandedDocs.has(scheme.id)
                          ? <ChevronDown size={13} />
                          : <ChevronRight size={13} />}
                      </button>

                      {expandedDocs.has(scheme.id) && (
                        <ul style={{ margin: "10px 0 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                          {scheme.docs.map((doc, di) => (
                            <li key={di} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#374151" }}>
                              <span style={{ color: GREEN, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                              {doc}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Official Source button */}
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 13, fontWeight: 600, color: "#fff",
                      background: CORAL, borderRadius: 8,
                      padding: "8px 14px", textDecoration: "none",
                    }}
                  >
                    Official Source <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 print:hidden" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
