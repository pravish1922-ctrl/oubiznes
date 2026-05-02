import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

interface Props { searchParams: Promise<{ token?: string }> }

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const token  = params.token ?? '';

  let email = '';
  let error  = '';

  try {
    email = Buffer.from(token, 'base64url').toString('utf8');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = 'Invalid unsubscribe link.';
    }
  } catch {
    error = 'Invalid unsubscribe link.';
  }

  if (!error && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
    await db.from('subscribers').update({
      status:           'unsubscribed',
      unsubscribed_at:  new Date().toISOString(),
    }).eq('email', email);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F0E8', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 420, width: '90%', background: '#fff', borderRadius: 12, padding: '40px 36px', textAlign: 'center' }}>
        {/* Flag bar */}
        <div style={{ height: 4, display: 'flex', borderRadius: 4, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ flex: 1, background: '#CC0000' }} />
          <div style={{ flex: 1, background: '#1E5AA0' }} />
          <div style={{ flex: 1, background: '#F4C430' }} />
          <div style={{ flex: 1, background: '#0F7B3F' }} />
        </div>

        {error ? (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>Invalid link</h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>{error}</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>
              You&apos;ve been unsubscribed
            </h1>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
              <strong>{email}</strong> has been removed from our mailing list.
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
              We hope to see you again. You can always re-subscribe from oubiznes.mu.
            </p>
          </>
        )}

        <Link href="/" style={{
          display: 'inline-block', padding: '10px 24px',
          background: '#0F6E56', color: '#fff',
          borderRadius: 8, textDecoration: 'none',
          fontWeight: 600, fontSize: 14,
        }}>
          Back to OuBiznes.mu
        </Link>
      </div>
    </div>
  );
}
