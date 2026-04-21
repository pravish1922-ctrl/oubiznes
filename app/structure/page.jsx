"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from "lucide-react";
import EmailCapture from "@/components/EmailCapture";

const NAVY = "#0A1628";
const CORAL = "#0D9488";
const GOLD = "#F4C430";
const GREEN = "#0F7B3F";
const BLUE = "#1E5AA0";

const QUESTIONS = [
  {
    id: "partners",
    question: "Who is starting this business?",
    subtitle: "This affects which legal structures are available to you.",
    options: [
      { value: "solo", label: "Just me — I'm starting alone", icon: "👤" },
      { value: "partners", label: "Me and one or more partners", icon: "👥" },
    ],
  },
  {
    id: "turnover",
    question: "What is your expected annual turnover in year 1?",
    subtitle: "Turnover is total sales revenue, not profit.",
    options: [
      { value: "under2m", label: "Under Rs 2 million", icon: "🌱" },
      { value: "2m_to_6m", label: "Rs 2 million – Rs 6 million", icon: "📈" },
      { value: "over6m", label: "Over Rs 6 million", icon: "🚀" },
      { value: "unsure", label: "Not sure yet", icon: "🤷" },
    ],
  },
  {
    id: "liability",
    question: "Do you want to protect your personal assets?",
    subtitle: "If the business has debts or is sued, your personal savings, car, or home could be at risk without protection.",
    options: [
      { value: "yes", label: "Yes — I want my personal assets protected", icon: "🛡️" },
      { value: "no", label: "Not a priority for me right now", icon: "🤝" },
    ],
  },
  {
    id: "employees",
    question: "Do you plan to employ staff?",
    subtitle: "Even one employee changes your tax and legal obligations.",
    options: [
      { value: "no", label: "No employees — just me (or partners)", icon: "🧑‍💻" },
      { value: "yes_few", label: "Yes — a few (1–5 people)", icon: "👨‍👩‍👧" },
      { value: "yes_many", label: "Yes — a larger team (6+ people)", icon: "🏢" },
    ],
  },
  {
    id: "growth",
    question: "What are your growth ambitions?",
    subtitle: "Be honest — there is no wrong answer.",
    options: [
      { value: "lifestyle", label: "Steady income — I want a sustainable business, not rapid growth", icon: "🌴" },
      { value: "grow", label: "Growth — I plan to expand and possibly raise funding or loans", icon: "💰" },
      { value: "international", label: "International — I'll serve clients or operate outside Mauritius", icon: "🌍" },
    ],
  },
];

