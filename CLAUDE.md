# CLAUDE.md — OuBiznes.mu Master Instructions v6
# Read this file at the start of EVERY session before touching any code.
#
# Changelog
# v6 (May 2026): Supabase live + all tables applied, SPAK morning briefing agent live,
#   Vercel Cron configured (0 3 * * * → /api/spak/briefing), home page redesigned to
#   2×2 grid, Coming Next voting section added (Supabase-backed), SPAK footer bar added,
#   Twilio WhatsApp wired and verified, CRON_SECRET protection added.
# v5 (May 2026): SPAK autonomous operator scaffolded — Supabase schema, morning briefing
#   script, WhatsApp+email via lib/notify.mjs, API routes for subscribe/votes/status.
# v4 (Apr 2026): BRN Lookup fully completed — PDF enrichment via unpdf, MNS registry link.
# v3.1 (Apr 2026): Compliance Calendar fixes, form validation across all tools.

## 1. PROJECT OVERVIEW
- **Site:** OuBiznes.mu — Free tools for Mauritian businesses
- **Stack:** Next.js 16.2, TypeScript, Tailwind CSS
- **Repo:** https://github.com/pravish1922-ctrl/oubiznes
- **Deploy:** Vercel (auto-deploys on push to master)
- **Local:** http://localhost:3000
- **Owner:** Pravish (pravish1922@gmail.com), Mauritius (UTC+4)

## 2. TOOLS ON THE SITE
1. Business Structure Advisor — `app/structure/`
2. BRN Lookup — `app/lookup/` + `app/api/companies/detail/route.ts`
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

### Form Validation Rules (apply to ALL forms site-wide) ✅ IMPLEMENTED d672ecb
- Number fields must reject non-numeric input
- Number fields must have minimum value validation (e.g. Rs cannot be negative)
- Required fields must show clear error if empty on submit attempt
- If a number field receives text/junk, show: "Please enter a valid number"
- If startup cost or revenue < Rs 10,000 in Business Plan: show red warning
- Date fields must validate proper date format
- Text fields for names must reject numbers-only input
- All validation triggers on blur (leaving field) AND on submit attempt
- Never allow form submission with invalid data

### Validation implementation per tool (commit d672ecb)
| File | Fields validated |
|---|---|
| `app/vat/page.jsx` | `amount` (1 field) |
| `app/paye/page.jsx` | `basic`, `travelling`, `telecommuting`, `other` (4 fields) + min wage warning |
| `app/plan/page.jsx` | `startupCost`, `year1Revenue`, `fundingAmount`, `employees` (4 fields) |
| `app/grants/page.jsx` | None — fully button-based |
| `app/structure/page.jsx` | None — fully button-based |
| `app/calendar/page.jsx` | None — read-only display |

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
- `SMTP_HOST` — Zoho SMTP (smtp.zoho.com)
- `SMTP_PORT` — Zoho SMTP (465)
- `SMTP_USER` — Zoho SMTP (contact@oubiznes.mu)
- `SMTP_PASS` — Zoho App Password
- `REGULATORY_EMAIL_TO` — alert recipient (contact@oubiznes.mu)
- `SUPABASE_URL` — from supabase.com dashboard (Settings → API)
- `SUPABASE_ANON_KEY` — public anon key (safe to expose to browser via API routes)
- `SUPABASE_SERVICE_ROLE_KEY` — secret, server-side only (scripts + API routes)
- `TWILIO_ACCOUNT_SID` — from console.twilio.com
- `TWILIO_AUTH_TOKEN` — from console.twilio.com
- `TWILIO_WHATSAPP_FROM` — sandbox: whatsapp:+14155238886
- `OPERATOR_WHATSAPP` — your WhatsApp number: whatsapp:+2305XXXXXXX
- `CRON_SECRET` — any strong random string; set in Vercel dashboard; Vercel sends it as `Authorization: Bearer` header when triggering cron jobs

