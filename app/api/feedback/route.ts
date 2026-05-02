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
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, email, ...fields } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const db = getDb();

  if (type === 'profile') {
    const { error } = await db.from('business_profiles').insert({
      email,
      business_name:     fields.businessName || null,
      business_type:     fields.businessType || null,
      industry:          fields.industry || null,
      biggest_challenge: fields.biggestChallenge || null,
    });
    if (error) return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === 'suggestion') {
    if (!fields.title?.trim()) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }
    const { error } = await db.from('tool_suggestions').insert({
      email,
      title:          fields.title.trim(),
      problem:        fields.problem || null,
      target_user:    fields.targetUser || null,
      willing_to_pay: fields.willingToPay || null,
    });
    if (error) return NextResponse.json({ error: 'Failed to save suggestion' }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
