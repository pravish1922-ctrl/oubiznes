import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json([]);
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data } = await db
    .from('tool_suggestions')
    .select('id, title, problem, target_user, willing_to_pay, votes, created_at')
    .order('votes', { ascending: false })
    .limit(20);

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
  }

  let body: { suggestion_id: string; email: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { suggestion_id, email } = body;
  if (!suggestion_id || !email) {
    return NextResponse.json({ error: 'suggestion_id and email required' }, { status: 400 });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Check for duplicate vote
  const { data: existing } = await db
    .from('tool_suggestion_votes')
    .select('id')
    .eq('suggestion_id', suggestion_id)
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Record vote + increment count (sequential: get current value, then update)
  await db.from('tool_suggestion_votes').insert({ suggestion_id, email });
  const { data: row } = await db.from('tool_suggestions').select('votes').eq('id', suggestion_id).single();
  await db.from('tool_suggestions').update({ votes: (row?.votes ?? 0) + 1 }).eq('id', suggestion_id);

  return NextResponse.json({ ok: true, already: false });
}
