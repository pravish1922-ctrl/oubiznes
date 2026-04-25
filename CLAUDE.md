# CLAUDE.md — OuBiznes.mu Master Instructions
# Read this file at the start of EVERY session before touching any code.

## 1. PROJECT OVERVIEW
- **Site:** OuBiznes.mu — Free tools for Mauritian businesses
- **Stack:** Next.js 16.2, TypeScript, Tailwind CSS
- **Repo:** https://github.com/pravish1922-ctrl/oubiznes
- **Deploy:** Vercel (auto-deploys on push to master)
- **Local:** http://localhost:3000
- **Owner:** Pravish (pravish1922@gmail.com), Mauritius (UTC+4)

## 2. TOOLS ON THE SITE
1. Business Structure Advisor — `app/structure/`
2. BRN Lookup — `app/lookup/`
3. Business Plan Generator — `app/plan/` + `app/api/business/plan/route.ts`
4. Grants Finder — `app/grants/`
5. Grant Application Generator — `app/apply/`
6. Compliance Calendar — `app/calendar/`
7. VAT Calculator — `app/vat/`
8. PAYE Calculator — `app/paye/`

## 3. BRAND & DESIGN SYSTEM

### Colors
- Primary green: `#0F6E56`
- Primary green hover: `#0a5242`
- Dark navy (section headers): `#1a2332`
- Cream background: `#F5F0E8`
- Warning yellow background: `#FEF9C3` border `#FCD34D`
- Error red background: `#FEE2E2` border `#FCA5A5`
- Success green background: `#D1FAE5`

### Typography
- Font: System sans-serif stack
- Headings: Bold, dark
- Body: Regular weight, good line height

### Buttons
- Primary action: solid green `#0F6E56`, white text
- Secondary action: white background, green `#0F6E56` border and text
- Destructive: red background
- Disabled: grey, cursor not allowed
- NEVER use two primary green buttons side by side

### Cards & Sections
- Section header bars: dark navy `#1a2332`, white text, padding 12px 16px
- Card body: white background, subtle border, rounded corners
- Spacing between sections: 16px minimum

## 4. UI/UX RULES — APPLY TO ALL TOOLS
These rules are NON-NEGOTIABLE and must be applied everywhere:

### Warnings & Validation
- ALL warnings appear at the TOP of the form step — NEVER below a button
- Yellow box = important notice (user should know before proceeding)
- Red box = error or blocking issue (must fix before proceeding)
- Green box = success confirmation
- Disclaimers always appear BEFORE action buttons, never after

### Form Validation Rules (apply to ALL forms site-wide)
- Number fields must reject non-numeric input
- Number fields must have minimum value validation (e.g. Rs cannot be negative)
- Required fields must show clear error if empty on submit attempt
- If a number field receives text/junk, show: "Please enter a valid number"
- If startup cost or revenue < Rs 10,000 in Business Plan: show red warning
- Date fields must validate proper date format
- Text fields for names must reject numbers-only input
- All validation triggers on blur (leaving field) AND on submit attempt
- Never allow form submission with invalid data

### Step-by-step wizards
- Progress indicator always visible at top
- Current step clearly highlighted
- Cannot proceed to next step with invalid/empty required fields
- Back button always available
- Reset button always available

### Disclaimers & Legal
- Every tool with calculated output must show: "This is an estimate. Always verify with a qualified professional or official source."
- Source and effective date must be shown for all regulatory figures
- MRA figures must show: "Based on MRA rules effective [date]. Verify at mra.mu"

## 5. MAURITIUS REGULATORY DATA (Verified April 2026)

### VAT
- Standard rate: 15%
- Registration threshold: Rs 3 million/year (Finance Act 2025, effective 1 Oct 2025)
- Filing: Quarterly if turnover ≤ Rs 10M / Monthly if above
- Return due: 20 days after end of period
- Source: mra.mu

### PAYE / CSG / NSF (2025/26)
- PAYE bands: 0% first Rs 500,000/year, 10% next Rs 500,000, 20% above
- CSG Employee: 1.5% (basic ≤ Rs 50,000) / 3% (basic > Rs 50,000)
- CSG Employer: 3% (basic ≤ Rs 50,000) / 6% (basic > Rs 50,000)
- NSF Employee: 1% (capped at published ceiling ~Rs 28,570/month)
- NSF Employer: 2.5% (capped)
- HRDC Training Levy: 1.5% of basic (employer only)
- All contributions due: end of following month
- Source: mra.mu, effective 1 July 2025

