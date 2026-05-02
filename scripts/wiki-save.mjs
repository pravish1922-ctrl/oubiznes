#!/usr/bin/env node
/**
 * wiki-save — auto-generate a session note for the oubiznes vault
 *
 * 1. Reads today's git commits
 * 2. Determines next session number for today
 * 3. Writes obsidian-vault/wiki/sessions/YYYY-MM-DD-session-N.md
 * 4. Overwrites obsidian-vault/wiki/hot.md with latest context
 * 5. Prints confirmation
 */

import { execSync }                                                from 'child_process';
import { writeFileSync, mkdirSync, readdirSync, existsSync }      from 'fs';
import { join, dirname }                                           from 'path';
import { fileURLToPath }                                           from 'url';

const __dirname   = dirname(fileURLToPath(import.meta.url));
const ROOT        = join(__dirname, '..');
const SESSIONS_DIR = join(ROOT, 'obsidian-vault', 'wiki', 'sessions');
const HOT_MD      = join(ROOT, 'obsidian-vault', 'wiki', 'hot.md');

function sh(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf-8' }).trim(); }
  catch { return ''; }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function nextSessionNumber(dateStr) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  const prefix   = `${dateStr}-session-`;
  const existing = existsSync(SESSIONS_DIR)
    ? readdirSync(SESSIONS_DIR).filter(f => f.startsWith(prefix))
    : [];
  return existing.length + 1;
}

function getCommits(dateStr) {
  const since = `${dateStr}T00:00:00`;
  const until  = `${dateStr}T23:59:59`;
  const log    = sh(`git log --oneline --since="${since}" --until="${until}" --format="%h %s"`);
  return log ? log.split('\n').filter(Boolean) : [];
}

function buildSessionNote(dateStr, n, commits) {
  const ts          = new Date().toISOString();
  const commitLines = commits.length
    ? commits.map(c => `- \`${c}\``).join('\n')
    : '- (no commits yet today)';

  return `---
type: session
title: "OuBiznes Session ${dateStr}-${n}"
date: ${dateStr}
session: ${n}
updated: ${ts}
tags:
  - session
  - oubiznes
related:
  - "[[hot]]"
  - "[[index]]"
---

# Session ${dateStr}-${n}

## Commits This Session

${commitLines}

## Notes

_Add session notes here._

---

_OuBiznes.mu — SPAK-powered session log_
`;
}

function buildHotMd(dateStr, n, commits) {
  const ts          = new Date().toISOString();
  const commitLines = commits.length
    ? commits.map(c => `- \`${c}\``).join('\n')
    : '- (no commits yet today)';

  return `---
type: meta
title: "Hot Cache"
updated: ${ts}
tags:
  - meta
  - hot-cache
status: evergreen
related:
  - "[[index]]"
  - "[[log]]"
  - "[[sessions/${dateStr}-session-${n}]]"
---

# Recent Context

Navigation: [[index]] | [[log]] | [[overview]]

## Last Session

${dateStr} (session ${n}) — auto-saved via \`npm run wiki-save\`.

## Commits Today (${dateStr})

${commitLines}

## Project State

- **Site:** OuBiznes.mu — live at oubiznes.mu
- **Supabase:** ftpqluqkihmvnfxxtixc.supabase.co (all 6 tables live)
- **Vercel crons:** briefing \`0 3 * * *\`, email-reply \`*/30 * * * *\`, weekly-digest \`0 6 * * 1\`
- **SPAK agents:** morning briefing, regulatory check, weekly digest all live
- **Scripts:** \`npm run regulatory-check\` | \`npm run spak-briefing\` | \`npm run wiki-save\`

## Active Threads

- Priority 1: Task Scheduler — add spak-briefing daily at 07:00 on Windows
- Priority 2: Agent 6 — QA Tester automated (npm run qa-test)
- Priority 3: Agent 1 — Onboarding Agent (persistent business profile)
- Priority 4: Agents 2, 3, 4 — Compliance Guardian, Grants Watchdog, Grant Hunter

## Repo

- Working: \`C:\\\\Users\\\\conta\\\\OneDrive\\\\Documents\\\\oubiznes\`
- GitHub: https://github.com/pravish1922-ctrl/oubiznes
- Deploy: Vercel (auto on push to master)
`;
}

async function main() {
  const dateStr   = todayISO();
  const n         = nextSessionNumber(dateStr);
  const commits   = getCommits(dateStr);

  const sessionFile = join(SESSIONS_DIR, `${dateStr}-session-${n}.md`);
  writeFileSync(sessionFile, buildSessionNote(dateStr, n, commits), 'utf-8');
  console.log(`✓ Session note → obsidian-vault/wiki/sessions/${dateStr}-session-${n}.md`);

  writeFileSync(HOT_MD, buildHotMd(dateStr, n, commits), 'utf-8');
  console.log(`✓ hot.md updated`);

  console.log(`\nCommits captured (${commits.length}):`);
  for (const c of commits) console.log(`  ${c}`);
  console.log('\nWiki save complete.');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
