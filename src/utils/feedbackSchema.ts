import { z } from 'zod';

/**
 * Formato dei feedback, condiviso tra i moduli dell'app e l'API (src/app/api/feedback).
 * - general: aperto, per le impressioni sull'app;
 * - exercise: chiuso, per segnalare un problema in un esercizio, con il contesto allegato.
 */

/** Motivi della segnalazione di un esercizio, nell'ordine in cui compaiono */
export const REPORT_REASONS = [
  { id: 'not_accepted', label: 'La mia risposta era giusta, ma non è stata accettata' },
  { id: 'portuguese', label: "C'è un errore nel portoghese" },
  { id: 'translation', label: 'Traduzione o spiegazione sbagliata' },
  { id: 'audio', label: "L'audio non va o dice altro" },
  { id: 'unclear', label: "L'esercizio non è chiaro" },
  { id: 'other', label: 'Altro' },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]['id'];

const Context = z.object({
  version: z.string().max(40),
  userAgent: z.string().max(400),
});

export const FeedbackPayload = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('general'),
    message: z.string().trim().min(1).max(3000),
    /** Facoltativa: solo se l'utente vuole una risposta */
    email: z.union([z.literal(''), z.email().max(200)]),
    context: Context,
    /** Campo trappola per i bot: le persone non lo vedono e lo lasciano vuoto */
    website: z.string().max(0),
  }),
  z.object({
    kind: z.literal('exercise'),
    reason: z.enum(REPORT_REASONS.map((r) => r.id) as [ReportReason, ...ReportReason[]]),
    message: z.string().trim().max(1000),
    exercise: z.object({
      id: z.string().max(100),
      sentence: z.string().max(500),
      correctAnswer: z.string().max(200),
      answer: z.string().max(200),
    }),
    context: Context,
    website: z.string().max(0),
  }),
]);

export type FeedbackPayload = z.infer<typeof FeedbackPayload>;