### AI Model Strategy
- Business Plan Generator primary: `gemini-2.5-flash`
- Business Plan Generator fallback: `gemini-3.1-flash-lite-preview`
- All AI prompts must include: "Never use placeholder brackets like [Business Name]. Use actual provided values or write 'to be confirmed by the owner'. Never invent data not provided."

### Vercel Environment Variables
- `GEMINI_API_KEY` must be set in Vercel dashboard
- `ANTHROPIC_API_KEY` must be set in Vercel dashboard
- `CRON_SECRET` must be set in Vercel dashboard (generate with: `openssl rand -hex 32`)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` must be set in Vercel dashboard
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` must be set in Vercel dashboard
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `OPERATOR_WHATSAPP` must be set in Vercel dashboard
- Never rely on .env.local for production

## 7. BRN LOOKUP — ARCHITECTURE (completed April 2026)

### How it works
1. User searches by name or BRN → POST to MNS `onlinesearch.mns.mu/onlinesearch/company`
2. Results returned with `orgNo` per company
3. User clicks result → GET `app/api/companies/detail?orgNo={orgNo}`
4. Detail route fetches PDF from `printCompanyDetails?orgNo={orgNo}`
5. PDF parsed with `unpdf` (serverless-safe, WASM-based)
6. Returns: `registeredAddress`, `natureOfBusiness[]`, `officeBearers[]`
7. Frontend displays 3 enriched sections: REGISTERED ADDRESS, BUSINESS ACTIVITIES, DIRECTORS & OFFICERS

### Key technical decisions
- Use `unpdf` NOT `pdf-parse` — pdf-parse crashes Vercel serverless at module load time
- `unpdf` uses WASM internally, no native bindings, works on Vercel
- `serverExternalPackages` in `next.config.js` not needed for unpdf
- `viewCompanyDetails` endpoint requires Cloudflare Turnstile — NOT usable server-side
- `printCompanyDetails` endpoint returns PDF — parseable via unpdf
- "View on official registry" links to `https://onlinesearch.mns.mu` (root URL — Angular app does not support deep links)

### Key commits
- `d5e2f18` — feat(lookup): company detail enrichment
- `72eebc4` — fix(lookup): swap pdf-parse for unpdf
- `a215a1d` — fix(lookup): correct MNS registry link to root URL

## 8. SPAK — AUTONOMOUS OPERATOR (live May 2026)

SPAK is the autonomous infrastructure layer. One Supabase database serves all projects.

### Supabase — LIVE
- **Project URL:** `https://ftpqluqkihmvnfxxtixc.supabase.co`
- **Schema file:** `supabase/schema.sql` (already applied — do NOT re-run unless resetting)
- **Dashboard:** supabase.com → oubiznes project → Table Editor

### Supabase Tables
| Table | Purpose | Key columns |
|---|---|---|
| `projects` | Registry of projects sharing this DB | `id` (e.g. `'oubiznes'`), `name`, `url` |
| `email_subscribers` | Email signups from home page strip | `project`, `email`, `source`, `confirmed`, `created_at` |
| `feature_votes` | Coming Next votes, one row per vote | `project`, `feature_id`, `fingerprint` (dedup), `created_at` |
| `agent_runs` | Log of every agent execution | `project`, `agent_name`, `run_at`, `status`, `summary`, `details` (jsonb), `flags_count` |
| `spak_status` | Latest health check written by briefing agent | `project`, `checked_at`, `all_tools_up`, `tools_up`, `tools_total`, `status_line`, `details` |
| `morning_briefings` | Daily briefing archive, one row per date | `project`, `briefing_date`, `content_text`, `stats` (jsonb), `sent_whatsapp`, `sent_email` |

### RLS Policies
- `email_subscribers`, `feature_votes`: anon INSERT allowed (no login required), service_role full access
- `spak_status`: anon SELECT allowed (home page footer reads it), service_role full access
- `agent_runs`, `morning_briefings`: service_role only

