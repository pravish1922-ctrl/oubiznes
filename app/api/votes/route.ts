import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const VALID_FEATURES = new Set(['tiktok', 'website', 'marketplace', 'ai-learning']);

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function fingerprint(request: Request): string {
  const ip  = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const ua  = request.headers.get('user-agent') || '';
  return createHash('sha256').update(`${ip}|${ua}`).digest('hex').slice(0, 16);
}

// GET /api/votes — return { tiktok: 5, website: 3, ... }
export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ tiktok: 0, website: 0, marketplace: 0, 'ai-learning': 0 });
  }

  const { data, error } = await db
    .from('feature_votes')
    .select('feature_id')
    .eq('project', 'oubiznes');

  if (error) {
    console.error('[votes GET] Supabase error:', error.message, error.code);
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

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Check for existing vote from this email for this feature
  const { data: existing, error: checkError } = await db
    .from('feature_votes')
    .select('id')
    .eq('project', 'oubiznes')
    .eq('feature_id', featureId)
    .eq('email', email)
    .maybeSingle();

  if (checkError) {
    console.error('[votes POST] Supabase check error:', checkError.message, checkError.code);
    return NextResponse.json({ error: 'Failed to check existing vote' }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  const fp = fingerprint(request);
  const { error: insertError } = await db.from('feature_votes').insert({
    project:     'oubiznes',
    feature_id:  featureId,
    email,
    fingerprint: fp,
  });

  if (insertError) {
    console.error('[votes POST] Supabase insert error:', insertError.message, insertError.code);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
