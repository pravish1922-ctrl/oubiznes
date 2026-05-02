import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: Request) {
  let email: string;
  try {
    const body = await request.json();
    email = (body.email || '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }

  const db = getDb();

  // Write to both tables in parallel
  const [emailSubsResult, subscribersResult] = await Promise.all([
    db.from('email_subscribers').insert({ project: 'oubiznes', email, source: 'home_strip' }),
    db.from('subscribers').insert({ email, source: 'homepage-notify' }),
  ]);

  const alreadyInEmailSubs = emailSubsResult.error?.code === '23505';
  const alreadyInSubs      = subscribersResult.error?.code === '23505';
  const already            = alreadyInEmailSubs || alreadyInSubs;

  // A non-duplicate error from either table is a real failure
  const hardError =
    (emailSubsResult.error && !alreadyInEmailSubs) ||
    (subscribersResult.error && !alreadyInSubs);

  if (hardError) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, already });
}
