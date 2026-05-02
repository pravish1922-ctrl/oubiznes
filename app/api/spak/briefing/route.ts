/**
 * SPAK Morning Briefing — Vercel Cron Route
 *
 * Triggered by Vercel Cron at 0 3 * * * (03:00 UTC = 07:00 Mauritius).
 * Protected by CRON_SECRET env var — Vercel sends it automatically as
 * the Authorization: Bearer header for all cron invocations.
 *
 * Can also be triggered manually:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://oubiznes.mu/api/spak/briefing
 *
 * Required env vars (Vercel dashboard):
 *   CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP
 */

import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

const PROJECT  = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

const HEALTH_ENDPOINTS = [
  '/',
  '/api/companies/detail',              // 400 = missing param, route alive, no MNS call
  '/vat',
  '/calendar',
];

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface HealthResult { path: string; status: number; ok: boolean; error?: string }
interface Health { up: number; total: number; allUp: boolean; down: HealthResult[]; results: HealthResult[] }
interface RegCheck { run_at: string; status: string; summary?: string }
interface PendingApproval { id: string; summary: string; run_at: string; details: Record<string, string> }
interface Stats {
  subscribers:      number;
  newSubscribers:   number;
  votes:            Record<string, number>;
  lastRegCheck:     RegCheck | null;
  pendingApprovals: PendingApproval[];
}
interface Deadline { label: string; date: Date; daysAway: number }

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
async function checkSiteHealth(): Promise<Health> {
  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(async (path): Promise<HealthResult> => {
      try {
        const res = await fetch(`${SITE_URL}${path}`, {
          signal:  AbortSignal.timeout(10_000),
          headers: { 'User-Agent': 'SPAK-HealthCheck/1.0' },
        });
        return { path, status: res.status, ok: res.status < 500 };
      } catch (err) {
        return { path, status: 0, ok: false, error: (err as Error).message };
      }
    })
  );
  const up   = results.filter(r => r.ok).length;
  const down = results.filter(r => !r.ok);
  return { up, total: results.length, allUp: down.length === 0, down, results };
}

// ── SUPABASE STATS ────────────────────────────────────────────────────────────
async function fetchStats(db: SupabaseClient | null): Promise<Stats> {
  if (!db) return { subscribers: 0, newSubscribers: 0, votes: {}, lastRegCheck: null, pendingApprovals: [] };

  const yesterday = new Date(Date.now() - 86_400_000).toISOString();

  const [subTotal, subNew, votesRaw, lastRun, pendingRaw] = await Promise.all([
    db.from('email_subscribers').select('id', { count: 'exact', head: true }).eq('project', PROJECT),
    db.from('email_subscribers').select('id', { count: 'exact', head: true })
      .eq('project', PROJECT).gte('created_at', yesterday),
    db.from('feature_votes').select('feature_id').eq('project', PROJECT),
    db.from('agent_runs').select('run_at, status, summary')
      .eq('project', PROJECT).eq('agent_name', 'regulatory-check')
      .not('status', 'eq', 'pending_approval')
      .order('run_at', { ascending: false }).limit(1),
    db.from('agent_runs').select('id, summary, run_at, details')
      .eq('project', PROJECT).eq('status', 'pending_approval')
      .order('run_at', { ascending: false }),
  ]);

  const votes: Record<string, number> = {};
  for (const row of (votesRaw.data ?? [])) {
    votes[row.feature_id] = (votes[row.feature_id] ?? 0) + 1;
  }

  return {
    subscribers:      subTotal.count  ?? 0,
    newSubscribers:   subNew.count    ?? 0,
    votes,
    lastRegCheck:     lastRun.data?.[0] ?? null,
    pendingApprovals: (pendingRaw.data ?? []) as PendingApproval[],
  };
}

// ── NEXT DEADLINE ─────────────────────────────────────────────────────────────
function nextDeadline(): Deadline | null {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const deadlines = [
    { label: 'PAYE/CSG/NSF', day: 28 },
    { label: 'VAT return',    day: 20 },
    { label: 'HRDC Levy',     day: 28 },
  ];

  let soonest: { label: string; date: Date } | null = null;
  let soonestMs = Infinity;

  for (const d of deadlines) {
    for (const m of [month, month + 1]) {
      const y  = m > 11 ? year + 1 : year;
      const mm = m > 11 ? m - 12   : m;
      const dt = new Date(y, mm, d.day);
      const ms = dt.getTime() - now.getTime();
      if (ms > 0 && ms < soonestMs) {
        soonestMs = ms;
        soonest   = { label: d.label, date: dt };
      }
    }
  }

  if (!soonest) return null;
  return { ...soonest, daysAway: Math.ceil(soonestMs / 86_400_000) };
}

// ── FORMAT ────────────────────────────────────────────────────────────────────
function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-MU', {
    day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });
}

function featureLabel(id: string): string {
  const map: Record<string, string> = {
    tiktok:        'AI TikTok Creator',
    website:       'Website Builder',
    marketplace:   'Marketplace',
    'ai-learning': 'AI Learning Space',
  };
  return map[id] ?? id;
}

