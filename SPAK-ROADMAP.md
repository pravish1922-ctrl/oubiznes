# SPAK Build Roadmap
**Updated:** May 4, 2026 — End of Day 2  
**Working hours:** 20:00–23:30 MU daily (~3.5 hours/night)  
**Token reset:** Every Wednesday 07:00 MU  
**Claude Code:** Used for building. This chat: strategy + architecture.

---

## DECISIONS LOG — May 4, 2026

| Decision | Choice | Reason |
|----------|--------|--------|
| WhatsApp notifications | Replace with PWA push notifications | Free, native, no Meta approval needed |
| Twilio | Deprecate after PWA push is stable | Zero cost, zero bureaucracy |
| WhatsApp Business number | Park post-Tejo | Not needed if PWA push works |
| Regulatory 13 unverified | Bug — must fix Wednesday | Agent should search autonomously even when direct URL blocked by Cloudflare |
| Grants Watchdog 500 error | Bug — fix Wednesday | Crashes at startup, no outgoing requests made |
| MRA Monitor 500 error | Bug — fix Wednesday | Crashes at startup in 12ms |
| Twilio sandbox | Keep for now (rejoin every 72h: "join may-shape" to +14155238886) | Free fallback until PWA push ready |
| cron-job.org auth | Fixed — was wrong CRON_SECRET format | Now returning 200 on Orchestrator + QA Tester |
| Morning brief timing | Brief fires correctly — WhatsApp sandbox had expired | Rejoin sandbox fixes it |

---

## KNOWN BUGS — Fix Wednesday

| Bug | Symptom | Priority |
|-----|---------|----------|
| Grants Watchdog 500 | Crashes at startup, no outgoing requests | High |
| MRA Monitor 500 | Crashes in 12ms, no outgoing requests | High |
| Regulatory 13 unverified | Agent not searching autonomously when Cloudflare blocks direct URL | High |
| WhatsApp sandbox expiry | Must rejoin every 72h ("join may-shape") | Medium — replaced by PWA push |

---

## THIS WEEK — May 4–10 (Tejo Week)

### Tuesday May 6 — Evening (20:00–23:30)
**No Claude needed — just you**
- Execute QA test plan on oubiznes.mu (spak-qa-testplan.html)
- Mark RAG statuses: OK / Good Enough / KO
- Add comments on each issue found
- Note all KO and GE items for Wednesday fix list
- Check WhatsApp at 07:00 — did morning brief arrive? (sandbox rejoined ✅)
- Check cron-job.org — QA Tester and Orchestrator now returning 200 ✅

---

### Wednesday May 7 — Morning (07:00–10:30) — TOKEN RESET
**Claude Code session — ~75% tokens**

| Priority | Task | Tokens | Notes |
|----------|------|--------|-------|
| 1 | Fix Grants Watchdog 500 error | ~10% | Crashes at startup — check watched_pages query + imports |
| 2 | Fix MRA Monitor 500 error | ~10% | Same pattern as Grants Watchdog |
| 3 | Fix Regulatory autonomous search | ~10% | Should search via DuckDuckGo when Cloudflare blocks direct URL |
| 4 | Fix QA KO items from Tuesday testing | ~10% | Fix list from Tuesday |
| 5 | SPAK Admin Dashboard MVP | ~20% | Pending approvals + agent health + platform metrics + password gate |
| 6 | SPAK Voice → PWA + Supabase memory sync + push notifications + password gate | ~20% | One install = voice + dashboard + notifications on iPhone |
| 7 | npm run wiki-save | ~5% | Capture session |

**Wednesday Evening (20:00–23:30)**
- Tejo deck in Claude Code (pptx skill) — ~15% tokens
- Screenshots of each tool for slides
- Polish and review deck

---

### Thursday May 8 — Evening (20:00–23:30)
**No heavy Claude needed**
- Final deck polish
- Rehearse live demo flow (follow demo script)
- Test SPAK voice PWA on iPhone 13 Pro
- Install PWA on phone home screen
- Test push notifications firing
- Run through Tejo talking points

---

### Friday May 9 — Evening
- Final prep
- Rest
- Charge phone

---

### Saturday May 10 — TEJO MEETING
**Bring:**
- Laptop (oubiznes.mu live demo)
- iPhone (SPAK voice PWA installed + push notifications active)
- Deck open and ready on slide 1
- cron-job.org dashboard on standby (proof agents run)
- Supabase agent_runs on standby (proof SPAK logs)

---

## WEEK 2 — May 12–18 | Security + SEO + Documentation

### Monday May 12 — Evening
**No Claude — repo setup only**
- Add AgriciDaniel cybersecurity skill to Claude Code
- Add everything-claude-code instincts if not already active
- Read OWASP Top 10 during commute
- Apply for WhatsApp Business number via Twilio (optional — only if PWA push has issues)