### Minimum Wage (2025/26)
- National minimum wage: Rs 16,500/month
- Always validate PAYE inputs against minimum wage

## 6. API & ENVIRONMENT

### Keys in .env.local (never commit to GitHub)
- `ANTHROPIC_API_KEY` — Anthropic Claude API
- `GEMINI_API_KEY` — Google Gemini (primary for Business Plan)
- `OPENROUTER_API_KEY` — OpenRouter (tested, unreliable free tier)

### AI Model Strategy
- Business Plan Generator primary: `gemini-2.5-flash`
- Business Plan Generator fallback: `gemini-3.1-flash-lite-preview`
- All AI prompts must include: "Never use placeholder brackets like [Business Name]. Use actual provided values or write 'to be confirmed by the owner'. Never invent data not provided."

### Vercel Environment Variables
- `GEMINI_API_KEY` must be set in Vercel dashboard
- `ANTHROPIC_API_KEY` must be set in Vercel dashboard
- Never rely on .env.local for production

## 7. AGENT ARCHITECTURE (TO BUILD)

### Agent 5 — Regulatory Update Agent (BUILD FIRST)
- Runs monthly
- Checks MRA, SMEDA, DBM, EDB official sources
- Updates regulatory constants in codebase
- Logs: what changed, when, source URL
- Protects platform legally

### Agent 1 — Onboarding Agent
- Builds persistent business profile on first visit
- All tools pre-fill from this profile

### Agent 2 — Compliance Guardian
- Monitors deadlines, sends proactive alerts
- Pre-calculates amounts due

### Agent 3 — Finance Co-pilot
- End-to-end VAT, PAYE, payslips, invoices

### Agent 4 — Grant Hunter
- Monitors new grants, auto-matches, tracks applications

## 8. TESTING RULES (for Claude in Chrome)
When testing any tool, always check:
1. Enter text in number fields — must be rejected
2. Enter negative numbers — must be rejected
3. Enter Rs 1 or Rs 0 in financial fields — must show warning
4. Leave required fields empty and try to submit — must be blocked
5. Enter junk/random text in text fields — must show validation error
6. Check all warnings appear ABOVE form fields, not below buttons
7. Check all disclaimers appear before action buttons
8. Verify correct MRA figures match Section 5 of this file
9. Test on mobile viewport (375px width)
10. Test Download buttons produce valid non-empty files

## 9. CLAUDE TOOL ROLES

### Claude (claude.ai) — Strategic Brain
- Planning, architecture, research, decisions
- Reviews screenshots and audit results
- Gives precise instructions for Claude Code

### Claude Code (VS Code) — Builder
- Reads this CLAUDE.md before every task
- Writes and edits code files directly
- Runs terminal commands
- Never makes design decisions without checking Section 3-4

### Claude in Chrome — Tester
- Runs through complete user flows
- Validates all 10 testing rules above on every tool
- Reports bugs with exact location and description

### Claude Cowork — Agent Orchestrator
- Manages autonomous agents once built
- Runs scheduled tasks (Regulatory Update Agent)

## 10. COMMIT STANDARDS
Format: `[tool/area]: description of change`
Examples:
- `fix(paye): correct CSG employer rate to 3%/6% per MRA 2025/26`
- `feat(plan): add sectioned output with Download for Bank button`
- `fix(forms): add numeric validation to all financial input fields`
- `docs: update CLAUDE.md with MRA VAT threshold change`

Always commit .env.local to .gitignore — never push API keys.

## 11. PENDING WORK (as of 25 April 2026)
- [ ] BRN Lookup: show business activity field, add "Is this your business?" flow
- [ ] Compliance Calendar: full review and dynamic population
- [ ] Grants Finder: full review, document checklist, official source links
- [ ] Form validation: add numeric validation to ALL tool forms site-wide
- [ ] Agent 5 (Regulatory Update): build first
- [ ] Agent 1 (Onboarding): build second
- [ ] Agents 2, 3, 4: build in order
- [ ] CLAUDE.md: keep Section 5 updated whenever MRA rules change
