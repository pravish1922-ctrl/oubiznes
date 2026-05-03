/**
 * SPAK Orchestrator — Weekly Ops Coordinator
 *
 * Runs every Monday at 07:00 UTC (11:00 Mauritius), after:
 *   03:00 — morning briefing
 *   04:00 — regulatory check
 *   05:00 — QA test
 *   06:00 — weekly subscriber digest
 *
 * Responsibilities:
 *   1. Trigger grants-watchdog and mra-monitor for the week's monitoring pass
 *   2. Read all agent_runs from the past 7 days
 *   3. Compile a weekly ops report (operator-facing, not subscriber-facing)
 *   4. Send consolidated WhatsApp + email with full agent status
 *
 * Manual trigger:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://oubiznes.mu/api/spak/orchestrate
 */

import { NextResponse }               from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer                      from 'nodemailer';
import twilio                          from 'twilio';

const PROJECT  = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface AgentRun {
  agent_name:  string;
  status:      string;
  summary:     string;
  flags_count: number;
  run_at:      string;
}

interface AgentCallResult {
  agent:   string;
  path:    string;
  ok:      boolean;
  summary: string;
}

// ── CALL AGENT ROUTE ──────────────────────────────────────────────────────────
async function callAgent(path: string, secret: string): Promise<AgentCallResult> {
  const agent = path.split('/').pop() ?? path;
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      headers: { 'Authorization': `Bearer ${secret}`, 'User-Agent': 'SPAK-Orchestrator/1.0' },
      signal:  AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      return { agent, path, ok: false, summary: `HTTP ${res.status}` };
    }
    const json = await res.json() as { summary?: string; ok?: boolean };
    return { agent, path, ok: true, summary: json.summary ?? 'ok' };
  } catch (err) {
    return { agent, path, ok: false, summary: (err as Error).message };
  }
}

// ── READ AGENT HISTORY ────────────────────────────────────────────────────────
async function recentRuns(db: SupabaseClient): Promise<AgentRun[]> {
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await db
    .from('agent_runs')
    .select('agent_name, status, summary, flags_count, run_at')
    .eq('project', PROJECT)
    .gte('run_at', since)
    .not('status', 'eq', 'pending_approval')
    .order('run_at', { ascending: false });
  return (data ?? []) as AgentRun[];
}

// ── FORMAT WEEKLY OPS REPORT ──────────────────────────────────────────────────
function buildOpsReport(
  triggered:    AgentCallResult[],
  runs:         AgentRun[],
  pendingCount: number,
  now:          Date,
): string {
  const dateStr = now.toLocaleDateString('en-MU', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });

  // Latest run per agent
  const latest: Record<string, AgentRun> = {};
  for (const run of runs) {
    if (!latest[run.agent_name]) latest[run.agent_name] = run;
  }

  const AGENT_LABELS: Record<string, string> = {
    'morning-briefing':  'Morning Briefing',
    'regulatory-check':  'Regulatory Check',
    'qa-test':           'QA Tester',
    'weekly-digest':     'Weekly Digest',
    'grants-watchdog':   'Grants Watchdog',
    'mra-monitor':       'MRA Monitor',
  };

  const agentLines = Object.entries(AGENT_LABELS).map(([name, label]) => {
    const run = latest[name];
    if (!run) return `  ⚪ ${label}: not run this week`;
    const icon = run.status === 'success' ? '✅' : run.status === 'warning' ? '⚠️' : '🔴';
    const flags = run.flags_count > 0 ? ` (${run.flags_count} flag${run.flags_count !== 1 ? 's' : ''})` : '';
    return `  ${icon} ${label}${flags}: ${run.summary}`;
  });

  const triggeredLines = triggered.map(t => {
    const icon = t.ok ? '▶️' : '❌';
    return `  ${icon} ${t.agent}: ${t.summary}`;
  });

  const totalFlags = runs.reduce((sum, r) => sum + (r.flags_count ?? 0), 0);
  const overallIcon = totalFlags === 0 ? '🟢' : totalFlags < 3 ? '🟡' : '🔴';

  return [
    `*SPAK Weekly Ops — ${dateStr}*`,
    '',
    `${overallIcon} Overall: ${totalFlags} flag(s) this week${pendingCount > 0 ? ` · ${pendingCount} pending approval` : ''}`,
    '',
    '*Agent Status (last 7 days):*',
    ...agentLines,
    '',
    '*Triggered this run:*',
    ...triggeredLines,
    '',
    '_OuBiznes.mu — SPAK Orchestrator_',
  ].join('\n');
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
    console.error('[orchestrate] WhatsApp failed:', (err as Error).message);
  }
}

async function notifyEmail(subject: string, text: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return;
  try {
    const transporter = nodemailer.createTransport({
      host:   SMTP_HOST ?? 'smtp.zoho.com',
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
    console.error('[orchestrate] Email failed:', (err as Error).message);
  }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth   = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const db: SupabaseClient | null =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;

  // Step 1: trigger grants-watchdog + mra-monitor in parallel
  const [grantsResult, mraResult] = await Promise.all([
    callAgent('/api/spak/grants-watchdog', secret),
    callAgent('/api/spak/mra-monitor',     secret),
  ]);
  const triggered = [grantsResult, mraResult];
  console.log('[orchestrate] Triggered:', triggered.map(t => `${t.agent}: ${t.summary}`).join(', '));

  // Step 2: read last 7 days of agent_runs
  const runs = db ? await recentRuns(db) : [];

  // Step 3: count pending approvals
  let pendingCount = 0;
  if (db) {
    const { count } = await db
      .from('agent_runs')
      .select('id', { count: 'exact', head: true })
      .eq('project', PROJECT)
      .eq('status', 'pending_approval');
    pendingCount = count ?? 0;
  }

  // Step 4: build + send report
  const report  = buildOpsReport(triggered, runs, pendingCount, now);
  const subject = `SPAK Weekly Ops — ${now.toLocaleDateString('en-MU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius' })}`;

  await Promise.allSettled([notifyWhatsApp(report), notifyEmail(subject, report)]);

  // Step 5: log to agent_runs
  const totalFlags = runs.reduce((sum, r) => sum + (r.flags_count ?? 0), 0);
  const summary    = `Weekly ops: ${runs.length} agent runs · ${totalFlags} flags · ${pendingCount} pending`;

  if (db) {
    await db.from('agent_runs').insert({
      project:     PROJECT,
      agent_name:  'orchestrate',
      status:      totalFlags === 0 ? 'success' : 'warning',
      summary,
      details:     { triggered, agent_runs_count: runs.length, totalFlags, pendingCount },
      flags_count: totalFlags,
    });
  }

  return NextResponse.json({ ok: true, summary, triggered, agentRunsCount: runs.length, totalFlags, pendingCount });
}
