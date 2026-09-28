import { createClient } from '@supabase/supabase-js';

/**
 * Cancella l'account di chi chiama e, a cascata, i suoi progressi (tabella progress).
 * Il browser manda il proprio token; qui lo si verifica e si cancella con la secret key,
 * che resta solo sul server. Variabili d'ambiente su Vercel: SUPABASE_URL e SUPABASE_SECRET_KEY.
 */
export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });

  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('Cancellazione account non riuscita:', deleteError.message);
    return Response.json({ ok: false, error: 'delete_failed' }, { status: 500 });
  }
  return Response.json({ ok: true });
}