function getRecommendation(answers) {
  const { partners, turnover, liability, employees, growth } = answers;

  if (growth === "international") {
    return {
      primary: "Global Business Company (GBC)",
      tag: "Best for international operations",
      tagColor: BLUE,
      description: "If your business primarily serves clients or operates outside Mauritius, a Global Business Company licence gives you significant tax advantages and access to Mauritius's network of Double Taxation Agreements with 46+ countries.",
      pros: [
        "Tax rate as low as 3% on foreign-sourced income",
        "Access to 46+ Double Taxation Agreements",
        "Strong international credibility",
        "Full liability protection",
      ],
      cons: [
        "Requires a Management Company (e.g. SBL, Abax, IQ-EQ) — costs ~Rs 120,000+/year",
        "Must have genuine economic substance in Mauritius",
        "Not suitable for businesses primarily serving Mauritian customers",
      ],
      cost: "Rs 15,000 application fee + ~Rs 120,000+/year management company",
      timeToRegister: "3–6 weeks",
      nextStep: "Contact the Financial Services Commission (FSC) at fscmauritius.org and engage a licensed Management Company.",
      official: "https://www.fscmauritius.org",
    };
  }

  if (partners === "partners" && liability === "no" && growth === "lifestyle") {
    return {
      primary: "Partnership (Société)",
      tag: "Best for shared ventures",
      tagColor: GREEN,
      description: "A simple structure when two or more people run a business together without needing full corporate formality. Note: partners share unlimited personal liability for business debts.",
      pros: [
        "Simple and cheap to set up",
        "Shared decision-making and resources",
        "Profits taxed at individual rate — potentially lower than corporate tax",
        "Minimal compliance requirements",
      ],
      cons: [
        "Each partner has unlimited personal liability",
        "One partner's actions bind all partners",
        "Harder to raise investment than a company",
        "Dissolves if a partner leaves",
      ],
      cost: "Rs 500–2,000 registration fees",
      timeToRegister: "1–2 weeks",
      nextStep: "Register with the Corporate and Business Registration Department (CBRD) at companies.govmu.org. Draft a partnership agreement with a lawyer.",
      official: "https://companies.govmu.org",
    };
  }

 if (
    liability === "yes" ||
    employees === "yes_many" ||
    growth === "grow" ||
    turnover === "over6m" ||
    (partners === "partners" && liability === "yes")
  ) {
    return {
      primary: "Private Company Limited by Shares (Ltd)",
      tag: "Most popular choice",
      tagColor: CORAL,
      description: "The most common structure for serious Mauritian businesses. Your personal assets are separate from the company's — if the business has debts, your savings and home are protected. Required if you plan to grow, hire staff, or raise investment.",
      pros: [
        "Full personal liability protection — company debts stay with the company",
        "Easier to raise investment and get bank loans",
        "Professional credibility with clients and suppliers",
        "Can have shareholders and a board of directors",
        "Corporate tax rate: 15% (same as income tax, but more planning options)",
      ],
      cons: [
        "Annual returns must be filed with CBRD",
        "Annual financial statements required",
        "More admin than sole trader",
        "At least one director and one shareholder required",
      ],
      cost: "Rs 1,000–5,000 incorporation fees + ~Rs 2,000–8,000/year accounting",
      timeToRegister: "3–7 business days",
      nextStep: "Register online via CBRIS — the official Mauritius company registration system. You'll need a company name, registered address, and one director. Your BRN is issued within 3–7 business days.",
      official: "https://cbris.mns.global",
      officialLabel: "Register on CBRIS →",
    };
  }

  return {
    primary: "Sole Trader (Entreprise Individuelle)",
    tag: "Simplest to start",
    tagColor: GOLD,
    tagTextColor: NAVY,
    description: "The fastest and cheapest way to start a business in Mauritius. You and the business are legally the same — simple tax, minimal admin. The trade-off is that your personal assets are not protected from business debts.",
    pros: [
      "Cheapest and fastest to register — often done in a day",
      "Simplest tax — declare business income on your personal tax return",
      "Full control — no shareholders, no board",
      "Easy to change structure later as you grow",
    ],
    cons: [
      "No liability protection — personal assets at risk if business has debts",
      "Harder to get business loans than an Ltd",
      "Perceived as less formal by some suppliers and clients",
      "Cannot issue shares or bring in investors",
    ],
    cost: "Rs 300–1,500 registration fees",
    timeToRegister: "1–3 business days",
    nextStep: "Register with the Corporate and Business Registration Department (CBRD) at companies.govmu.org. You'll need your NIC, a trade name, and your business address. Also register with MRA for income tax.",
    official: "https://companies.govmu.org",
  };
}

