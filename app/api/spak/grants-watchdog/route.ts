/**
 * Agent 3 — Grants Watchdog
 *
 * Monitors SMEDA, EDB, DBM pages for content changes.
 * URLs come from the watched_pages table (category='grants') — never hardcoded.
 * Scheduled Wednesday 05:00 UTC (09:00 Mauritius).
 * Alerts via WhatsApp + email when a page changes.
 *
 * Manual trigger:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://oubiznes.mu/api/spak/grants-watchdog
 */

import { NextResponse }               from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer                      from 'nodemailer';
import twilio                          from 'twilio';
import { createHash }                  from 'crypto';

const PROJECT = 'oubiznes';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface WatchedPage {
  id:            string;
  source_name:   string;
  url:           string;
  content_hash:  string | null;
  excerpt:       string | null;
}

interface WatchResult {
  source_name: string;
  url:         string;
  status:      'changed' | 'unchanged' | 'unreachable' | 'new';
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function fetchStripped(url: string): Promise<{ ok: boolean; text: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { ok: false, text: '', error: `HTTP ${res.status}` };
    const text = stripHtml(await res.text());
    return { ok: true, text };
  } catch (err) {
    return { ok: false, text: '', error: (err as Error).message };
  }
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
    console.error('[grants-watchdog] WhatsApp failed:', (err as Error).message);
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
    console.error('[grants-watchdog] Email failed:', (err as Error).message);
  }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timestamp = new Date().toISOString();

  const db: SupabaseClient | null =
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
      : null;

  if (!db) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  // Load grant pages from DB
  const { data: pages, error } = await db
    .from('watched_pages')
    .select('id, source_name, url, content_hash, excerpt')
    .eq('project', PROJECT)
    .eq('category', 'grants');

  if (error) {
    console.error('[grants-watchdog] Failed to load pages:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results:  WatchResult[] = [];
  const changed:  WatchedPage[] = [];
  const alerts:   string[]      = [];

  for (const page of (pages ?? []) as WatchedPage[]) {
    const { ok, text, error: fetchErr } = await fetchStripped(page.url);

    if (!ok) {
      console.log(`[grants-watchdog] ${page.source_name}: unreachable — ${fetchErr}`);
      results.push({ source_name: page.source_name, url: page.url, status: 'unreachable' });
      await db.from('watched_pages').update({ last_checked: timestamp }).eq('id', page.id);
      continue;
    }

    const newHash  = hashText(text);
    const excerpt  = text.slice(0, 500);
    const isNew    = !page.content_hash;
    const isChange = !isNew && page.content_hash !== newHash;

    await db.from('watched_pages').update({
      content_hash: newHash,
      excerpt,
      last_checked: timestamp,
      ...(isChange ? { last_changed: timestamp } : {}),
    }).eq('id', page.id);

    if (isNew) {
      console.log(`[grants-watchdog] ${page.source_name}: baseline saved`);
      results.push({ source_name: page.source_name, url: page.url, status: 'new' });
    } else if (isChange) {
      console.log(`[grants-watchdog] ${page.source_name}: CHANGED`);
      results.push({ source_name: page.source_name, url: page.url, status: 'changed' });
      changed.push(page);
      alerts.push(
        `📋 ${page.source_name}\n${page.url}\n\nPrevious excerpt:\n${page.excerpt ?? '(none)'}\n\nNew excerpt:\n${excerpt}`
      );
    } else {
      console.log(`[grants-watchdog] ${page.source_name}: unchanged`);
      results.push({ source_name: page.source_name, url: page.url, status: 'unchanged' });
    }
  }

  const summary = changed.length === 0
    ? `Grants watchdog: ${results.length} pages checked, no changes`
    : `Grants watchdog: ${changed.length} page(s) changed — review needed`;

  // Alert on changes
  if (changed.length > 0) {
    const message = `🔔 GRANT SOURCE CHANGED\n\n${alerts.join('\n\n---\n\n')}`;
    await Promise.allSettled([
      notifyWhatsApp(message),
      notifyEmail(`⚠️ SPAK: Grant source changed — ${changed.map(p => p.source_name).join(', ')}`, message),
    ]);
  }

  await db.from('agent_runs').insert({
    project:     PROJECT,
    agent_name:  'grants-watchdog',
    status:      changed.length > 0 ? 'warning' : 'success',
    summary,
    details:     { results, changed: changed.length, checked: results.length },
    flags_count: changed.length,
  });

  return NextResponse.json({ ok: true, summary, results });
}
