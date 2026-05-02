/**
 * GET /api/spak/weekly-digest — Vercel Cron, every Monday 06:00 UTC (10:00 MU)
 * Sends weekly digest to all active subscribers.
 * Protected by CRON_SECRET.
 */

import { NextResponse }  from 'next/server';
import { createClient }  from '@supabase/supabase-js';
import nodemailer        from 'nodemailer';

const PROJECT  = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

const TIPS = [
  'Register for a TAN number with MRA before you start trading — it\'s free and takes 2 days.',
  'SME Mauritius grants require a minimum of 2 supplier quotations — get quotes before applying.',
  'CSG contributions are due by the end of the month following payment, not the end of the quarter.',
  'VAT registration threshold is Rs 3 million per year as of 1 October 2025 (Finance Act 2025).',
  'The Made in Moris label costs Rs 50,000 to certify — it opens export and supermarket doors.',
  'PAYE is due on the last day of the month following the month of payment.',
  'HRDC Training Levy is 1.5% of basic salary, employer only — due on the 28th of each month.',
  'BRN (Business Registration Number) is required for all grants, loans, and tenders in Mauritius.',
];

function weeklyTip(): string {
  const weekNum = Math.floor(Date.now() / (7 * 86_400_000));
  return TIPS[weekNum % TIPS.length];
}

function makeUnsubToken(email: string): string {
  return Buffer.from(email).toString('base64url');
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

function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString('en-MU', {
    day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });
}

function buildDigest(
  votes: Record<string, number>,
  lastRegCheck: { run_at: string; summary: string; status: string } | null,
  topSuggestion: { title: string; votes: number; willing_to_pay: string } | null,
  now: Date,
  email: string
): { subject: string; text: string } {
  const dateStr = now.toLocaleDateString('en-MU', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Indian/Mauritius',
  });

  const voteLines = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((([id, count], i) => `${i + 1}. ${featureLabel(id)} — ${count} vote${count !== 1 ? 's' : ''}`));

  const regLine = lastRegCheck
    ? (lastRegCheck.summary?.includes('verified')
        ? `All rates verified — no changes detected. Last checked: ${fmtDate(lastRegCheck.run_at)}.`
        : `${lastRegCheck.summary ?? lastRegCheck.status} (${fmtDate(lastRegCheck.run_at)})`)
    : 'Not run yet.';

  const suggLine = topSuggestion
    ? `"${topSuggestion.title}" — ${topSuggestion.votes} votes (${topSuggestion.willing_to_pay || 'payment signal unknown'})`
    : 'No suggestions yet — be the first at oubiznes.mu/feedback';

  const token = makeUnsubToken(email);

  return {
    subject: `OuBiznes Weekly — ${dateStr}`,
    text: `OuBiznes Weekly — ${dateStr}

🗳️ WHAT WE'RE BUILDING NEXT (vote now)
${voteLines.join('\n')}
→ Cast your vote at ${SITE_URL}

📋 REGULATORY CHECK
${regLine}

🔧 TOP TOOL IDEA FROM THE COMMUNITY
${suggLine}
→ Suggest your own at ${SITE_URL}/feedback

💡 THIS WEEK'S MAURITIUS BUSINESS TIP
${weeklyTip()}

---
Free tools for Mauritius businesses: ${SITE_URL}
To unsubscribe: ${SITE_URL}/unsubscribe?token=${token}`,
  };
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 503 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Fetch all data in parallel
  const [subsRaw, votesRaw, lastRunRaw, topSugRaw] = await Promise.all([
    db.from('subscribers').select('email').eq('status', 'active'),
    db.from('feature_votes').select('feature_id').eq('project', PROJECT),
    db.from('agent_runs').select('run_at, status, summary')
      .eq('project', PROJECT).eq('agent_name', 'regulatory-check')
      .not('status', 'eq', 'pending_approval')
      .order('run_at', { ascending: false }).limit(1),
    db.from('tool_suggestions').select('title, votes, willing_to_pay')
      .order('votes', { ascending: false }).limit(1),
  ]);

  const subscribers = (subsRaw.data ?? []).map(r => r.email as string);

  const votes: Record<string, number> = {};
  for (const row of (votesRaw.data ?? [])) {
    votes[row.feature_id] = (votes[row.feature_id] ?? 0) + 1;
  }

  const lastRegCheck   = lastRunRaw.data?.[0] ?? null;
  const topSuggestion  = topSugRaw.data?.[0] ?? null;
  const now            = new Date();

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST ?? 'smtp.zoho.com',
    port:   Number(SMTP_PORT ?? 465),
    secure: true,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });

  let sent = 0;
  let failed = 0;

  for (const email of subscribers) {
    const { subject, text } = buildDigest(votes, lastRegCheck, topSuggestion, now, email);
    try {
      await transporter.sendMail({
        from:    `"OuBiznes.mu" <${SMTP_USER}>`,
        to:      email,
        subject,
        text,
      });
      sent++;
    } catch {
      failed++;
    }
  }

  // Log the run
  await db.from('agent_runs').insert({
    project:     PROJECT,
    agent_name:  'weekly-digest',
    status:      failed === 0 ? 'success' : 'warning',
    summary:     `Weekly digest sent to ${sent}/${subscribers.length} active subscribers`,
    details:     { sent, failed, total: subscribers.length },
    flags_count: failed,
  });

  return NextResponse.json({ ok: true, sent, failed, total: subscribers.length });
}
