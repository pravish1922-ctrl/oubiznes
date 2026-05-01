#!/usr/bin/env node
/**
 * SPAK — Morning Briefing Agent
 *
 * Runs daily at 07:00 MU time (UTC+4 = 03:00 UTC).
 * Queries Supabase, checks site health, sends WhatsApp + email briefing.
 * Writes result back to Supabase (morning_briefings + spak_status tables).
 *
 * Run manually:
 *   npm run spak-briefing
 *
 * Windows Task Scheduler:
 *   Basic Task → Daily → 07:00
 *   Action: cmd /c "cd /d C:\Users\conta\OneDrive\Documents\oubiznes && npm run spak-briefing"
 *
 * Required env vars (.env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP
 */

import { createClient } from '@supabase/supabase-js';
import { sendEmail, sendWhatsApp } from '../lib/notify.mjs';

const PROJECT = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

// Health-check endpoints — must return 200
const HEALTH_ENDPOINTS = [
  '/',
  '/api/companies/detail?orgNo=test',   // returns 400, not 500 = route alive
  '/vat',
  '/calendar',
];

// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[briefing] Supabase not configured — stats will be empty');
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── SITE HEALTH CHECK ─────────────────────────────────────────────────────────
async function checkSiteHealth() {
  const results = await Promise.all(
    HEALTH_ENDPOINTS.map(async (path) => {
      try {
        const res = await fetch(`${SITE_URL}${path}`, {
          signal:  AbortSignal.timeout(10000),
          headers: { 'User-Agent': 'SPAK-HealthCheck/1.0' },
        });
        // 400 is acceptable (missing params); 500+ is a problem
        const ok = res.status < 500;
        return { path, status: res.status, ok };
      } catch (err) {
        return { path, status: 0, ok: false, error: err.message };
      }
    })
  );

  const up   = results.filter(r => r.ok).length;
  const down = results.filter(r => !r.ok);
  return { up, total: results.length, allUp: down.length === 0, down, results };
}

// ── SUPABASE STATS ────────────────────────────────────────────────────────────
async function fetchStats(db) {
  if (!db) return { subscribers: 0, newSubscribers: 0, votes: {}, lastRegCheck: null };

  const yesterday = new Date(Date.now() - 86_400_000).toISOString();

  const [subTotal, subNew, votesRaw, lastRun] = await Promise.all([
    db.from('email_subscribers').select('id', { count: 'exact', head: true }).eq('project', PROJECT),
    db.from('email_subscribers').select('id', { count: 'exact', head: true })
      .eq('project', PROJECT).gte('created_at', yesterday),
    db.from('feature_votes').select('feature_id').eq('project', PROJECT),
    db.from('agent_runs').select('run_at, status, summary, flags_count')
      .eq('project', PROJECT).eq('agent_name', 'regulatory-check')
      .order('run_at', { ascending: false }).limit(1),
  ]);

  // Tally votes by feature
  const votes = {};
  for (const row of (votesRaw.data || [])) {
    votes[row.feature_id] = (votes[row.feature_id] || 0) + 1;
  }

  return {
    subscribers:    subTotal.count  || 0,
    newSubscribers: subNew.count    || 0,
    votes,
    lastRegCheck:   lastRun.data?.[0] || null,
  };
}

// ── NEXT COMPLIANCE DEADLINE ──────────────────────────────────────────────────
function nextDeadline() {
  const now   = new Date();
  const month = now.getMonth();   // 0-based
  const year  = now.getFullYear();

  // Key fixed deadlines (month is 0-based)
  const deadlines = [
    { label: 'PAYE/CSG/NSF',    day: 28 },
    { label: 'VAT return',       day: 20 },
    { label: 'HRDC Levy',        day: 28 },
  ];

  let soonest = null;
  let soonestMs = Infinity;

  for (const d of deadlines) {
    // Try this month first, then next
    for (const m of [month, month + 1]) {
      const y  = m > 11 ? year + 1 : year;
      const mm = m > 11 ? m - 12   : m;
      const dt = new Date(y, mm, d.day);
      if (dt > now && dt - now < soonestMs) {
        soonestMs = dt - now;
        soonest   = { label: d.label, date: dt };
      }
    }
  }

  if (!soonest) return null;
  const daysAway = Math.ceil(soonestMs / 86_400_000);
  return { label: soonest.label, date: soonest.date, daysAway };
}

