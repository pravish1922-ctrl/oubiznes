import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FALLBACK = 'All 8 tools live and monitored. MRA regulatory data verified · Grants data current · Powered by SPAK';

export async function GET() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ status_line: FALLBACK });
  }

  const db = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const { data, error } = await db
    .from('spak_status')
    .select('status_line, checked_at, all_tools_up, tools_up, tools_total')
    .eq('project', 'oubiznes')
    .order('checked_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ status_line: FALLBACK });
  }

  return NextResponse.json({
    status_line:  data.status_line || FALLBACK,
    all_tools_up: data.all_tools_up,
    tools_up:     data.tools_up,
    tools_total:  data.tools_total,
    checked_at:   data.checked_at,
  });
}
