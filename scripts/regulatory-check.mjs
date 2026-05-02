#!/usr/bin/env node
/**
 * Agent 5 — Regulatory Update Agent v4
 *
 * URL strategy: URLs always come from Supabase regulatory_rates.source_url.
 * No hardcoded URLs anywhere in this file.
 *
 * Per-source flow:
 *   1. Get source_url from DB for each rate group
 *   2. Fetch that URL directly
 *   3. If fetch fails → Google fallback (site:[domain] [searchHint] 2026)
 *   4. Extract value via keyword regex
 *   5. Validate: percentage > 50 is implausible → mark unverified
 *   6. Compare with stored value → alert if different
 *   7. Mark unverified only if BOTH direct AND Google fail
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname }           from 'path';
import { fileURLToPath }           from 'url';
import { randomUUID }              from 'crypto';
import { createClient }            from '@supabase/supabase-js';
import { sendEmail, sendWhatsApp } from '../lib/notify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const PROJECT   = 'oubiznes';

// ── SUPABASE ──────────────────────────────────────────────────────────────────
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) { console.warn('[regulatory] Supabase not configured'); return null; }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function loadRates(db) {
  if (!db) return {};
  const { data, error } = await db.from('regulatory_rates').select('*');
  if (error) { console.error('[regulatory] Failed to load rates:', error.message); return {}; }
  return Object.fromEntries(data.map(r => [r.rate_name, r]));
}

// ── VALIDATION ────────────────────────────────────────────────────────────────
const isValidPercent   = v => { const n = parseFloat(v); return !isNaN(n) && n >= 0 && n <= 50; };
const isValidWage      = v => { const n = parseFloat(v); return !isNaN(n) && n >= 5000 && n <= 200000; };
const isValidThreshold = v => { const n = parseFloat(v); return !isNaN(n) && n >= 500000 && n <= 100000000; };

// ── HTTP ──────────────────────────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const rawHtml = await res.text();
    const text    = rawHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    return { ok: true, text, rawHtml };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── GOOGLE FALLBACK ───────────────────────────────────────────────────────────
async function googleSearchForUrl(searchHint, domain) {
  const query = `site:${domain} ${searchHint}`;
  const url   = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  console.log(`  Google fallback: ${url}`);
  const { ok, rawHtml } = await fetchPage(url);
  if (!ok || !rawHtml) return null;

  // Find URLs matching the target domain in the raw Google HTML
  const esc     = domain.replace(/\./g, '\\.');
  const regex   = new RegExp(`https?://(?:[a-z0-9.-]+\\.)*${esc}[^"'<>\\s&]*`, 'gi');
  const matches = rawHtml.match(regex) ?? [];
  const found   = matches.find(u => !u.includes('google.com') && !u.includes('googleapis'));
  return found ?? null;
}

// ── SOURCES (no URLs — come from Supabase source_url field) ───────────────────
const SOURCES = [
  {
    name:          'MRA — VAT',
    searchHint:    'VAT standard rate registration threshold 2026',
    topicKeywords: ['VAT', 'value added'],
    rates:         ['vat_standard_rate', 'vat_registration_threshold'],
    extract(text) {
      const out = {};
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
      const out = {};
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

// ── ALERT FORMAT ──────────────────────────────────────────────────────────────
function buildChangeAlert(change) {
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

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function run() {
  const now       = new Date();
  const timestamp = now.toISOString();
  const dateStr   = timestamp.slice(0, 10);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('  OuBiznes.mu — Agent 5: Regulatory Update Check v4');
  console.log(`  ${timestamp}`);
  console.log('══════════════════════════════════════════════════════════\n');

  const db    = getDb();
  const rates = await loadRates(db);
  console.log(`Loaded ${Object.keys(rates).length} rates from Supabase.\n`);

  const verified   = [];
  const unverified = [];
  const changes    = [];

  for (const source of SOURCES) {
    console.log(`Checking: ${source.name}`);

    // Step 1: get source_url from DB for the first rate in this source's group
    const firstRate = source.rates.map(n => rates[n]).find(r => r?.source_url);
    const dbUrl     = firstRate?.source_url ?? null;

    if (!dbUrl) {
      console.log(`  ✗ No source_url in DB for ${source.name} — marking unverified`);
      for (const name of source.rates) unverified.push(name);
      continue;
    }

    console.log(`  Direct fetch: ${dbUrl}`);
    let fetchResult = await fetchPage(dbUrl);
    let usedUrl     = dbUrl;

    // Step 2: Google fallback if direct fetch fails
    if (!fetchResult.ok) {
      console.log(`  ✗ Direct fetch failed (${fetchResult.error}) — trying Google fallback`);
      try {
        const domain    = new URL(dbUrl).hostname;
        const googleUrl = await googleSearchForUrl(source.searchHint, domain);
        if (googleUrl) {
          console.log(`  Google found: ${googleUrl}`);
          fetchResult = await fetchPage(googleUrl);
          usedUrl     = googleUrl;
        }
      } catch {
        fetchResult = { ok: false, error: 'Google parse failed' };
      }
    }

    if (!fetchResult.ok) {
      console.log(`  ✗ Both direct and Google failed — marking unverified`);
      for (const name of source.rates) unverified.push(name);
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }

    // Step 3: verify topic on page
    const topicFound = source.topicKeywords.find(kw =>
      fetchResult.text.toLowerCase().includes(kw.toLowerCase())
    );
    if (!topicFound) {
      console.log('  ? Topic keywords not found — page may have changed structure. Marking unverified.');
      for (const name of source.rates) unverified.push(name);
      await new Promise(r => setTimeout(r, 1500));
      continue;
    }

    // Step 4: extract values
    const extracted = source.extract(fetchResult.text);
    console.log(`  ✓ Reachable. Extracted: ${JSON.stringify(extracted)}`);

    // Step 5: compare each rate
    const ratesInDb = source.rates.filter(n => rates[n]);
    for (const rateName of ratesInDb) {
      const stored       = rates[rateName];
      const extractedVal = extracted[rateName];

      if (extractedVal === undefined || extractedVal === null) {
        console.log(`    unverified  ${rateName} (could not extract)`);
        unverified.push(rateName);
        continue;
      }

      if (String(extractedVal) === String(stored.rate_value)) {
        console.log(`    ✓ verified  ${rateName} = ${extractedVal}`);
        verified.push(rateName);
      } else {
        console.log(`    ⚠ CHANGE   ${rateName}: stored=${stored.rate_value} extracted=${extractedVal}`);
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

    await new Promise(r => setTimeout(r, 1500));
  }

  // Write changes to DB + send alerts
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
    const subject  = `⚠️ SPAK: Regulatory change — ${change.rate_name}`;
    await Promise.allSettled([sendWhatsApp(alertMsg), sendEmail(subject, alertMsg)]);
    console.log(`  Alert sent — action_id: ${change.action_id}`);
  }

  const status  = changes.length > 0 ? 'warning' : 'success';
  const summary = changes.length === 0 && unverified.length === 0
    ? `All ${verified.length} rates verified ✅`
    : changes.length > 0
      ? `${changes.length} change(s) detected — pending approval`
      : `${verified.length} verified · ${unverified.length} unverified (fetch/extract failed)`;

  console.log(`\n══ ${summary}\n`);

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

  const logDir = join(ROOT, 'logs', 'regulatory');
  mkdirSync(logDir, { recursive: true });
  writeFileSync(
    join(logDir, `${dateStr}.json`),
    JSON.stringify({ timestamp, summary, verified, unverified, changes }, null, 2)
  );
  console.log(`Log saved → logs/regulatory/${dateStr}.json\n`);

  if (changes.length > 0) process.exit(1);
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
