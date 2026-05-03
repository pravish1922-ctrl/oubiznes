# SPAK Build Roadmap
**Updated:** May 3, 2026  
**Working hours:** 20:00–23:30 MU daily (~3.5 hours/night)  
**Token reset:** Every Wednesday 07:00 MU  
**Claude Code:** Used for building. This chat: strategy + architecture.

---

## THIS WEEK — May 3–10 (Tejo Week)

### Tuesday May 6 — Evening (20:00–23:30)
**No Claude needed — just you**
- Execute QA test plan on oubiznes.mu (spak-qa-testplan.html)
- Mark RAG statuses: OK / Good Enough / KO
- Add comments on each issue found
- Note all KO and GE items for Wednesday fix list
- Check WhatsApp at 07:00 — did morning brief arrive?
- Check cron-job.org — did QA Tester run at 09:00?

---

### Wednesday May 7 — Morning (07:00–10:30) — TOKEN RESET
**Claude Code session — ~75% tokens**

| Time | Task | Tokens | Notes |
|------|------|--------|-------|
| 07:00–07:45 | Fix all KO items from QA | ~15% | Fix list from Tuesday testing |
| 07:45–08:45 | SPAK Admin Dashboard MVP | ~25% | Pending approvals + agent health + platform metrics + password gate |
| 08:45–09:30 | SPAK Voice → PWA + Supabase memory sync | ~20% | Reads hot.md from Supabase on load. Works on phone. Password protected. |
| 09:30–10:00 | Deploy + test everything | ~10% | Verify dashboard, voice PWA on phone, all agents |
| 10:00–10:30 | npm run wiki-save | ~5% | Capture session |

**Wednesday Evening (20:00–23:30)**
- Tejo deck in Claude Code (pptx skill) — ~15% tokens
- Screenshots of each tool for slides
- Polish and review deck

---

### Thursday May 8 — Evening (20:00–23:30)
**No heavy Claude needed**
- Final deck polish
- Rehearse live demo flow (follow demo script)
- Test SPAK voice PWA on phone
- Install PWA on phone home screen
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
- Phone (SPAK voice PWA installed)
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
| Security scan (after Week 2 setup) | Monthly | 1 Claude Code session |

---

## LEARNING PLAN — In Parallel

| Topic | Resource | When |
|-------|----------|------|
| OWASP Top 10 | owasp.org/Top10 | Week 2 — commute reading |
| Supabase RLS | supabase.com/docs/guides/auth/row-level-security | Week 2 |
| Multi-agent architecture | CrewAI docs / LangGraph | Week 3 |
| Vercel Edge vs Serverless | vercel.com/docs/functions | Week 3 |
| Open source README best practices | github.com/othneildrew/Best-README-Template | Week 4 |

---

## ARCHITECTURE OVERVIEW

```
GitHub (source of truth)
    ↓
Vercel (deployment + 2 crons: briefing + regulatory-check)
    ↓
Supabase (memory, state, logs, agent registry)
    ↓
SPAK Agents (autonomous workers)
    ├── Agent 5: Daily Brief — Vercel 03:00 UTC daily
    ├── Regulatory Check — Vercel 04:00 UTC Monday
    ├── Agent 6 QA Tester — cron-job.org 09:00 MU daily
    ├── Agent 3 Grants Watchdog — cron-job.org Wednesday 09:00 MU
    ├── Agent 4 MRA Monitor — cron-job.org Thursday 09:00 MU
    └── Orchestrator — cron-job.org Monday 11:00 MU
    ↓
Twilio + Zoho (WhatsApp + email alerts to Pravish)
    ↓
SPAK Voice PWA (Pravish interface — phone + desktop)
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

---

## CRON SCHEDULE

| Schedule | Route | Platform | Purpose |
|----------|-------|----------|---------|
| 0 3 * * * | /api/spak/briefing | Vercel | Daily brief 07:00 MU |
| 0 4 * * 1 | /api/spak/regulatory-check | Vercel | Weekly regulatory Mon 08:00 MU |
| 0 9 * * * | /api/spak/qa-test | cron-job.org | Daily QA 09:00 MU |
| 0 9 * * 3 | /api/spak/grants-watchdog | cron-job.org | Grants Wed 09:00 MU |
| 0 9 * * 4 | /api/spak/mra-monitor | cron-job.org | MRA Thu 09:00 MU |
| 0 11 * * 1 | /api/spak/orchestrate | cron-job.org | Orchestrator Mon 11:00 MU |
| 0 12 * * * | /api/spak/email-reply | Vercel | Email reply check noon MU |

---

## TOOL STACK

| Tool | Purpose |
|------|---------|
| Claude.ai | Strategy + architecture (this chat) |
| Claude Code | Building — npm run wiki-save at end of each session |
| Vercel | Hosting + 2 cron jobs |
| Supabase | Shared database + memory |
| cron-job.org | 4 additional agent crons (free) |
| Twilio | WhatsApp alerts + reply webhook |
| Zoho Mail | Email briefings + IMAP reply |
| ElevenLabs | SPAK voice (Amelia — ZF6FPAbjXT4488VcRRnw) |
| Obsidian | Knowledge vault (wiki-save script) |
| cron-job.org account | spak@... (use existing ElevenLabs account) |

---

## DECISION LOG

| Decision | Choice | Reason |
|----------|--------|--------|
| All agents | Autonomous, search-first, URLs from Supabase | Never hardcode |
| wiki-save | npm run wiki-save — fully automatic | Zero friction |
| User accounts | Skip — business profile on /feedback | Simpler |
| Regulatory check | Vercel cron — cloud-based | No PC dependency |
| Approval channels | Email reply + WhatsApp reply both active | Redundancy |
| Extra crons | cron-job.org (free) | Hobby plan limit = 2 |
| SPAK voice | ElevenLabs Amelia — local HTML + Chrome | Zero deployment cost |
| Monetisation | Post-Tejo discussion | Partner input needed |
| SPAK identity | Co-founder, not assistant | Trillion energy |

---

## RESUME COMMAND (for next Claude Code session)

```
Resuming SPAK v6. Wednesday token reset. Priority order:
1. Fix QA KO items from Tuesday testing
2. SPAK Admin Dashboard MVP — pending approvals + agent health + metrics + password gate
3. SPAK Voice PWA — Supabase memory sync + phone install + password gate
4. Tejo deck (pptx)
All autonomous, URLs from Supabase, wiki-save at end.
```

---

*Last updated: May 3, 2026 — end of Day 1 SPAK v6 session*