### Wednesday May 14 — TOKEN RESET — Claude Code session (~80% tokens)

| Task | Tokens | Output |
|------|--------|--------|
| Security audit — full codebase (AgriciDaniel) | ~20% | List of vulnerabilities |
| Fix critical security findings | ~20% | Hardened API routes, RLS, rate limiting |
| SEO — meta tags, Open Graph, sitemap.xml, JSON-LD | ~20% | Discoverable on Google |
| Documentation — README, ARCHITECTURE.md, AGENTS.md | ~15% | Full project reference |
| npm run wiki-save | ~5% | Session captured |

### Thursday–Friday evenings
- Review security fixes
- Submit sitemap to Google Search Console
- Read Supabase RLS documentation
- Deprecate Twilio if PWA push notifications confirmed stable

---

## WEEK 3 — May 19–25 | SPAK Architecture Evolution

### Wednesday May 21 — TOKEN RESET — Claude Code session (~80% tokens)

| Task | Tokens | Output |
|------|--------|--------|
| Agent 6 v2 — functional tests with real data | ~25% | QA agent submits real inputs, checks output quality |
| everything-claude-code instincts — full setup | ~15% | Claude Code reasons better before writing code |
| Paperclip orchestrator v2 — agent registry in Supabase | ~25% | Agents self-register, orchestrator loops all projects |
| npm run wiki-save | ~5% | Session captured |

### Evening sessions that week
- Monitor agents in cron-job.org
- Review agent_runs table patterns
- Note what orchestrator v2 should prioritise

---

## WEEK 4 — May 26 – June 1 | Growth Tools + PR

**Depends on Tejo outcome:**

### If Tejo is on board:

| Task | Tokens | Notes |
|------|--------|-------|
| AI TikTok Creator tool | ~30% | First voting winner |
| PR strategy execution | ~10% | Tejo's network + social |
| Monetisation setup | ~20% | Stripe or simple payment gate |
| SPAK agents for MoDodoSoul | ~20% | Expand SPAK beyond OuBiznes |

### If Tejo not on board:

| Task | Tokens | Notes |
|------|--------|-------|
| AI TikTok Creator tool | ~30% | Build it anyway — highest votes |
| SEO-driven organic PR | ~15% | Blog posts, social content |
| Website Builder tool v1 | ~30% | Second voting winner |

---

## ONGOING HABITS — Every Week

| Habit | When | Time |
|-------|------|------|
| QA test plan review | Tuesday evening | 30 min |
| wiki-save after every Claude Code session | End of session | 2 min |
| Check agent_runs in Supabase | Monday morning | 5 min |
| Check cron-job.org history | Monday morning | 5 min |
| Morning brief check | Every day 07:00 MU | 2 min |
| Rejoin Twilio sandbox (until PWA push ready) | Every 72h — "join may-shape" to +14155238886 | 30 sec |
| Security scan (after Week 2 setup) | Monthly | 1 Claude Code session |

---

## NOTIFICATION ARCHITECTURE — Evolution

### Current (Sandbox phase):
```
SPAK agents → Twilio sandbox → WhatsApp (expires every 72h)
SPAK agents → Zoho Mail → Email ✅ working
```

### Target (PWA phase — Wednesday):
```
SPAK agents → Supabase → Supabase webhook → Push notification → iPhone PWA
Tap notification → Opens SPAK dashboard → One-click approve/ignore
```

### Cost comparison:
| Method | Monthly cost | Reliability |
|--------|-------------|-------------|
| Twilio WhatsApp Business | ~$1.70 | High |
| Twilio sandbox | Free | Low (72h expiry) |
| PWA push notifications | Free | High |

---

## PWA ARCHITECTURE — Wednesday Build

**One install covers everything:**
- SPAK Voice interface (Amelia — ElevenLabs)
- SPAK Admin Dashboard
- Push notifications for all agent alerts
- Password protected
- Works on iPhone 13 Pro (iOS 16.4+ ✅)
- Installs to home screen — feels like native app

**Notification types:**
- 🔔 Daily brief ready
- 🔔 Regulatory change detected
- 🔔 QA test failing
- 🔔 New grant found
- 🔔 Pending approval requires action

---

## ARCHITECTURE OVERVIEW

```
GitHub (source of truth)
    ↓
Vercel (deployment + 2 crons: briefing + regulatory-check)
    ↓
Supabase (memory, state, logs, agent registry, push subscriptions)
    ↓
SPAK Agents (autonomous workers)
    ├── Agent 5: Daily Brief — Vercel 03:00 UTC daily
    ├── Regulatory Check — Vercel 04:00 UTC Monday
    ├── Agent 6 QA Tester — cron-job.org 09:00 MU daily ✅ 200 OK
    ├── Agent 3 Grants Watchdog — cron-job.org Wednesday 09:00 MU ❌ 500 (fix Wed)
    ├── Agent 4 MRA Monitor — cron-job.org Thursday 09:00 MU ❌ 500 (fix Wed)
    └── Orchestrator — cron-job.org Monday 11:00 MU ✅ 200 OK
    ↓
Supabase webhook → PWA Push Notifications (replacing Twilio)
    ↓
SPAK PWA on iPhone (voice + dashboard + notifications)
    ↓
Claude Code + Obsidian (build loop — wiki-save after every session)
```

