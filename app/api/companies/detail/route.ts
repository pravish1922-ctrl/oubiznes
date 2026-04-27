import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

// ── PARSERS ───────────────────────────────────────────────────────────────────

function parseRegisteredAddress(text: string): string {
  const match = text.match(/Registered Office Address: ([^\n]+)\n([^\n]*)/);
  if (!match) return '';
  const line1 = match[1].trim();
  const line2 = match[2].trim();
  // Include the continuation line (e.g. "MAURITIUS") if it's short and not a label
  if (line2 && !line2.includes(':') && line2.length < 60) {
    return `${line1}, ${line2}`;
  }
  return line1;
}

function parseNatureOfBusiness(text: string): string[] {
  const activities = new Set<string>();
  for (const line of text.split('\n')) {
    if (!line.startsWith('. ')) continue;
    const content = line.slice(2);
    const words = content.split(' ');
    // Activity name uses mixed-case; address is ALL-CAPS.
    // Find the last word containing a lowercase letter — everything up to it is the activity.
    let lastMixedIdx = -1;
    for (let i = 0; i < words.length; i++) {
      if (/[a-z()/.\\]/.test(words[i])) lastMixedIdx = i;
    }
    const activity = lastMixedIdx >= 0
      ? words.slice(0, lastMixedIdx + 1).join(' ').trim()
      : words.slice(0, Math.min(3, words.length)).join(' ').trim(); // all-caps fallback
    if (activity) activities.add(activity);
  }
  return [...activities];
}

const KNOWN_POSITIONS = new Set(['DIRECTOR', 'AUDITOR', 'SECRETARY', 'OFFICER', 'CHAIRMAN', 'MANAGER']);

function parseOfficeBearers(text: string): Array<{ position: string; name: string; appointedDate: string }> {
  const HEADER = 'Office Bearers\nPosition Name Service Address Appointed Date\n';
  const sectionStart = text.indexOf(HEADER);
  if (sectionStart === -1) return [];

  const bodyStart = sectionStart + HEADER.length;
  const endMatch = /\nof \d+\t/.exec(text.slice(bodyStart));
  const section = text.slice(bodyStart, endMatch ? bodyStart + endMatch.index : undefined);

  const bearers: Array<{ position: string; name: string; appointedDate: string }> = [];

  // Each record ends with a DD/MM/YYYY date — use that as the delimiter.
  const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = dateRegex.exec(section)) !== null) {
    const chunk = section.slice(lastIdx, m.index).trim();
    const date = m[1];
    lastIdx = m.index + m[1].length;

    if (!chunk) continue;

    const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);

    // Find the line that starts with a known position keyword
    let posLine = '';
    let posLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (KNOWN_POSITIONS.has(lines[i].split(' ')[0])) {
        posLine = lines[i];
        posLineIdx = i;
        break;
      }
    }
    if (!posLine) continue;

    const position = posLine.split(' ')[0];
    const rest = posLine.slice(position.length + 1);
    const words = rest.split(/\s+/).filter(Boolean);

    // Collect name words until we hit a digit (address starts with number) or hit 4 words
    const nameWords: string[] = [];
    for (const word of words) {
      if (/^\d/.test(word)) break;
      if (nameWords.length >= 4) break;
      nameWords.push(word);
    }

    // Check the next line for a name continuation (e.g. "DEVI" after "JUGASING HARRAH KREETI")
    if (posLineIdx + 1 < lines.length && nameWords.length < 4) {
      const nextLine = lines[posLineIdx + 1];
      if (/^[A-Z\s]+$/.test(nextLine) && nextLine.length < 30 && !/\d/.test(nextLine)) {
        const extras = nextLine.split(/\s+/).filter(Boolean);
        nameWords.push(...extras.slice(0, 4 - nameWords.length));
      }
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
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    // getText() returns a TextResult object; .text is the full concatenated string
    const result = await parser.getText() as unknown as { text: string };

    return NextResponse.json({
      registeredAddress: parseRegisteredAddress(result.text),
      natureOfBusiness:  parseNatureOfBusiness(result.text),
      officeBearers:     parseOfficeBearers(result.text),
    });
  } catch {
    return NextResponse.json({ error: 'Detail not available' });
  }
}