// ── FORMAT BRIEFING ───────────────────────────────────────────────────────────
function formatBriefing(stats, health, deadline, now) {
  const dateStr = now.toLocaleDateString('en-MU', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });

  const topVote = Object.entries(stats.votes).sort((a, b) => b[1] - a[1])[0];
  const topVoteStr = topVote
    ? `${featureLabel(topVote[0])} (${topVote[1]} vote${topVote[1] !== 1 ? 's' : ''})`
    : 'No votes yet';

  const healthIcon = health.allUp ? '🟢' : '🔴';
  const healthStr  = health.allUp
    ? `All ${health.total} checks passed`
    : `${health.up}/${health.total} — DOWN: ${health.down.map(d => d.path).join(', ')}`;

  const regStr = stats.lastRegCheck
    ? `${stats.lastRegCheck.status === 'success' ? '✓' : '⚠'} ${stats.lastRegCheck.summary || stats.lastRegCheck.status} (${formatDate(stats.lastRegCheck.run_at)})`
    : 'Not run yet';

  const deadlineStr = deadline
    ? `${deadline.label} due in ${deadline.daysAway} day${deadline.daysAway !== 1 ? 's' : ''} (${formatDate(deadline.date)})`
    : 'No deadline within 7 days';

  const newSubs = stats.newSubscribers > 0 ? ` (+${stats.newSubscribers} new)` : '';

  const lines = [
    `*SPAK Morning Brief — ${dateStr}*`,
    '',
    `📧 Subscribers: ${stats.subscribers}${newSubs}`,
    `🗳️  Top vote: ${topVoteStr}`,
    `${healthIcon} Site health: ${healthStr}`,
    `📋 Regulatory: ${regStr}`,
    `⏰ Next deadline: ${deadlineStr}`,
    '',
    '_OuBiznes.mu — Powered by SPAK_',
  ];

  return lines.join('\n');
}

function featureLabel(id) {
  const map = {
    tiktok:      'AI TikTok Creator',
    website:     'Website Builder',
    marketplace: 'Marketplace',
    'ai-learning': 'AI Learning Space',
  };
  return map[id] || id;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-MU', {
    day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });
}

// ── WRITE STATUS TO SUPABASE ──────────────────────────────────────────────────
async function writeStatus(db, health, stats, statusLine) {
  if (!db) return;

  await db.from('spak_status').insert({
    project:      PROJECT,
    all_tools_up: health.allUp,
    tools_up:     health.up,
    tools_total:  health.total,
    status_line:  statusLine,
    details:      { health, stats },
  });
}

async function writeBriefing(db, content, stats, sentWhatsApp, sentEmail) {
  if (!db) return;

  const today = new Date().toISOString().slice(0, 10);
  await db.from('morning_briefings').upsert(
    { project: PROJECT, briefing_date: today, content_text: content, stats, sent_whatsapp: sentWhatsApp, sent_email: sentEmail },
    { onConflict: 'project,briefing_date' }
  );
}

async function logAgentRun(db, status, summary, details) {
  if (!db) return;
  await db.from('agent_runs').insert({
    project:    PROJECT,
    agent_name: 'morning-briefing',
    status,
    summary,
    details,
    flags_count: 0,
  });
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  const now = new Date();
  console.log('\n══════════════════════════════════════════════════');
  console.log('  SPAK — Morning Briefing Agent');
  console.log(`  ${now.toISOString()}`);
  console.log('══════════════════════════════════════════════════\n');

  const db = getSupabase();

  // Run checks in parallel
  console.log('Gathering data...');
  const [health, stats] = await Promise.all([
    checkSiteHealth(),
    fetchStats(db),
  ]);

  const deadline = nextDeadline();

  console.log(`Site health:   ${health.allUp ? 'ALL UP' : `${health.up}/${health.total}`}`);
  console.log(`Subscribers:   ${stats.subscribers} (${stats.newSubscribers} new today)`);
  console.log(`Votes:         ${JSON.stringify(stats.votes)}`);
  console.log(`Reg check:     ${stats.lastRegCheck?.run_at || 'never'}`);
  console.log(`Next deadline: ${deadline?.label} in ${deadline?.daysAway}d\n`);

  // Format briefing
  const content  = formatBriefing(stats, health, deadline, now);
  const subject  = `SPAK Brief — ${now.toLocaleDateString('en-MU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius' })}`;
  const statusLine = `${health.allUp ? 'All checks passed' : `${health.up}/${health.total} tools up`} · Regulatory verified ${stats.lastRegCheck ? formatDate(stats.lastRegCheck.run_at) : 'never'} · ${stats.subscribers} subscribers`;

  console.log('─── Briefing ───────────────────────────────────');
  console.log(content);
  console.log('────────────────────────────────────────────────\n');

  // Send notifications
  console.log('Sending notifications...');
  const [waResult, emailResult] = await Promise.all([
    sendWhatsApp(content),
    sendEmail(subject, content),
  ]);

  // Persist to Supabase
  await Promise.all([
    writeStatus(db, health, stats, statusLine),
    writeBriefing(db, content, { subscribers: stats.subscribers, newSubscribers: stats.newSubscribers, votes: stats.votes, healthUp: health.up, healthTotal: health.total }, waResult.ok, emailResult.ok),
    logAgentRun(db, health.allUp ? 'success' : 'warning', statusLine, { health, stats }),
  ]);

  console.log('\n✓ Morning briefing complete\n');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
