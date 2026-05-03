#!/usr/bin/env node
/**
 * Agent 6 — QA Tester (local script)
 *
 * Runs the same HTTP smoke tests as /api/spak/qa-test but locally.
 * Targets QA_BASE_URL (default: https://oubiznes.mu).
 * Override to test against localhost: QA_BASE_URL=http://localhost:3000 npm run qa-test
 *
 * Log: logs/qa/YYYY-MM-DD-HH.json
 * Email: full report via Zoho SMTP if failures found
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath }            from 'url';
import nodemailer                   from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const SITE_URL  = process.env.QA_BASE_URL || 'https://oubiznes.mu';

// ── TEST DEFINITIONS (mirror of route.ts) ─────────────────────────────────────
const TOOLS = [
  { name: 'Home',                     pages: [{ path: '/',         expects: ['OuBiznes', 'free', 'tools'] }] },
  { name: 'VAT Calculator',           pages: [{ path: '/vat',      expects: ['VAT', '15', '3,000,000'] }] },
  { name: 'PAYE Calculator',          pages: [{ path: '/paye',     expects: ['PAYE', '16,500', '1.5'] }] },
  { name: 'Business Plan Generator',  pages: [{ path: '/plan',     expects: ['Business Plan', 'Mauritius'] }] },
  { name: 'Grants Finder',            pages: [{ path: '/grants',   expects: ['Grant', 'SMEDA', 'EDB'] }] },
  { name: 'Business Structure',       pages: [{ path: '/structure',expects: ['Structure', 'Business'] }] },
  { name: 'Compliance Calendar',      pages: [{ path: '/calendar', expects: ['PAYE', 'VAT', 'deadline'] }] },
  { name: 'BRN Lookup',               pages: [{ path: '/lookup',   expects: ['BRN', 'company'] }] },
  { name: 'Grant Application',        pages: [{ path: '/apply',    expects: ['Application', 'Grant'] }] },
  { name: 'Feedback',                 pages: [{ path: '/feedback', expects: ['feedback', 'suggestion'] }] },
];

const API_CHECKS = [
  { path: '/api/companies/detail',       method: 'GET', wantStatus: 400 },
  { path: '/api/votes?project=oubiznes', method: 'GET', wantStatus: 200 },
  { path: '/api/spak/status',            method: 'GET', wantStatus: 200 },
  { path: '/api/regulatory-status',      method: 'GET', wantStatus: 200 },
];

// ── RUNNERS ───────────────────────────────────────────────────────────────────
async function testPage(check) {
  const failures = [];
  try {
    const res = await fetch(`${SITE_URL}${check.path}`, {
      headers: { 'User-Agent': 'SPAK-QA-Local/1.0' },
      signal:  AbortSignal.timeout(15_000),
    });
    if (res.status !== 200) {
      failures.push(`${check.path}: HTTP ${res.status}`);
      return failures;
    }
    const html = await res.text();
    for (const str of check.expects) {
      if (!html.toLowerCase().includes(str.toLowerCase())) {
        failures.push(`${check.path}: missing "${str}"`);
      }
    }
    if (/internal server error|unhandled.*error/i.test(html)) {
      failures.push(`${check.path}: contains error indicator`);
    }
  } catch (err) {
    failures.push(`${check.path}: ${err.message}`);
  }
  return failures;
}

async function testApi(check) {
  try {
    const res = await fetch(`${SITE_URL}${check.path}`, {
      method:  check.method,
      headers: { 'User-Agent': 'SPAK-QA-Local/1.0', 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(10_000),
    });
    const want = Array.isArray(check.wantStatus) ? check.wantStatus : [check.wantStatus];
    if (!want.includes(res.status)) {
      return `${check.path}: want ${want.join('/')}, got ${res.status}`;
    }
    return null;
  } catch (err) {
    return `${check.path}: ${err.message}`;
  }
}

async function runAllTests() {
  const results = [];

  await Promise.all(TOOLS.map(async tool => {
    const failures = [];
    for (const page of tool.pages) {
      failures.push(...await testPage(page));
    }
    results.push({ name: tool.name, pass: failures.length === 0, failures });
  }));

  const apiFails = (await Promise.all(API_CHECKS.map(testApi))).filter(Boolean);
  results.push({ name: 'API Health', pass: apiFails.length === 0, failures: apiFails });

  results.sort((a, b) => a.name.localeCompare(b.name));
  return {
    results,
    passed: results.filter(r =>  r.pass).length,
    failed: results.filter(r => !r.pass).length,
  };
}

// ── EMAIL ─────────────────────────────────────────────────────────────────────
async function sendReport(subject, text) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS) { console.warn('[qa] SMTP not configured — skipping email'); return; }
  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST || 'smtp.zoho.com',
    port:   Number(SMTP_PORT || 465),
    secure: true,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from:    `"SPAK · OuBiznes" <${SMTP_USER}>`,
    to:      REGULATORY_EMAIL_TO || SMTP_USER,
    subject,
    text,
  });
  console.log(`[qa] Email sent → ${REGULATORY_EMAIL_TO || SMTP_USER}`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  const now       = new Date();
  const timestamp = now.toISOString();
  const dateHour  = timestamp.slice(0, 13).replace('T', '-');

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  OuBiznes.mu — Agent 6: QA Tester');
  console.log(`  Target: ${SITE_URL}`);
  console.log(`  ${timestamp}`);
  console.log('══════════════════════════════════════════════════════════\n');

  const { results, passed, failed } = await runAllTests();
  const total = passed + failed;

  for (const r of results) {
    const icon = r.pass ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}`);
    for (const f of r.failures) console.log(`      • ${f}`);
  }

  const summary = `QA: ${passed}/${total} passed${failed > 0 ? ` — ${failed} failing` : ' ✅'}`;
  console.log(`\n══ ${summary}\n`);

  // Save log
  const logDir = join(ROOT, 'logs', 'qa');
  mkdirSync(logDir, { recursive: true });
  writeFileSync(
    join(logDir, `${dateHour}.json`),
    JSON.stringify({ timestamp, site: SITE_URL, summary, passed, failed, total, results }, null, 2)
  );
  console.log(`Log saved → logs/qa/${dateHour}.json`);

  // Send email if failures
  if (failed > 0) {
    const failLines = results
      .filter(r => !r.pass)
      .map(r => `${r.name}:\n${r.failures.map(f => `  • ${f}`).join('\n')}`)
      .join('\n\n');
    const reportText = `QA Report — ${timestamp}\nTarget: ${SITE_URL}\n\n${summary}\n\n${failLines}`;
    await sendReport(`⚠️ SPAK QA: ${failed} tool(s) failing`, reportText).catch(console.error);
    process.exit(1);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
