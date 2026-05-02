/**
 * POST /api/spak/approve
 * Body: { action_id: string, decision: "approve" | "ignore" | "investigate" }
 * Protected by CRON_SECRET header.
 *
 * approve:     updates regulatory_rates with new value, marks agent_runs as "approved"
 * ignore:      marks agent_runs as "ignored"
 * investigate: marks agent_runs as "investigating", surfaces in next morning brief
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

function getDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function notify(subject: string, body: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP,
          SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;

  await Promise.allSettled([
    // WhatsApp
    (async () => {
      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !OPERATOR_WHATSAPP) return;
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.messages.create({
        from: TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886',
        to:   OPERATOR_WHATSAPP,
        body,
      });
    })(),
    // Email
    (async () => {
      if (!SMTP_USER || !SMTP_PASS) return;
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST ?? 'smtp.zoho.com', port: Number(SMTP_PORT ?? 465), secure: true,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"SPAK · OuBiznes" <${SMTP_USER}>`,
        to:   REGULATORY_EMAIL_TO ?? SMTP_USER,
        subject, text: body,
      });
    })(),
  ]);
}

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let action_id: string, decision: string;
  try {
    const body = await request.json();
    action_id = body.action_id;
    decision  = body.decision;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!action_id || !['approve', 'ignore', 'investigate'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid action_id or decision' }, { status: 400 });
  }

  const db = getDb();

  // Load the pending agent_run
  const { data: run, error: runErr } = await db
    .from('agent_runs')
    .select('*')
    .eq('id', action_id)
    .eq('status', 'pending_approval')
    .maybeSingle();

  if (runErr || !run) {
    return NextResponse.json({ error: 'Action not found or already resolved' }, { status: 404 });
  }

  const { rate_name, new_value, old_value } = run.details as Record<string, string>;
  const newStatus = decision === 'approve' ? 'approved' : decision === 'ignore' ? 'ignored' : 'investigating';

  // Update agent_run status
  await db.from('agent_runs').update({ status: newStatus }).eq('id', action_id);

  if (decision === 'approve' && rate_name && new_value) {
    // Update regulatory_rates with the new value
    await db.from('regulatory_rates')
      .update({ rate_value: new_value, last_changed: new Date().toISOString(), last_verified: new Date().toISOString() })
      .eq('rate_name', rate_name);

    const msg = `✅ Regulatory rate APPROVED\nRate: ${rate_name}\n${old_value} → ${new_value}\nUpdated in database.`;
    await notify(`SPAK: Rate approved — ${rate_name}`, msg);
    return NextResponse.json({ ok: true, status: 'approved', rate_name, new_value });
  }

  if (decision === 'ignore') {
    const msg = `⏭️ Regulatory change IGNORED\nRate: ${rate_name}\nNo action taken. Stored value remains ${old_value}.`;
    await notify(`SPAK: Rate change ignored — ${rate_name}`, msg);
    return NextResponse.json({ ok: true, status: 'ignored', rate_name });
  }

  // investigate
  const msg = `🔍 Regulatory change flagged for INVESTIGATION\nRate: ${rate_name}\nWas: ${old_value}\nDetected: ${new_value}\nWill appear in tomorrow's morning brief.`;
  await notify(`SPAK: Rate under investigation — ${rate_name}`, msg);
  return NextResponse.json({ ok: true, status: 'investigating', rate_name });
}
