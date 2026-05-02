import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const VALID_FEATURES = new Set(['tiktok', 'website', 'marketplace', 'ai-learning']);

function getDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function fingerprint(request: Request): string {
  const ip  = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const ua  = request.headers.get('user-agent') || '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 16);
}

// GET /api/votes — return { tiktok: 5, website: 3, ... }
export async function GET() {
  if (!process.env.SUPABASE_URL) {
    return NextResponse.json({ tiktok: 0, website: 0, marketplace: 0, 'ai-learning': 0 });
  }

  const db = getDb();
  const { data, error } = await db
    .from('feature_votes')
    .select('feature_id')
    .eq('project', 'oubiznes');

  if (error) {
    return NextResponse.json({ tiktok: 0, website: 0, marketplace: 0, 'ai-learning': 0 });
  }

  const counts: Record<string, number> = { tiktok: 0, website: 0, marketplace: 0, 'ai-learning': 0 };
  for (const row of data) {
    if (counts[row.feature_id] !== undefined) counts[row.feature_id]++;
  }

  return NextResponse.json(counts);
}

// POST /api/votes  body: { feature_id: string, email: string }
export async function POST(request: Request) {
  let featureId: string;
  let email: string;
  try {
    const body = await request.json();
    featureId = body.feature_id;
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!VALID_FEATURES.has(featureId)) {
    return NextResponse.json({ error: 'Unknown feature' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (!process.env.SUPABASE_URL) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const db = getDb();

  // Check for existing vote by this email for this feature
  const { data: existing } = await db
    .from('feature_votes')
    .select('id')
    .eq('project', 'oubiznes')
    .eq('feature_id', featureId)
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  const fp = fingerprint(request);
  const { error } = await db.from('feature_votes').insert({
    project:     'oubiznes',
    feature_id:  featureId,
    email,
    fingerprint: fp,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to record' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