export default function StructureAdvisor() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);

  const isIntro = step === 0;
  const isDone = step === QUESTIONS.length + 1;
  const currentQ = QUESTIONS[step - 1];
  const recommendation = isDone ? getRecommendation(answers) : null;
  const progressPct = step === 0 ? 0 : Math.round((step / QUESTIONS.length) * 100);

  function handleNext() {
    if (selected === null) return;
    const newAnswers = { ...answers, [currentQ.id]: selected };
    setAnswers(newAnswers);
    setSelected(null);
    setStep(step + 1);
  }

  function handleBack() {
    if (step === 1) { setStep(0); setSelected(null); }
    else { setStep(step - 1); setSelected(answers[QUESTIONS[step - 2].id] || null); }
  }

  function restart() { setStep(0); setAnswers({}); setSelected(null); }

  return (
    <div style={{ background: "linear-gradient(to bottom, #FAF5EE, #fff)", colorScheme: "light", minHeight: "100vh" }}>
      <div style={{ height: 8, display: "flex" }}>
        <div style={{ flex: 1, background: "#CC0000" }} />
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: GOLD }} />
        <div style={{ flex: 1, background: GREEN }} />
      </div>

      <header className="border-b border-gray-200 bg-white print:hidden">
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 18, color: CORAL }}>OuBiznes</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: NAVY }}>.mu</span>
            <span style={{ marginLeft: 10, fontSize: 14, color: "#6b7280" }}>Structure Advisor</span>
          </div>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: NAVY, border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", textDecoration: "none" }}>
            <Home size={14} /> Home
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>

        {isIntro && (
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: NAVY, marginBottom: 4 }}>
              <span style={{ display: "block" }}>Business Structure</span>
              <span style={{ display: "block", color: CORAL }}>Advisor</span>
            </h1>
            <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32, lineHeight: 1.6 }}>
              Sole trader, partnership, or private company? Answer 5 questions and get a personalised recommendation for your Mauritian business — with costs, timelines, and next steps.
            </p>
            <div style={{ display: "grid", gap: 12, marginBottom: 32 }}>
              {[
                { icon: "⚡", text: "Takes 2 minutes" },
                { icon: "🇲🇺", text: "Based on Mauritius law" },
                { icon: "🔒", text: "No signup, fully free" },
              ].map(item => (
                <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px" }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: NAVY, fontWeight: 600 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#FFF8F0", border: "1px solid #fde8d8", borderRadius: 12, padding: "14px 18px", marginBottom: 28 }}>
              <p style={{ fontSize: 13, color: "#92400e" }}>
                <strong>Disclaimer:</strong> This tool gives general guidance based on common scenarios. It is not legal advice. Always consult a lawyer or accountant before making a final decision.
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              style={{ width: "100%", padding: "16px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              Start the advisor <ChevronRight size={18} />
            </button>
          </div>
        )}

        {!isIntro && !isDone && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>Question {step} of {QUESTIONS.length}</span>
                <span style={{ fontSize: 13, color: CORAL, fontWeight: 600 }}>{progressPct}%</span>
              </div>
              <div style={{ height: 6, background: "#e5e7eb", borderRadius: 99 }}>
                <div style={{ height: 6, background: CORAL, borderRadius: 99, width: `${progressPct}%`, transition: "width 0.3s ease" }} />
              </div>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, marginBottom: 8 }}>{currentQ.question}</h2>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>{currentQ.subtitle}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {currentQ.options.map(opt => {
                const isChosen = selected === opt.value;
                return (
                  <button key={opt.value} onClick={() => setSelected(opt.value)} style={{ textAlign: "left", background: isChosen ? "#FFF0EE" : "#fff", border: `2px solid ${isChosen ? CORAL : "#e5e7eb"}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: isChosen ? 700 : 500, color: isChosen ? CORAL : NAVY }}>{opt.label}</span>
                    {isChosen && <CheckCircle size={18} style={{ marginLeft: "auto", color: CORAL, flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleBack} style={{ flex: 1, padding: "13px", background: "none", color: NAVY, border: "1.5px solid #e5e7eb", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <ChevronLeft size={16} /> Back
              </button>
              <button onClick={handleNext} disabled={!selected} style={{ flex: 2, padding: "13px", background: CORAL, color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: selected ? "pointer" : "not-allowed", opacity: selected ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {step === QUESTIONS.length ? "Get my recommendation" : "Next"} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {isDone && recommendation && (
          <div>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>Your recommendation</p>
            <div style={{ background: "#fff", border: `2px solid ${CORAL}`, borderRadius: 16, padding: 28, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{recommendation.primary}</h2>
                <span style={{ background: recommendation.tagColor, color: recommendation.tagTextColor || "#fff", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>{recommendation.tag}</span>
              </div>
              <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.7, marginBottom: 20 }}>{recommendation.description}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>ESTIMATED COST</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{recommendation.cost}</div>
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>TIME TO REGISTER</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{recommendation.timeToRegister}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 8 }}>✓ Advantages</div>
                  {recommendation.pros.map(p => (
                    <div key={p} style={{ fontSize: 13, color: "#374151", marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${GREEN}`, lineHeight: 1.5 }}>{p}</div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: CORAL, marginBottom: 8 }}>✗ Watch out for</div>
                  {recommendation.cons.map(c => (
                    <div key={c} style={{ fontSize: 13, color: "#374151", marginBottom: 6, paddingLeft: 12, borderLeft: `2px solid ${CORAL}`, lineHeight: 1.5 }}>{c}</div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#F0F7FF", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: BLUE, fontWeight: 700, marginBottom: 4 }}>NEXT STEP</div>
                <p style={{ fontSize: 14, color: "#1e3a5f", lineHeight: 1.6, margin: 0 }}>{recommendation.nextStep}</p>
              </div>
              <a href={recommendation.official} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: CORAL, fontWeight: 700, fontSize: 14, textDecoration: "underline" }}>
                {recommendation.officialLabel || "Go to official registration portal →"}
              </a>
            </div>
            <div style={{ background: "#FFF8F0", border: "1px solid #fde8d8", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10 }}>
              <AlertCircle size={16} style={{ color: "#92400e", flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: "#92400e", margin: 0, lineHeight: 1.6 }}>This is general guidance only, not legal advice. A lawyer or accountant can review your specific situation before you commit to a structure.</p>
            </div>
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 6 }}>What grants can your new business access?</p>
              <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>Once registered, most Mauritian SMEs qualify for grants worth Rs 50,000–200,000. Find yours in 2 minutes.</p>
              <Link href="/grants" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CORAL, color: "#fff", padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Check grants I qualify for →
              </Link>
            </div>
            <EmailCapture source="/structure" message="Get notified when registration fees or business laws change." />
            <button onClick={restart} style={{ width: "100%", padding: "13px", background: "none", color: NAVY, border: "1.5px solid #e5e7eb", borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Start over with different answers
            </button>
          </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-200" style={{ padding: "16px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          © 2026 OuBiznes.mu ·{" "}
          <a href="mailto:contact@oubiznes.mu" style={{ color: CORAL, textDecoration: "underline" }}>Contact us</a>
        </p>
      </footer>
    </div>
  );
}
