import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const PROJECT  = 'oubiznes';
const SITE_URL = 'https://oubiznes.mu';

function getDb() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function makeUnsubscribeToken(email: string): string {
  return Buffer.from(email).toString('base64url');
}

async function sendTransactionalEmail(to: string, subject: string, text: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) return;

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST ?? 'smtp.zoho.com',
    port:   Number(SMTP_PORT ?? 465),
    secure: true,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from:    `"OuBiznes.mu" <${SMTP_USER}>`,
    to,
    subject,
    text,
  }).catch(err => console.error('[subscribe] Email send failed:', err.message));
}

const TOOLS_LIST = `• Business Structure Advisor — Sole trader vs Ltd? 5 questions, clear answer.
• BRN Lookup — Find any registered company in Mauritius.
• Business Plan Generator — Professional plan in 10 minutes, AI-powered.
• Grants Finder — Find every SME grant you qualify for.
• Grant Application Generator — AI-drafted first version in minutes.
• Compliance Calendar — Every MRA deadline for 2026.
• VAT Calculator — Calculate VAT instantly.
• PAYE Calculator — Net pay, CSG, NSF in one click.`;

function welcomeEmailBody(email: string): string {
  const token = makeUnsubscribeToken(email);
  return `Welcome to OuBiznes.mu!

Free tools for Mauritian businesses — built to help you start, fund, and run smarter.

Here's what's live right now:
${TOOLS_LIST}

We'll only email you when something genuinely useful launches. No spam.

Visit oubiznes.mu to explore all tools and vote on what we build next.

The OuBiznes team

---
To unsubscribe: ${SITE_URL}/unsubscribe?token=${token}`;
}

function welcomeBackEmailBody(email: string): string {
  const token = makeUnsubscribeToken(email);
  return `Welcome back to OuBiznes.mu!

We're glad to have you back. Here's what's available:
${TOOLS_LIST}

Visit oubiznes.mu to explore all tools and vote on what we build next.

The OuBiznes team

---
To unsubscribe: ${SITE_URL}/unsubscribe?token=${token}`;
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

  // Always write to email_subscribers (used for briefing counts)
  await db.from('email_subscribers').insert({ project: PROJECT, email, source: 'home_strip' });

  // Check subscribers table for lifecycle management
  const { data: existing } = await db
    .from('subscribers')
    .select('status, subscription_count')
    .eq('email', email)
    .single();

  if (!existing) {
    // New subscriber
    await db.from('subscribers').insert({ email, source: 'homepage-notify', status: 'active' });
    await sendTransactionalEmail(
      email,
      'Welcome to OuBiznes.mu — free tools for Mauritian businesses 🇲🇺',
      welcomeEmailBody(email)
    );
    return NextResponse.json({ ok: true, already: false });
  }

  if (existing.status === 'unsubscribed') {
    // Returning subscriber
    await db.from('subscribers').update({
      status:             'active',
      resubscribed_at:    new Date().toISOString(),
      subscription_count: (existing.subscription_count ?? 1) + 1,
    }).eq('email', email);
    await sendTransactionalEmail(
      email,
      'Welcome back to OuBiznes.mu 🇲🇺',
      welcomeBackEmailBody(email)
    );
    return NextResponse.json({ ok: true, already: false });
  }

  // Already active
  return NextResponse.json({ ok: true, already: true });
}
