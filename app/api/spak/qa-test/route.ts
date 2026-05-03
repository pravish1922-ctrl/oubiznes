/**
 * Agent 6 — QA Tester
 *
 * HTTP-based smoke tests for all 8 tools + key API endpoints.
 * Scheduled daily at 05:00 UTC (09:00 Mauritius).
 * Alerts via WhatsApp + email if any test fails.
 * Writes pass/fail results to agent_runs.
 *
 * Manual trigger:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://oubiznes.mu/api/spak/qa-test
 *
 * Required env vars: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP
 */

import { NextResponse }               from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer                      from 'nodemailer';
import twilio                          from 'twilio';

const PROJECT  = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface PageCheck  { path: string; expects: string[] }
interface ApiCheck   { path: string; method: 'GET' | 'POST'; body?: Record<string, unknown>; wantStatus: number | number[] }
interface ToolConfig { name: string; pages: PageCheck[]; apis?: ApiCheck[] }
interface ToolResult { name: string; pass: boolean; failures: string[] }

// ── TEST DEFINITIONS ──────────────────────────────────────────────────────────
const TOOLS: ToolConfig[] = [
  {
    name:  'Home',
    pages: [{ path: '/', expects: ['OuBiznes', 'free', 'tools'] }],
  },
  {
    name:  'VAT Calculator',
    pages: [{ path: '/vat', expects: ['VAT', '15', '3,000,000'] }],
  },
  {
    name:  'PAYE Calculator',
    pages: [{ path: '/paye', expects: ['PAYE', '16,500', '1.5'] }],
  },
  {
    name:  'Business Plan Generator',
    pages: [{ path: '/plan', expects: ['Business Plan', 'Mauritius'] }],
  },
  {
    name:  'Grants Finder',
    pages: [{ path: '/grants', expects: ['Grant', 'SMEDA', 'EDB'] }],
  },
  {
    name:  'Business Structure Advisor',
    pages: [{ path: '/structure', expects: ['Structure', 'Business'] }],
  },
  {
    name:  'Compliance Calendar',
    pages: [{ path: '/calendar', expects: ['PAYE', 'VAT', 'deadline'] }],
  },
  {
    name:  'BRN Lookup',
    pages: [{ path: '/lookup', expects: ['BRN', 'company'] }],
  },
  {
    name:  'Grant Application',
    pages: [{ path: '/apply', expects: ['Application', 'Grant'] }],
  },
  {
    name:  'Feedback',
    pages: [{ path: '/feedback', expects: ['feedback', 'suggestion'] }],
  },
];

const API_CHECKS: ApiCheck[] = [
  { path: '/api/companies/detail',      method: 'GET', wantStatus: 400 },  // missing orgNo — route alive
  { path: '/api/votes?project=oubiznes', method: 'GET', wantStatus: 200 },
  { path: '/api/spak/status',           method: 'GET', wantStatus: 200 },
  { path: '/api/regulatory-status',     method: 'GET', wantStatus: 200 },
];

// ── TEST RUNNERS ──────────────────────────────────────────────────────────────
async function testPage(check: PageCheck): Promise<string[]> {
  const failures: string[] = [];
  try {
    const res = await fetch(`${SITE_URL}${check.path}`, {
      headers: { 'User-Agent': 'SPAK-QA/1.0' },
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
    failures.push(`${check.path}: ${(err as Error).message}`);
  }
  return failures;
}

async function testApi(check: ApiCheck): Promise<string | null> {
  try {
    const res = await fetch(`${SITE_URL}${check.path}`, {
      method:  check.method,
      headers: { 'User-Agent': 'SPAK-QA/1.0', 'Content-Type': 'application/json' },
      body:    check.body ? JSON.stringify(check.body) : undefined,
      signal:  AbortSignal.timeout(10_000),
    });
    const ok = Array.isArray(check.wantStatus)
      ? check.wantStatus.includes(res.status)
      : res.status === check.wantStatus;
    if (!ok) {
      const want = Array.isArray(check.wantStatus) ? check.wantStatus.join('/') : check.wantStatus;
      return `${check.path}: want ${want}, got ${res.status}`;
    }
    return null;
  } catch (err) {
    return `${check.path}: ${(err as Error).message}`;
  }
}

async function runAllTests(): Promise<{ results: ToolResult[]; passed: number; failed: number }> {
  const results: ToolResult[] = [];

  // Tool page tests (parallel)
  await Promise.all(TOOLS.map(async tool => {
    const failures: string[] = [];
    for (const page of tool.pages) {
      failures.push(...await testPage(page));
    }
    results.push({ name: tool.name, pass: failures.length === 0, failures });
  }));

  // API health checks (parallel)
  const apiFailures = (await Promise.all(API_CHECKS.map(testApi))).filter(Boolean) as string[];
  results.push({ name: 'API Health', pass: apiFailures.length === 0, failures: apiFailures });

  results.sort((a, b) => a.name.localeCompare(b.name));
  const passed = results.filter(r =>  r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  return { results, passed, failed };
}

// ── NOTIFY ────────────────────────────────────────────────────────────────────
async function notifyWhatsApp(message: string): Promise<void> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !OPERATOR_WHATSAPP) return;
  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to:   OPERATOR_WHATSAPP,
      body: message,
    });
  } catch (err) {
    console.error('[qa] WhatsApp failed:', (err as Error).message);
  }
}

async function notifyEmail(subject: string, text: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      host:   SMTP_HOST   ?? 'smtp.zoho.com',
      port:   Number(SMTP_PORT ?? 465),
      secure: true,
      auth:   { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from:    `"SPAK · OuBiznes" <${SMTP_USER}>`,
      to:      REGULATORY_EMAIL_TO ?? SMTP_USER,
      subject,
      text,
    });
  } catch (err) {
    console.error('[qa] Email failed:', (err as Error).message);
  }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { results, passed, failed } = await runAllTests();
  const total   = passed + failed;
  const status  = failed === 0 ? 'success' : 'warning';
  const summary = `QA: ${passed}/${total} passed${failed > 0 ? ` — ${failed} failing` : ''}`;

  if (failed > 0) {
    const failLines = results
      .filter(r => !r.pass)
      .map(r => `${r.name}:\n${r.failures.map(f => `  • ${f}`).join('\n')}`)
      .join('\n\n');
    const message = `🔴 SPAK QA: ${failed} tool(s) failing\n\n${failLines}`;
    await Promise.allSettled([
      notifyWhatsApp(message),
      notifyEmail(`⚠️ SPAK QA: ${failed} tool(s) failing`, message),
    ]);
  }

  const db: SupabaseClient | null =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;

  if (db) {
    await db.from('agent_runs').insert({
      project:     PROJECT,
      agent_name:  'qa-test',
      status,
      summary,
      details:     { results, passed, failed, total },
      flags_count: failed,
    });
  }

  return NextResponse.json({ ok: true, summary, passed, failed, total, results });
}
