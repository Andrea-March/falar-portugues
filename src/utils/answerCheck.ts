/**
 * Confronto delle risposte scritte.
 * - "exact": giusta (maiuscole, spazi e forma Unicode non contano)
 * - "accents": giusta a parte accenti/cediglia → si avvisa, non è un errore
 * - "wrong": sbagliata
 */
export type AnswerMatch = 'exact' | 'accents' | 'wrong';

export const normalizeAnswer = (s: string) =>
  s.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');

const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC');

export function matchAnswer(input: string, correct: string): AnswerMatch {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(correct);
  if (a === b) return 'exact';
  if (stripAccents(a) === stripAccents(b)) return 'accents';
  return 'wrong';
}

/**
 * Doppie. In italiano una consonante doppia cambia la parola (caro/carro), e chi parla
 * portoghese tende a scriverne una sola perché non le sente. "cq" vale come doppia di "q" (acqua).
 */
const collapseDoubles = (s: string) => s.replace(/([bcdfglmnprstvz])\1/g, '$1').replace(/cq/g, 'q');

/** La risposta contiene almeno una doppia (serve per allenare le doppie nel ripasso) */
export const hasDoubleConsonant = (s: string) => /([bcdfglmnprstvz])\1|cq/.test(normalizeAnswer(s));

/**
 * Errore sulle doppie: la risposta è giusta se si ignorano accenti e doppie, ma sbagliata
 * così com'è (una doppia mancante o di troppo). Resta un errore, con una nota apposta.
 */
export function isDoublesSlip(input: string, correct: string): boolean {
  const a = stripAccents(normalizeAnswer(input));
  const b = stripAccents(normalizeAnswer(correct));
  return a !== b && collapseDoubles(a) === collapseDoubles(b);
}

/** Cosa allenata "doppie", registrata nel ripasso accanto ai trains dell'esercizio */
export const DOUBLES_SKILL = 'skill:doppie';

/**
 * Posizioni delle lettere con accento sbagliato o mancante, calcolate sulla
 * risposta dell'utente senza spazi iniziali/finali. Ha senso nel caso "accents",
 * dove le due parole hanno la stessa lunghezza.
 */
export function accentMistakes(input: string, correct: string): Set<number> {
  const a = [...input.normalize('NFC').trim()];
  const b = [...correct.normalize('NFC').trim()];
  const out = new Set<number>();
  if (a.length !== b.length) return out;
  a.forEach((ch, i) => {
    if (ch.toLowerCase() !== b[i].toLowerCase()) out.add(i);
  });
  return out;
}

/**
 * Come matchAnswer, ma con più risposte giuste. Restituisce anche quale risposta
 * è stata riconosciuta, così si mostra e si legge quella scritta dall'utente.
 */
export function matchAnswerAny(input: string, answers: string[]): { result: AnswerMatch; match: string } {
  let accents: string | null = null;
  for (const a of answers) {
    const r = matchAnswer(input, a);
    if (r === 'exact') return { result: 'exact', match: a };
    if (r === 'accents' && accents === null) accents = a;
  }
  return accents !== null ? { result: 'accents', match: accents } : { result: 'wrong', match: answers[0] };
}
