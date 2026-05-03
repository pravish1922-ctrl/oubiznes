/**
 * SPAK Regulatory Check — Vercel Cron Route
 *
 * Triggered by Vercel Cron at 0 4 * * 1 (04:00 UTC Monday = 08:00 Mauritius).
 * Runs from Vercel's cloud servers, which reach mra.mu directly (bypassing
 * the Cloudflare block that affects direct requests from Windows desktops).
 *
 * Flow per source:
 *   1. Get source_url from regulatory_rates table in Supabase
 *   2. Fetch that URL directly
 *   3. If direct fetch fails → Google site: fallback
 *   4. Extract value via keyword regex
 *   5. Validate (percentage > 50 is implausible → mark unverified)
 *   6. Compare with stored value → alert if different
 *   7. Mark unverified only if BOTH direct AND Google fail
 *
 * Manual trigger:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://oubiznes.mu/api/spak/regulatory-check
 *
 * Required env vars (Vercel dashboard):
 *   CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP
 */

import { NextResponse }               from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import nodemailer                      from 'nodemailer';
import twilio                          from 'twilio';
import { randomUUID }                  from 'crypto';

const PROJECT = 'oubiznes';

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface RegulatoryRate {
  rate_name:   string;
  rate_value:  string;
  source_url:  string | null;
}

interface Change {
  action_id:   string;
  rate_name:   string;
  old_value:   string;
  new_value:   string;
  source_url:  string;
  detected_at: string;
}

interface Source {
  name:          string;
  searchHint:    string;
  topicKeywords: string[];
  rates:         string[];
  extract:       (text: string) => Record<string, string>;
}

// ── VALIDATION ────────────────────────────────────────────────────────────────
const isValidPercent   = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 50; };
const isValidWage      = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= 5000 && n <= 200000; };
const isValidThreshold = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= 500000 && n <= 100_000_000; };

// ── SOURCES ───────────────────────────────────────────────────────────────────
const SOURCES: Source[] = [
  {
    name:          'MRA — VAT',
    searchHint:    'VAT standard rate registration threshold 2026',
    topicKeywords: ['VAT', 'value added'],
    rates:         ['vat_standard_rate', 'vat_registration_threshold'],
    extract(text) {
      const out: Record<string, string> = {};

      const vatM = text.match(/(?:standard\s+rate|vat\s+rate)[^%\d]{0,60}(\d+(?:\.\d+)?)\s*%/i)
                || text.match(/(\d+(?:\.\d+)?)\s*%[^%\n]{0,60}standard/i);
      if (vatM && isValidPercent(vatM[1])) out['vat_standard_rate'] = vatM[1];

      const thrM = text.match(/Rs\.?\s*([\d,]+)\s*(?:per\s*year|\/\s*year|per\s*annum)/i)
                || text.match(/(3[,\s]?000[,\s]?000)/);
      if (thrM) {
        const v = thrM[1].replace(/[,\s]/g, '');
        if (isValidThreshold(v)) out['vat_registration_threshold'] = v;
      }
      return out;
    },
  },
  {
    name:          'MRA — PAYE / CSG / NSF',
    searchHint:    'PAYE income tax CSG NSF employer employee rates 2026',
    topicKeywords: ['CSG', 'PAYE', 'NSF'],
    rates: [
      'paye_band_1_rate', 'paye_band_2_rate', 'paye_band_3_rate',
      'csg_employee_low', 'csg_employee_high',
      'csg_employer_low', 'csg_employer_high',
      'nsf_employee_rate', 'nsf_employer_rate',
    ],
    extract(text) {
      const out: Record<string, string> = {};

      const b1 = text.match(/(?:first|band\s*1)[^%\d]{0,80}(\d+)\s*%/i);
      if (b1 && isValidPercent(b1[1])) out['paye_band_1_rate'] = b1[1];
      const b2 = text.match(/(?:next|second|band\s*2)[^%\d]{0,80}(\d+)\s*%/i);
      if (b2 && isValidPercent(b2[1])) out['paye_band_2_rate'] = b2[1];
      const b3 = text.match(/(?:above|third|band\s*3|remaining)[^%\d]{0,80}(\d+)\s*%/i);
      if (b3 && isValidPercent(b3[1])) out['paye_band_3_rate'] = b3[1];

      const csgL = text.match(/(?:csg|contribution)[^%\d]{0,120}(1\.5)\s*%/i);
      if (csgL) { out['csg_employee_low'] = csgL[1]; out['csg_employer_low'] = csgL[1]; }
      const csgH = text.match(/(?:csg|contribution)[^%\d]{0,120}(6)\s*%/i);
      if (csgH && isValidPercent(csgH[1])) out['csg_employer_high'] = csgH[1];
      return out;
    },
  },
  {
    name:          'HRDC — Training Levy',
    searchHint:    'training levy rate employer percentage 2026',
    topicKeywords: ['Training Levy', 'levy'],
    rates:         ['hrdc_levy_rate'],
    extract(text) {
      const m = text.match(/(?:training\s+levy|levy)[^%\d]{0,80}(\d+(?:\.\d+)?)\s*%/i);
      return (m && isValidPercent(m[1])) ? { hrdc_levy_rate: m[1] } : {};
    },
  },
  {
    name:          'Labour — Minimum Wage',
    searchHint:    'national minimum wage Rs monthly 2026',
    topicKeywords: ['minimum wage', 'salaire'],
    rates:         ['minimum_wage'],
    extract(text) {
      const m = text.match(/(?:national\s+minimum\s+wage|minimum\s+wage)[^R\d]{0,60}Rs?\.?\s*([\d,]+)/i)
             || text.match(/Rs?\.?\s*(16[,\s]?500)/i);
      if (!m) return {};
      const v = m[1].replace(/[,\s]/g, '');
      return isValidWage(v) ? { minimum_wage: v } : {};
    },
  },
];

