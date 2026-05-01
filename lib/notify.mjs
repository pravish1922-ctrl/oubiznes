/**
 * SPAK Notification Service
 * sendEmail(subject, text)  — Zoho SMTP (already configured in .env.local)
 * sendWhatsApp(message)     — Twilio WhatsApp sandbox
 * notify(subject, message)  — both channels in parallel
 *
 * New env vars needed:
 *   TWILIO_ACCOUNT_SID      — from console.twilio.com
 *   TWILIO_AUTH_TOKEN       — from console.twilio.com
 *   TWILIO_WHATSAPP_FROM    — sandbox: whatsapp:+14155238886
 *   OPERATOR_WHATSAPP       — your number: whatsapp:+2305XXXXXXX
 */
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// ── EMAIL ─────────────────────────────────────────────────────────────────────
export async function sendEmail(subject, text, html) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, REGULATORY_EMAIL_TO } = process.env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('[notify] Email skipped — SMTP_USER/SMTP_PASS not set');
    return { ok: false, reason: 'no_smtp_config' };
  }

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST   || 'smtp.zoho.com',
    port:   Number(SMTP_PORT) || 465,
    secure: true,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });

  const to = REGULATORY_EMAIL_TO || SMTP_USER;

  try {
    await transporter.sendMail({
      from:    `"SPAK · OuBiznes" <${SMTP_USER}>`,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log(`[notify] Email sent → ${to}`);
    return { ok: true };
  } catch (err) {
    console.error(`[notify] Email failed: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

// ── WHATSAPP (Twilio) ─────────────────────────────────────────────────────────
export async function sendWhatsApp(message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, OPERATOR_WHATSAPP } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn('[notify] WhatsApp skipped — Twilio credentials not set');
    return { ok: false, reason: 'no_twilio_config' };
  }

  if (!OPERATOR_WHATSAPP) {
    console.warn('[notify] WhatsApp skipped — OPERATOR_WHATSAPP not set');
    return { ok: false, reason: 'no_recipient' };
  }

  const from = TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const msg = await client.messages.create({
      from,
      to:   OPERATOR_WHATSAPP,
      body: message,
    });
    console.log(`[notify] WhatsApp sent — SID: ${msg.sid}`);
    return { ok: true, sid: msg.sid };
  } catch (err) {
    console.error(`[notify] WhatsApp failed: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

// ── BOTH ──────────────────────────────────────────────────────────────────────
export async function notify(subject, message) {
  const [emailResult, waResult] = await Promise.all([
    sendEmail(subject, message),
    sendWhatsApp(message),
  ]);
  return { email: emailResult, whatsapp: waResult };
}
