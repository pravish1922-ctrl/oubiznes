import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ lastVerified: null });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data } = await db
    .from('agent_runs')
    .select('run_at')
    .eq('agent_name', 'regulatory-check')
    .not('status', 'eq', 'pending_approval')
    .order('run_at', { ascending: false })
    .limit(1);

  return NextResponse.json({ lastVerified: data?.[0]?.run_at ?? null });
}
