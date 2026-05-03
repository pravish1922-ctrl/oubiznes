/**
 * GET /api/spak/email-reply — Vercel Cron, every 30 minutes
 * Reads Zoho inbox via IMAP, finds SPAK reply emails,
 * parses APPROVE/IGNORE/INVESTIGATE + action_id, calls /api/spak/approve.
 *
 * Required env vars (Vercel dashboard):
 *   IMAP_HOST=imap.zoho.com
 *   IMAP_PORT=993
 *   IMAP_USER=contact@oubiznes.mu
 *   IMAP_PASS=<Zoho app password>
 *   CRON_SECRET
 */

import { NextResponse }  from 'next/server';
import { ImapFlow }      from 'imapflow';

const SITE_URL = 'https://oubiznes.mu';

async function callApprove(action_id: string, decision: string): Promise<void> {
  await fetch(`${SITE_URL}/api/spak/approve`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({ action_id, decision }),
  });
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS } = process.env;
  if (!IMAP_HOST || !IMAP_USER || !IMAP_PASS) {
    return NextResponse.json({ error: 'IMAP not configured' }, { status: 503 });
  }

  const client = new ImapFlow({
    host:   IMAP_HOST,
    port:   Number(IMAP_PORT ?? 993),
    secure: true,
    auth:   { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
  });

  const processed: string[] = [];
  const errors:    string[] = [];

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Fetch unseen messages from the last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    for await (const msg of client.fetch(
      { since: cutoff, seen: false },
      { bodyParts: ['TEXT'], envelope: true }
    )) {
      const rawText = (msg.bodyParts?.get('TEXT') ?? '').toString();
      const lines   = rawText.toUpperCase().split(/\r?\n/);

      for (const line of lines) {
        const match = line.match(/^(APPROVE|IGNORE|INVESTIGATE)\s+([0-9A-F-]{36})/);
        if (!match) continue;

        const decision  = match[1].toLowerCase();
        const action_id = match[2].toLowerCase();

        try {
          await callApprove(action_id, decision);
          // Mark as seen so we don't process again
          await client.messageFlagsAdd(msg.uid, ['\\Seen'], { uid: true });
          processed.push(`${decision}:${action_id.slice(0, 8)}`);
        } catch (e) {
          errors.push(`${action_id.slice(0, 8)}: ${(e as Error).message}`);
        }
        break; // only process first valid command per email
      }
    }

    await client.logout();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, processed, errors });
}