function formatBriefing(stats: Stats, health: Health, deadline: Deadline | null, now: Date): string {
  const dateStr = now.toLocaleDateString('en-MU', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });

  const topVote    = Object.entries(stats.votes).sort((a, b) => b[1] - a[1])[0];
  const topVoteStr = topVote
    ? `${featureLabel(topVote[0])} (${topVote[1]} vote${topVote[1] !== 1 ? 's' : ''})`
    : 'No votes yet';

  const healthIcon = health.allUp ? '🟢' : '🔴';
  const healthStr  = health.allUp
    ? `All ${health.total} checks passed`
    : `${health.up}/${health.total} — DOWN: ${health.down.map(d => d.path).join(', ')}`;

  // Regulatory status
  let regStr: string;
  if (stats.pendingApprovals.length > 0) {
    regStr = `⚠️ ${stats.pendingApprovals.length} change(s) pending approval`;
  } else if (stats.lastRegCheck) {
    regStr = stats.lastRegCheck.summary?.includes('verified')
      ? `Regulatory: All rates verified ✅ (${fmtDate(stats.lastRegCheck.run_at)})`
      : `${stats.lastRegCheck.status === 'success' ? '✓' : '⚠'} ${stats.lastRegCheck.summary ?? stats.lastRegCheck.status} (${fmtDate(stats.lastRegCheck.run_at)})`;
  } else {
    regStr = 'Not run yet';
  }

  const deadlineStr = deadline
    ? `${deadline.label} due in ${deadline.daysAway} day${deadline.daysAway !== 1 ? 's' : ''} (${fmtDate(deadline.date)})`
    : 'No deadline this week';

  const newSubs = stats.newSubscribers > 0 ? ` (+${stats.newSubscribers} new)` : '';

  const pendingLines = stats.pendingApprovals.map((p, i) => {
    const d = p.details as Record<string, string>;
    return `  ${i + 1}. ${d.rate_name}: ${d.old_value} → ${d.new_value}\n     APPROVE ${p.id}\n     IGNORE  ${p.id}`;
  });

  return [
    `*SPAK Morning Brief — ${dateStr}*`,
    '',
    `📧 Subscribers: ${stats.subscribers}${newSubs}`,
    `🗳️  Top vote: ${topVoteStr}`,
    `${healthIcon} Site health: ${healthStr}`,
    `📋 ${regStr}`,
    ...(pendingLines.length > 0 ? ['', '⚠️ Pending regulatory approvals:', ...pendingLines] : []),
    `⏰ Next deadline: ${deadlineStr}`,
    '',
    '_OuBiznes.mu — Powered by SPAK_',
  ].join('\n');
}

// ── NOTIFY ────────────────────────────────────────────────────────────────────
async function notifyWhatsApp(message: string): Promise<boolean> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !OPERATOR_WHATSAPP) return false;

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
      to:   OPERATOR_WHATSAPP,
      body: message,
    });
    return true;
  } catch (err) {
    console.error('[briefing] WhatsApp failed:', (err as Error).message);
    return false;
  }
}

async function notifyEmail(subject: string, text: string): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return false;

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
    return true;
  } catch (err) {
    console.error('[briefing] Email failed:', (err as Error).message);
    return false;
  }
}

// ── SUPABASE WRITES ───────────────────────────────────────────────────────────
async function persist(db: SupabaseClient | null, health: Health, stats: Stats, statusLine: string, content: string, sentWA: boolean, sentEmail: boolean) {
  if (!db) return;
  const today = new Date().toISOString().slice(0, 10);

  await Promise.allSettled([
    db.from('spak_status').insert({
      project: PROJECT, all_tools_up: health.allUp,
      tools_up: health.up, tools_total: health.total,
      status_line: statusLine, details: { health, stats },
    }),
    db.from('morning_briefings').upsert(
      { project: PROJECT, briefing_date: today, content_text: content,
        stats: { subscribers: stats.subscribers, newSubscribers: stats.newSubscribers, votes: stats.votes },
        sent_whatsapp: sentWA, sent_email: sentEmail },
      { onConflict: 'project,briefing_date' }
    ),
    db.from('agent_runs').insert({
      project: PROJECT, agent_name: 'morning-briefing',
      status: health.allUp ? 'success' : 'warning',
      summary: statusLine, details: { health, stats }, flags_count: 0,
    }),
  ]);
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const db = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;

  const [health, stats] = await Promise.all([checkSiteHealth(), fetchStats(db)]);
  const deadline   = nextDeadline();
  const content    = formatBriefing(stats, health, deadline, now);
  const subject    = `SPAK Brief — ${now.toLocaleDateString('en-MU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius' })}`;
  const statusLine = `${health.allUp ? 'All checks passed' : `${health.up}/${health.total} tools up`} · Regulatory verified ${stats.lastRegCheck ? fmtDate(stats.lastRegCheck.run_at) : 'never'} · ${stats.subscribers} subscribers`;

  const [sentWA, sentEmail] = await Promise.all([
    notifyWhatsApp(content),
    notifyEmail(subject, content),
  ]);

  await persist(db, health, stats, statusLine, content, sentWA, sentEmail);

  return NextResponse.json({
    ok: true,
    sentWhatsApp: sentWA,
    sentEmail,
    healthUp: health.up,
    healthTotal: health.total,
    subscribers: stats.subscribers,
  });
}
