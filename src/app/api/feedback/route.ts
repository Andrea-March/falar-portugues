import { FeedbackPayload } from '@/utils/feedbackSchema';

/**
 * Riceve i feedback dei moduli e li inoltra al foglio Google (scripts/feedback-sheet.gs).
 * Variabili d'ambiente su Vercel:
 * - FEEDBACK_WEBHOOK_URL: l'URL dell'app web di Apps Script;
 * - FEEDBACK_SECRET: una parola segreta uguale a quella nello script, così il foglio
 *   accetta solo ciò che arriva da qui.
 */
export async function POST(request: Request) {
  const url = process.env.FEEDBACK_WEBHOOK_URL;
  const secret = process.env.FEEDBACK_SECRET;
  if (!url || !secret) return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 10_000) return Response.json({ ok: false, error: 'too_large' }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const parsed = FeedbackPayload.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false, error: 'invalid' }, { status: 400 });

  const { website: _trap, ...data } = parsed.data;
  void _trap;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, receivedAt: new Date().toISOString(), ...data }),
      redirect: 'follow', // Apps Script risponde con un reindirizzamento
      signal: AbortSignal.timeout(10_000),
    });
    const out = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!res.ok || !out?.ok) throw new Error('webhook');
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'upstream' }, { status: 502 });
  }
}
