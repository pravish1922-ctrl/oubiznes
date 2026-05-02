/**
 * POST /api/spak/whatsapp-reply
 * Twilio WhatsApp sandbox webhook — fires when operator replies to SPAK message.
 *
 * Parses message body for:
 *   APPROVE   <action_id>
 *   IGNORE    <action_id>
 *   INVESTIGATE <action_id>
 *
 * Calls /api/spak/approve with the parsed values.
 * Returns TwiML response so Twilio doesn't retry.
 *
 * Set Twilio WhatsApp sandbox webhook URL to:
 *   https://oubiznes.mu/api/spak/whatsapp-reply
 */

import { NextResponse } from 'next/server';

const SITE_URL = 'https://oubiznes.mu';

function twiml(message: string): NextResponse {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  );
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let body = '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    body = await request.text();
  } else {
    return twiml('Unrecognised request format.');
  }

  const params = new URLSearchParams(body);
  const rawBody = (params.get('Body') ?? '').trim().toUpperCase();

  const match = rawBody.match(/^(APPROVE|IGNORE|INVESTIGATE)\s+([0-9a-f-]{36})/i);
  if (!match) {
    return twiml('Reply with: APPROVE <id> | IGNORE <id> | INVESTIGATE <id>');
  }

  const decision   = match[1].toLowerCase() as 'approve' | 'ignore' | 'investigate';
  const action_id  = match[2];

  if (!process.env.CRON_SECRET) {
    return twiml('Server not configured.');
  }

  try {
    const res = await fetch(`${SITE_URL}/api/spak/approve`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({ action_id, decision }),
    });

    if (res.ok) {
      const map = { approve: '✅ Approved', ignore: '⏭️ Ignored', investigate: '🔍 Flagged for investigation' };
      return twiml(`${map[decision]} — action ${action_id.slice(0, 8)}...`);
    }

    const err = await res.json().catch(() => ({}));
    return twiml(`Error: ${(err as { error?: string }).error ?? res.status}`);
  } catch (e) {
    return twiml('Internal error — check Vercel logs.');
  }
}
