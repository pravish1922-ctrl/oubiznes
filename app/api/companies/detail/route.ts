import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';

// ── PARSERS ───────────────────────────────────────────────────────────────────
// unpdf produces flat space-separated text (no newlines); all parsers work on
// that format.

function parseRegisteredAddress(text: string): string {
  const match = text.match(/Registered Office Address: (.+?) Effective Date/);
  return match ? match[1].trim() : '';
}

function parseNatureOfBusiness(text: string): string[] {
  const activities = new Set<string>();
  const headerIdx = text.indexOf('Nature of Business Principal Place of Business');
  if (headerIdx === -1) return [];
  const bodyStart = headerIdx + 'Nature of Business Principal Place of Business'.length;
  // Section ends at "of NPage" (footer) or "Shareholders Name"
  const endMatch = /of \d+Page|\bShareholders Name\b/.exec(text.slice(bodyStart));
  const section = text.slice(bodyStart, endMatch ? bodyStart + endMatch.index : undefined);

  // Entries are separated by " . " (space-dot-space); first split element is empty/whitespace
  const entries = section.split(/ \. /);
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/);
    // Activity name uses mixed-case; address is ALL-CAPS.
    // Find the last word containing a lowercase letter — everything up to it is the activity.
    let lastMixedIdx = -1;
    for (let i = 0; i < words.length; i++) {
      if (/[a-z()/.\\]/.test(words[i])) lastMixedIdx = i;
    }
    const activity = lastMixedIdx >= 0
      ? words.slice(0, lastMixedIdx + 1).join(' ').trim()
      : words.slice(0, Math.min(3, words.length)).join(' ').trim();
    if (activity) activities.add(activity);
  }
  return [...activities];
}

const KNOWN_POSITIONS = new Set(['DIRECTOR', 'AUDITOR', 'SECRETARY', 'OFFICER', 'CHAIRMAN', 'MANAGER']);

function parseOfficeBearers(text: string): Array<{ position: string; name: string; appointedDate: string }> {
  const HEADER = 'Office Bearers Position Name Service Address Appointed Date ';
  const sectionStart = text.indexOf(HEADER);
  if (sectionStart === -1) return [];

  const bodyStart = sectionStart + HEADER.length;
  // Section ends at annual returns or next major section
  const endMatch = /Annual Return|of \d+Page \d/.exec(text.slice(bodyStart));
  const section = text.slice(bodyStart, endMatch ? bodyStart + endMatch.index : undefined);

  const bearers: Array<{ position: string; name: string; appointedDate: string }> = [];
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = dateRegex.exec(section)) !== null) {
    const chunk = section.slice(lastIdx, m.index).trim();
    const date = m[1];
    lastIdx = m.index + m[1].length;
    if (!chunk) continue;

    // Find the first KNOWN_POSITION word in the flat chunk
    const words = chunk.split(/\s+/).filter(Boolean);
    let posIdx = -1;
    for (let i = 0; i < words.length; i++) {
      if (KNOWN_POSITIONS.has(words[i])) { posIdx = i; break; }
    }
    if (posIdx === -1) continue;

    const position = words[posIdx];
    const nameWords: string[] = [];
    for (const word of words.slice(posIdx + 1)) {
      if (/^\d/.test(word)) break;
      if (nameWords.length >= 4) break;
      nameWords.push(word);
    }

    bearers.push({ position, name: nameWords.join(' '), appointedDate: date });
  }

  return bearers;
}

// ── ROUTE ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgNo = searchParams.get('orgNo');
  if (!orgNo) return NextResponse.json({ error: 'Missing orgNo' }, { status: 400 });

  try {
    const res = await fetch(
      `https://onlinesearch.mns.mu/onlinesearch/company/printCompanyDetails?orgNo=${encodeURIComponent(orgNo)}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://onlinesearch.mns.mu/' } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });

    return NextResponse.json({
      registeredAddress: parseRegisteredAddress(text),
      natureOfBusiness:  parseNatureOfBusiness(text),
      officeBearers:     parseOfficeBearers(text),
    });
  } catch (err) {
    console.error('Detail route error:', err);
    return NextResponse.json({ error: 'Detail not available' });
  }
}