### Twilio WhatsApp — LIVE
1. Sandbox active at console.twilio.com
2. From phone: join code sent to +1 415 523 8886 ✓
3. TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP set in Vercel + .env.local

### SPAK Files
| File | Purpose |
|---|---|
| `supabase/schema.sql` | Full DB schema — apply once in Supabase |
| `lib/supabase.mjs` | Shared Supabase client (service role, scripts only) |
| `lib/notify.mjs` | sendEmail() + sendWhatsApp() + notify() |
| `scripts/spak-briefing.mjs` | Morning briefing agent |
| `app/api/subscribe/route.ts` | POST — saves email to Supabase |
| `app/api/votes/route.ts` | GET counts / POST vote (fingerprint dedup) |
| `app/api/spak/status/route.ts` | GET latest status line for footer |
| `app/api/spak/briefing/route.ts` | GET — Vercel Cron handler (protected by CRON_SECRET) |
| `vercel.json` | Cron schedule: 0 3 * * * (03:00 UTC = 07:00 MU) |

### Morning Briefing — npm run spak-briefing
- Checks site health (4 endpoints)
- Fetches subscriber count, new subscribers 24h, vote tallies
- Gets last regulatory check status from agent_runs
- Calculates next compliance deadline
- Sends WhatsApp message + email
- Writes to morning_briefings + spak_status in Supabase

### Windows Task Scheduler — Daily 07:00 MU time
```
Action: cmd /c "cd /d C:\Users\conta\OneDrive\Documents\oubiznes && npm run spak-briefing"
Trigger: Daily at 07:00
```

### Morning Briefing Format (WhatsApp)
```
*SPAK Morning Brief — Thu 1 May*

📧 Subscribers: 47 (+3 new)
🗳️  Top vote: Website Builder (12 votes)
🟢 Site health: All 4 checks passed
📋 Regulatory: ✓ success (28 Apr)
⏰ Next deadline: PAYE/CSG due in 30 days (31 May)

_OuBiznes.mu — Powered by SPAK_
```

## 9. AGENT ARCHITECTURE

### Agent 5 — Regulatory Update Agent ✅ BUILT (commit 2456756)
- Script: `scripts/regulatory-check.mjs`
- Runs: weekly every Monday at 08:00 via Windows Task Scheduler
- Checks: 4 MRA/HRDC source pages + 14 stored regulatory values
- Email: Zoho SMTP, contact@oubiznes.mu → contact@oubiznes.mu
- Log: `logs/regulatory/YYYY-MM-DD.json`
- Run manually: `npm run regulatory-check`
- Also run manually after national budget each June

### Agent 6 — QA Tester Agent (TO BUILD — priority 5)
- Script: `scripts/qa-test.mjs`
- Trigger: ON COMMAND — `npm run qa-test` (not scheduled)
- Run after: any batch of tool changes, before Vercel deploy, after national budget
- Uses: Claude in Chrome to open each tool and run all 10 testing rules from §9
- Tests all 8 tools: vat, paye, plan, grants, structure, calendar, lookup, apply
- Log: `logs/qa/YYYY-MM-DD-HH.json` (pass/fail per tool per rule)
- Email: full report to contact@oubiznes.mu via Zoho SMTP

### Agent 1 — Onboarding Agent (TO BUILD — priority 7)
- Builds persistent business profile on first visit
- All tools pre-fill from this profile

### Agent 2 — Compliance Guardian (TO BUILD — priority 8)
### Agent 3 — Grants Watchdog (TO BUILD — priority 8)
### Agent 4 — Grant Hunter (TO BUILD — priority 8)

## 10. TESTING RULES
When testing any tool (use Claude in Chrome for full site audit after each batch of changes):
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

### Claude in Chrome — site-wide QA
Run after each batch of tool changes to test all rules above across all 8 tools in one session.
Once Agent 6 is built, replace manual Claude in Chrome runs with `npm run qa-test`.

