#!/usr/bin/env node
/**
 * Agent 5 — Regulatory Update Agent (OuBiznes.mu) v2
 *
 * 1. Loads reference values from Supabase regulatory_rates table
 * 2. Fetches official MRA/HRDC/Labour source pages
 * 3. Extracts key values using regex patterns
 * 4. Compares extracted values with stored values:
 *    - match       → "verified"
 *    - different   → writes pending_approval to agent_runs, sends WA + email alert
 *    - unextracted → "unverified" (no false alarm — MRA often uses PDFs)
 * 5. Writes overall run status to agent_runs + spak_status
 *
 * Run:  npm run regulatory-check
 * Schedule: Windows Task Scheduler — weekly Monday 08:00 MU time
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
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.warn('[regulatory] Supabase not configured'); return null; }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function loadRates(db) {
  if (!db) return {};
  const { data, error } = await db.from('regulatory_rates').select('*');
  if (error) { console.error('[regulatory] Failed to load rates:', error.message); return {}; }
  return Object.fromEntries(data.map(r => [r.rate_name, r]));
}

// ── SOURCES + EXTRACTORS ──────────────────────────────────────────────────────
const SOURCES = [
  {
    name: 'MRA — VAT',
    url:  'https://www.mra.mu/index.php/mvat',
    topicKeywords: ['VAT', 'value added'],
    rates: ['vat_standard_rate', 'vat_registration_threshold'],
    extract(text) {
      const out = {};
      const vatM = text.match(/(?:standard\s+rate|vat\s+rate)[^%\d]{0,60}(\d+(?:\.\d+)?)\s*%/i)
                || text.match(/(\d+(?:\.\d+)?)\s*%[^%\n]{0,60}(?:standard|vat\s+rate)/i);
      if (vatM) out['vat_standard_rate'] = vatM[1];

      const thrM = text.match(/Rs\.?\s*([\d,]+)\s*(?:per\s*year|\/\s*year|per\s*annum)/i)
                || text.match(/(3[,\s]?000[,\s]?000)/);
      if (thrM) out['vat_registration_threshold'] = thrM[1].replace(/[,\s]/g, '');
      return out;
    },
  },
  {
    name: 'MRA — PAYE / CSG / NSF',
    url:  'https://www.mra.mu/index.php/employers/employment',
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
      if (b1) out['paye_band_1_rate'] = b1[1];
      const b2 = text.match(/(?:next|second|band\s*2)[^%\d]{0,80}(\d+)\s*%/i);
      if (b2) out['paye_band_2_rate'] = b2[1];
      const b3 = text.match(/(?:above|third|band\s*3|remaining)[^%\d]{0,80}(\d+)\s*%/i);
      if (b3) out['paye_band_3_rate'] = b3[1];

      const csgL  = text.match(/(?:csg|contribution)[^%\d]{0,120}(1\.5)\s*%/i);
      if (csgL) { out['csg_employee_low'] = csgL[1]; out['csg_employer_low'] = csgL[1]; }
      const csgH  = text.match(/(?:csg|contribution)[^%\d]{0,120}(6)\s*%/i);
      if (csgH) out['csg_employer_high'] = csgH[1];
      return out;
    },
  },
  {
    name: 'HRDC — Training Levy',
    url:  'https://www.hrdc.mu/',
    topicKeywords: ['Training Levy', 'levy'],
    rates: ['hrdc_levy_rate'],
    extract(text) {
      const m = text.match(/(?:training\s+levy|levy)[^%\d]{0,80}(\d+(?:\.\d+)?)\s*%/i);
      return m ? { hrdc_levy_rate: m[1] } : {};
    },
  },
  {
    name: 'Labour — Minimum Wage',
    url:  'https://labour.govmu.org/',
    topicKeywords: ['minimum wage', 'salaire'],
    rates: ['minimum_wage'],
    extract(text) {
      const m = text.match(/(?:national\s+minimum\s+wage|minimum\s+wage)[^R\d]{0,60}Rs?\.?\s*([\d,]+)/i)
             || text.match(/Rs?\.?\s*(16[,\s]?500)/i);
      return m ? { minimum_wage: m[1].replace(/[,\s]/g, '') } : {};
    },
  },
];

// ── FETCH ─────────────────────────────────────────────────────────────────────
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'OuBiznes.mu Regulatory Monitor/2.0', Accept: 'text/html' },
      signal:  AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const html = await res.text();
    const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

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
  console.log('  OuBiznes.mu — Agent 5: Regulatory Update Check v2');
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
    const { ok, text, error } = await fetchPage(source.url);

    if (!ok) {
      console.log(`  ✗ Unreachable: ${error}`);
      for (const name of source.rates) unverified.push(name);
      continue;
    }

    const topicFound = source.topicKeywords.find(kw => text.toLowerCase().includes(kw.toLowerCase()));
    if (!topicFound) {
      console.log('  ? Topic keywords not found — page may have been restructured. Marking unverified.');
      for (const name of source.rates) unverified.push(name);
      continue;
    }

    const extracted = source.extract(text);
    console.log(`  ✓ Reachable. Extracted: ${JSON.stringify(extracted)}`);

    for (const rateName of source.rates) {
      const stored = rates[rateName];
      if (!stored) { unverified.push(rateName); continue; }

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
          source_url:  source.url,
          detected_at: timestamp,
        });
      }
    }
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
    await Promise.allSettled([
      sendWhatsApp(alertMsg),
      sendEmail(subject, alertMsg),
    ]);
    console.log(`  Alert sent — action_id: ${change.action_id}`);
  }

  // Overall status
  const status  = changes.length > 0 ? 'warning' : 'success';
  const summary = changes.length === 0 && unverified.length === 0
    ? `All ${verified.length} rates verified ✅`
    : changes.length > 0
      ? `${changes.length} change(s) detected — pending approval`
      : `${verified.length} verified · ${unverified.length} unverified (PDFs/JS pages)`;

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
