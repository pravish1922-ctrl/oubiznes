/**
 * Shared Supabase client for Node.js scripts (service role).
 * Uses SUPABASE_SERVICE_ROLE_KEY — never expose to browser.
 *
 * Setup:
 *   Add to .env.local:
 *     SUPABASE_URL=https://xxxx.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.\n' +
    'Add both to .env.local and to Vercel dashboard.'
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export default supabase;