## 11. CLAUDE TOOL ROLES

### Claude (claude.ai) — Strategic Brain
- Planning, architecture, research, decisions
- Reviews screenshots and audit results
- Gives precise instructions for Claude Code

### Claude Code (VS Code) — Builder
- Reads this CLAUDE.md before every task
- Writes and edits code files directly
- Runs terminal commands
- Never makes design decisions without checking Section 3-4

### Claude in Chrome — Tester (interim — replaced by Agent 6 once built)
- Runs through complete user flows
- Validates all 10 testing rules above on every tool
- Reports bugs with exact location and description
- Run on-demand after each batch of changes

### Claude Cowork — Agent Orchestrator
- Manages autonomous agents once built
- Runs scheduled tasks (Regulatory Update Agent)

## 12. COMMIT STANDARDS
Format: `[tool/area]: description of change`
Examples:
- `fix(paye): correct CSG employer rate to 3%/6% per MRA 2025/26`
- `feat(lookup): company detail enrichment — address, activities, directors from PDF`
- `fix(forms): add numeric validation to all financial input fields`
- `docs: update CLAUDE.md with MRA VAT threshold change`

Always commit .env.local to .gitignore — never push API keys.

## 13. PENDING WORK (as of 1 May 2026)

### Done ✅
- [x] Agent 5 — Regulatory Update Agent (commit 2456756)
- [x] Form validation — numeric validation across all tool forms (commit d672ecb)
- [x] BRN Lookup — company detail enrichment, unpdf, registry link (commits d5e2f18→a215a1d)
- [x] Compliance Calendar — month offsets, HRDC, filters, ICS, disclaimer (commit 11d310f)
- [x] Home page — 2×2 grid redesign, Coming Next voting, email strip, SPAK footer (commit 2e5cc6a)
- [x] SPAK — Supabase schema, morning briefing script, WhatsApp+email, API routes (446abfc)
- [x] Vercel Cron — /api/spak/briefing at 0 3 * * *, CRON_SECRET protection (4ef90e4)
- [x] Supabase live — all 6 tables applied, env vars set in Vercel + .env.local
- [x] SPAK briefing agent live — email confirmed working, WhatsApp wired via Twilio sandbox
- [x] Twilio WhatsApp — sandbox active, join code sent, env vars in Vercel
- [x] Home page voting — backed by Supabase feature_votes table, fingerprint dedup
- [x] Email subscribe strip — backed by Supabase email_subscribers, Formspree removed

### Next up 🔜
- [ ] Task Scheduler — add `npm run spak-briefing` daily at 07:00 on Windows (~10 min)
- [ ] Grants Finder — full review, document checklist, official source links (~2 hours)
- [ ] Claude in Chrome — full site QA across all 8 tools (~1 hour)
- [ ] Agent 6 — QA Tester (`npm run qa-test`, on-command, ~2–3 hours)
- [ ] Agent 1 — Onboarding Agent — persistent business profile, pre-fill all tools (~4–5 hours)
- [ ] Agents 2, 3, 4 — Compliance Guardian, Grants Watchdog, Grant Hunter (~3–4 hours each)
- [ ] CLAUDE.md §5 — update whenever MRA rules change (budget June 2026)

## 14. PRIORITY ORDER (as of 1 May 2026)
| Priority | Item | Estimate |
|---|---|---|
| 1 | Task Scheduler — spak-briefing daily | 10 min |
| 2 | Grants Finder — full review + doc checklist | 2 hours |
| 3 | Claude in Chrome — full site QA | 1 hour |
| 4 | Agent 6 — QA Tester automated | 2–3 hours |
| 5 | Agent 1 — Onboarding Agent | 4–5 hours |
| 6 | Agents 2, 3, 4 — in order | 3–4 hours each |

Total remaining to solid v1: ~12–15 hours across 5–7 sessions.