---

## SUPABASE TABLES

| Table | Purpose | Status |
|-------|---------|--------|
| regulatory_rates | MRA rates + change detection | ✅ 13 records |
| feature_votes | Homepage voting with email gate | ✅ Live |
| subscribers | Email signups + unsubscribe | ✅ Live |
| business_profiles | SME profile capture from /feedback | ✅ Live |
| tool_suggestions | New tool ideas from /feedback | ✅ Live |
| agent_runs | Agent execution log + approvals | ✅ Live |
| morning_briefings | Daily brief history | ✅ Live |
| projects | SPAK project registry | ✅ Live |
| spak_status | Platform health | ✅ Live |
| email_subscribers | Legacy email capture | ✅ Live |
| watched_pages | URLs for Agents 3 + 4 to monitor | ✅ 5 records seeded |
| push_subscriptions | PWA push notification registrations | 🔜 Wednesday |

---

## CRON SCHEDULE

| Schedule | Route | Platform | Status | Purpose |
|----------|-------|----------|--------|---------|
| 0 3 * * * | /api/spak/briefing | Vercel | ✅ Working | Daily brief 07:00 MU |
| 0 4 * * 1 | /api/spak/regulatory-check | Vercel | ✅ 401 protected | Weekly regulatory Mon 08:00 MU |
| 0 9 * * * | /api/spak/qa-test | cron-job.org | ✅ 200 OK | Daily QA 09:00 MU |
| 0 9 * * 3 | /api/spak/grants-watchdog | cron-job.org | ❌ 500 fix Wed | Grants Wed 09:00 MU |
| 0 9 * * 4 | /api/spak/mra-monitor | cron-job.org | ❌ 500 fix Wed | MRA Thu 09:00 MU |
| 0 11 * * 1 | /api/spak/orchestrate | cron-job.org | ✅ 200 OK | Orchestrator Mon 11:00 MU |
| 0 12 * * * | /api/spak/email-reply | Vercel | ✅ Live | Email reply check noon MU |

---

## TOOL STACK

| Tool | Purpose | Status |
|------|---------|--------|
| Claude.ai | Strategy + architecture (this chat) | ✅ Active |
| Claude Code | Building — npm run wiki-save at end of each session | ✅ Active |
| Vercel | Hosting + 2 cron jobs | ✅ Active |
| Supabase | Shared database + memory | ✅ Active |
| cron-job.org | 4 additional agent crons (free) | ✅ Active |
| Twilio | WhatsApp sandbox (temporary) | ⚠️ Sandbox only — deprecating |
| Zoho Mail | Email briefings + IMAP reply | ✅ Active |
| ElevenLabs | SPAK voice — Amelia (ZF6FPAbjXT4488VcRRnw) | ✅ Active |
| Obsidian | Knowledge vault (wiki-save script) | ✅ Active |
| PWA Push | Replace Twilio — free, native | 🔜 Wednesday |

---

## LEARNING PLAN — In Parallel

| Topic | Resource | When |
|-------|----------|------|
| OWASP Top 10 | owasp.org/Top10 | Week 2 — commute reading |
| Supabase RLS | supabase.com/docs/guides/auth/row-level-security | Week 2 |
| Multi-agent architecture | CrewAI docs / LangGraph | Week 3 |
| Vercel Edge vs Serverless | vercel.com/docs/functions | Week 3 |
| Open source README best practices | github.com/othneildrew/Best-README-Template | Week 4 |
| PWA push notifications | web.dev/push-notifications | After Wednesday build |

---

## RESUME COMMAND (for next Claude Code session)

```
Resuming SPAK v6. Wednesday token reset. Priority order:
1. Fix Grants Watchdog 500 — crashes at startup, check watched_pages query
2. Fix MRA Monitor 500 — same pattern
3. Fix Regulatory autonomous search — should use DuckDuckGo when Cloudflare blocks
4. Fix QA KO items from Tuesday testing
5. SPAK Admin Dashboard MVP — pending approvals + agent health + metrics + password gate
6. SPAK Voice PWA — Supabase memory sync + push notifications + iPhone install + password gate
7. Tejo deck (pptx)
All autonomous, URLs from Supabase, wiki-save at end.
```

---

*Last updated: May 4, 2026 — Day 2 SPAK v6*
