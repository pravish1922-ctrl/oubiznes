#!/usr/bin/env node
/**
 * Agent 5 — Regulatory Update Agent (OuBiznes.mu)
 *
 * Two-stage approach:
 *   1. AUTOMATED — fetch official source pages, verify they are reachable and
 *      the correct topic is still present (guards against URL changes or site
 *      restructuring that would silently invalidate our data).
 *   2. MANUAL CHECKLIST — MRA publishes actual rates in PDFs, not HTML, so the
 *      script generates a targeted checklist of figures to verify by eye.
 *
 * Run:
 *   npm run regulatory-check
 *   (or: node --env-file=.env.local scripts/regulatory-check.mjs)
 *
 * Schedule: runs weekly every Monday at 08:00.
 *   Windows Task Scheduler: Basic Task → Weekly → Monday 08:00,
 *   action = `cmd /c "cd /d C:\Users\conta\OneDrive\Documents\oubiznes && npm run regulatory-check"`
 *
 * Email alerts (optional):
 *   Add to .env.local:
 *     SMTP_HOST=smtp.example.com
 *     SMTP_PORT=465
 *     SMTP_USER=you@example.com
 *     SMTP_PASS=your-smtp-password
 *     REGULATORY_EMAIL_TO=pravish1922@gmail.com  ← defaults to SMTP_USER if omitted
 *   Then: npm install nodemailer  (one-time)
 *
 * Log:  logs/regulatory/YYYY-MM-DD.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── STORED VALUES  (source of truth — keep in sync with CLAUDE.md §5) ────────
const STORED = {
  "VAT standard rate":                     "15%",
  "VAT registration threshold":            "Rs 3,000,000 / year",
  "VAT return due":                        "20 days after end of period",
  "CSG employee — basic ≤ Rs 50,000":     "1.5%",
  "CSG employee — basic > Rs 50,000":     "3%",
  "CSG employer — basic ≤ Rs 50,000":     "3%",
  "CSG employer — basic > Rs 50,000":     "6%",
  "NSF employee rate":                     "1% (capped)",
  "NSF employer rate":                     "2.5% (capped)",
  "HRDC Training Levy":                    "1.5% of basic (employer only)",
  "National minimum wage":                 "Rs 16,500 / month",
  "PAYE band 1":                           "0%  on first Rs 500,000 / year",
  "PAYE band 2":                           "10% on next Rs 500,000 / year",
  "PAYE band 3":                           "20% above Rs 1,000,000 / year",
};

// ── SOURCES ───────────────────────────────────────────────────────────────────
// Each source has an automated reachability + topic check,
// plus a list of stored values a human should confirm on that page.
const SOURCES = [
  {
    name:          "MRA — VAT",
    url:           "https://www.mra.mu/index.php/mvat",
    topicKeywords: ["VAT", "value added tax"],
    verifies: [
      "VAT standard rate",
      "VAT registration threshold",
      "VAT return due",
    ],
  },
  {
    name:          "MRA — PAYE / CSG / NSF (Employers)",
    url:           "https://www.mra.mu/index.php/employers/employment",
    topicKeywords: ["CSG", "PAYE", "NSF"],
    verifies: [
      "CSG employee — basic ≤ Rs 50,000",
      "CSG employee — basic > Rs 50,000",
      "CSG employer — basic ≤ Rs 50,000",
      "CSG employer — basic > Rs 50,000",
      "NSF employee rate",
      "NSF employer rate",
      "PAYE band 1",
      "PAYE band 2",
      "PAYE band 3",
    ],
  },
  {
    name:          "HRDC — Training Levy",
    url:           "https://www.hrdc.mu/",
    topicKeywords: ["Training Levy", "training levy"],
    verifies: [
      "HRDC Training Levy",
    ],
  },
  {
    name:          "MRA — Minimum Wage / Individual",
    url:           "https://www.mra.mu/index.php/individual1",
    topicKeywords: ["income tax", "PAYE", "employee"],
    verifies: [
      "National minimum wage",
    ],
  },
];

// ── FETCH HELPER ──────────────────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "OuBiznes.mu Regulatory Monitor (compliance verification)",
        "Accept":     "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status} ${res.statusText}` };
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
    return { ok: true, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

// ── EMAIL ALERT (optional — requires nodemailer + SMTP env vars) ──────────────
async function sendEmailAlert(flags, manualChecklist, dateStr) {
  const { SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log("  (email skipped — SMTP_USER / SMTP_PASS not set in .env.local)");
    return;
  }

  let nodemailer;
  try {
    nodemailer = await import("nodemailer");
  } catch {
    console.log("  (email skipped — run: npm install nodemailer)");
    return;
  }

  const recipient = REGULATORY_EMAIL_TO || SMTP_USER;

  const manualLines = SOURCES.flatMap(s =>
    s.verifies.map(k => `  [${s.name}]  ${k}: ${STORED[k]}`)
  );

  const body = [
    `OuBiznes.mu — Regulatory check flagged ${flags.length} issue(s) on ${dateStr}`,
    "",
    "═══ AUTOMATED FLAGS ═══",
    ...flags.map(f => `  • ${f}`),
    "",
    "Action required:",
    "  1. Open each flagged URL in a browser.",
    "  2. If the page has moved, update SOURCES in scripts/regulatory-check.mjs",
    "     AND update CLAUDE.md §5.",
    "  3. Re-run: npm run regulatory-check",
    "",
    "═══ MANUAL CHECKLIST — verify these values on-screen ═══",
    ...manualLines,
    "",
    `Log: logs/regulatory/${dateStr}.json`,
  ].join("\n");

  const transporter = nodemailer.default.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: `"OuBiznes Agent 5" <${SMTP_USER}>`,
      to:   recipient,
      subject: `[OuBiznes] Regulatory check — ${flags.length} flag(s) — ${dateStr}`,
      text:  body,
    });
    console.log(`  ✓ Alert email sent → ${recipient}`);
  } catch (err) {
    console.log(`  ✗ Email send failed: ${err.message}`);
    console.log("    Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local");
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  const timestamp = new Date().toISOString();
  const dateStr   = timestamp.slice(0, 10);
  const automated = [];
  const flags     = [];

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  OuBiznes.mu — Agent 5: Regulatory Update Check");
  console.log(`  ${timestamp}`);
  console.log("══════════════════════════════════════════════════════════\n");

  // ── STAGE 1: automated page checks ────────────────────────────────────────
  console.log("STAGE 1 — Automated: checking source pages are reachable\n");

  for (const source of SOURCES) {
    const { ok, status, text, error } = await fetchPage(source.url);

    if (!ok) {
      console.log(`  ✗ FETCH FAILED  ${source.name}`);
      console.log(`    ${source.url}`);
      console.log(`    Error: ${error}\n`);
      automated.push({ source: source.name, url: source.url, status: "FETCH_FAILED", error });
      flags.push(`FETCH FAILED — ${source.name} (${error}). URL may have changed.`);
      continue;
    }

    // Check at least one topic keyword appears in the page text
    const topicHit = source.topicKeywords.find(kw =>
      text.toLowerCase().includes(kw.toLowerCase())
    );

    if (topicHit) {
      console.log(`  ✓ PAGE OK       ${source.name}  [found: "${topicHit}"]`);
      automated.push({ source: source.name, url: source.url, status: "PAGE_VERIFIED", topicFound: topicHit });
    } else {
      console.log(`  ? TOPIC MISSING ${source.name}`);
      console.log(`    Page returned HTTP ${status} but topic keywords not found.`);
      console.log(`    Keywords searched: ${source.topicKeywords.join(", ")}\n`);
      automated.push({ source: source.name, url: source.url, status: "TOPIC_NOT_FOUND", httpStatus: status });
      flags.push(`TOPIC NOT FOUND — ${source.name}: page returned ${status} but none of [${source.topicKeywords.join(", ")}] detected. URL may have been reorganised.`);
    }
  }

  // ── STAGE 2: manual verification checklist ────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("STAGE 2 — Manual: values to verify against official sources");
  console.log("══════════════════════════════════════════════════════════\n");

  const manualChecklist = [];

  for (const source of SOURCES) {
    console.log(`  ${source.name}`);
    console.log(`  ${source.url}`);
    for (const key of source.verifies) {
      const stored = STORED[key];
      console.log(`    [ ] ${key}: ${stored}`);
      manualChecklist.push({ source: source.name, url: source.url, field: key, storedValue: stored, checked: false });
    }
    console.log();
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const verified    = automated.filter(r => r.status === "PAGE_VERIFIED").length;
  const topicFailed = automated.filter(r => r.status === "TOPIC_NOT_FOUND").length;
  const fetchFailed = automated.filter(r => r.status === "FETCH_FAILED").length;

  console.log("══════════════════════════════════════════════════════════");
  console.log(`  Automated: ${verified}/${SOURCES.length} pages verified  |  ${topicFailed} topic missing  |  ${fetchFailed} unreachable`);
  console.log(`  Manual checklist: ${manualChecklist.length} values to confirm`);

  if (flags.length === 0) {
    console.log("  ✓ All source pages reachable and on-topic.");
    console.log("  Complete the manual checklist above against each source URL.");
  } else {
    console.log("\n  ⚠  FLAGS REQUIRING ATTENTION:");
    flags.forEach(f => console.log(`     • ${f}`));
    console.log("\n  If a page has moved, update SOURCES in this script and CLAUDE.md §5.");
  }
  console.log("══════════════════════════════════════════════════════════\n");

  // ── WRITE LOG ─────────────────────────────────────────────────────────────
  const logDir  = join(ROOT, "logs", "regulatory");
  const logPath = join(logDir, `${dateStr}.json`);
  mkdirSync(logDir, { recursive: true });
  writeFileSync(logPath, JSON.stringify({
    timestamp,
    summary: {
      pagesVerified: verified,
      topicNotFound: topicFailed,
      fetchFailed,
      manualChecklistCount: manualChecklist.length,
      hasAutomatedFlags: flags.length > 0,
    },
    automatedFlags: flags,
    storedValues: STORED,
    automated,
    manualChecklist,
  }, null, 2));

  console.log(`  Log saved → logs/regulatory/${dateStr}.json\n`);

  // ── EMAIL ALERT (only fires if flags exist) ───────────────────────────────
  if (flags.length > 0) {
    console.log("  Sending email alert...");
    await sendEmailAlert(flags, manualChecklist, dateStr);
  }

  // Exit non-zero if automated checks flagged anything
  if (flags.length > 0) process.exit(1);
}

run().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