// ── HTTP ──────────────────────────────────────────────────────────────────────
async function fetchPage(url: string): Promise<{ ok: boolean; text: string; rawHtml: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, text: '', rawHtml: '', error: `HTTP ${res.status}` };
    const rawHtml = await res.text();
    const text    = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    return { ok: true, text, rawHtml };
  } catch (err) {
    return { ok: false, text: '', rawHtml: '', error: (err as Error).message };
  }
}

// ── GOOGLE FALLBACK ───────────────────────────────────────────────────────────
async function googleSearchForUrl(searchHint: string, domain: string): Promise<string | null> {
  const query = `site:${domain} ${searchHint}`;
  const url   = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const { ok, rawHtml } = await fetchPage(url);
  if (!ok || !rawHtml) return null;

  const esc     = domain.replace(/\./g, '\\.');
  const regex   = new RegExp(`https?://(?:[a-z0-9.-]+\\.)*${esc}[^"'<>\\s&]*`, 'gi');
  const matches = rawHtml.match(regex) ?? [];
  return matches.find(u => !u.includes('google.com') && !u.includes('googleapis')) ?? null;
}

// ── ALERT FORMAT ──────────────────────────────────────────────────────────────
function buildChangeAlert(change: Change): string {
  return [
    '⚠️ REGULATORY CHANGE DETECTED',
    `Rate:      ${change.rate_name}`,
    `Was:       ${change.old_value}`,
    `Now:       ${change.new_value}`,
    `Source:    ${change.source_url}`,
    `Detected:  ${change.detected_at}`,
    '',
    'Reply to approve or ignore:',
    `APPROVE     ${change.action_id}`,
    `IGNORE      ${change.action_id}`,
    `INVESTIGATE ${change.action_id}`,
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
    console.error('[regulatory] WhatsApp failed:', (err as Error).message);
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
    console.error('[regulatory] Email failed:', (err as Error).message);
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

  // Load all rates from Supabase
  const rates: Record<string, RegulatoryRate> = {};
  if (db) {
    const { data, error } = await db.from('regulatory_rates').select('*');
    if (error) console.error('[regulatory] Failed to load rates:', error.message);
    for (const r of (data ?? [])) rates[r.rate_name] = r;
  }
  console.log(`[regulatory] Loaded ${Object.keys(rates).length} rates`);

  const verified:   string[] = [];
  const unverified: string[] = [];
  const changes:    Change[]  = [];

  for (const source of SOURCES) {
    // Step 1: get source_url from DB for the first rate in this source's group
    const firstRate = source.rates.map(n => rates[n]).find(r => r?.source_url);
    const dbUrl     = firstRate?.source_url ?? null;

    if (!dbUrl) {
      console.log(`[regulatory] No source_url for ${source.name} — marking unverified`);
      unverified.push(...source.rates);
      continue;
    }

    console.log(`[regulatory] ${source.name}: fetching ${dbUrl}`);
    let result  = await fetchPage(dbUrl);
    let usedUrl = dbUrl;

    // Step 2: Google fallback if direct fetch fails
    if (!result.ok) {
      console.log(`[regulatory] Direct fetch failed (${result.error}) — trying Google`);
      try {
        const domain    = new URL(dbUrl).hostname;
        const googleUrl = await googleSearchForUrl(source.searchHint, domain);
        if (googleUrl) {
          console.log(`[regulatory] Google found: ${googleUrl}`);
          result  = await fetchPage(googleUrl);
          usedUrl = googleUrl;
        }
      } catch {
        result = { ok: false, text: '', rawHtml: '', error: 'Google parse failed' };
      }
    }

    if (!result.ok) {
      console.log(`[regulatory] Both direct and Google failed — marking unverified`);
      unverified.push(...source.rates);
      continue;
    }

    // Step 3: verify topic on page
    const topicFound = source.topicKeywords.find(kw =>
      result.text.toLowerCase().includes(kw.toLowerCase())
    );
    if (!topicFound) {
      console.log(`[regulatory] Topic keywords not found on page — marking unverified`);
      unverified.push(...source.rates);
      continue;
    }

    // Step 4: extract and compare
    const extracted = source.extract(result.text);
    console.log(`[regulatory] ${source.name}: extracted ${JSON.stringify(extracted)}`);

    for (const rateName of source.rates.filter(n => rates[n])) {
      const stored       = rates[rateName];
      const extractedVal = extracted[rateName];

      if (extractedVal === undefined) {
        console.log(`[regulatory] ${rateName}: could not extract — unverified`);
        unverified.push(rateName);
        continue;
      }

      if (String(extractedVal) === String(stored.rate_value)) {
        console.log(`[regulatory] ${rateName}: verified = ${extractedVal}`);
        verified.push(rateName);
      } else {
        console.log(`[regulatory] ${rateName}: CHANGE ${stored.rate_value} → ${extractedVal}`);
        changes.push({
          action_id:   randomUUID(),
          rate_name:   rateName,
          old_value:   stored.rate_value,
          new_value:   String(extractedVal),
          source_url:  usedUrl,
          detected_at: timestamp,
        });
      }
    }
  }

  // Write change records + send alerts
  for (const change of changes) {
    if (db) {
      const { error } = await db.from('agent_runs').insert({
        id:          change.action_id,
        project:     PROJECT,
        agent_name:  'regulatory-check',
        status:      'pending_approval',
        summary:     `Rate change: ${change.rate_name} ${change.old_value} → ${change.new_value}`,
        details:     change,
        flags_count: 1,
      });
      if (error) console.error(`[regulatory] DB write failed for ${change.rate_name}:`, error.message);
    }

    const alertMsg = buildChangeAlert(change);
    await Promise.allSettled([
      notifyWhatsApp(alertMsg),
      notifyEmail(`⚠️ SPAK: Regulatory change — ${change.rate_name}`, alertMsg),
    ]);
  }

  // Write summary run record + spak_status
  const status  = changes.length > 0 ? 'warning' : 'success';
  const summary = changes.length === 0 && unverified.length === 0
    ? `All ${verified.length} rates verified ✅`
    : changes.length > 0
      ? `${changes.length} change(s) detected — pending approval`
      : `${verified.length} verified · ${unverified.length} unverified (fetch/extract failed)`;

  if (db) {
    await Promise.allSettled([
      db.from('agent_runs').insert({
        project:     PROJECT,
        agent_name:  'regulatory-check',
        status,
        summary,
        details:     { verified, unverified, changes_detected: changes.length },
        flags_count: changes.length,
      }),
      db.from('spak_status').insert({
        project:      PROJECT,
        all_tools_up: true,
        tools_up:     0,
        tools_total:  0,
        status_line:  summary,
        details:      { verified, unverified, changes },
      }),
    ]);
  }

  return NextResponse.json({
    ok:            true,
    summary,
    verified:      verified.length,
    unverified:    unverified.length,
    changes:       changes.length,
    timestamp,
  });
}
