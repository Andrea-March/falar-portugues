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
