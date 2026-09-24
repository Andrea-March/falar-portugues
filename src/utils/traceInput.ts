/** Tasti "morti" delle tastiere fisiche (arrivano prima della lettera accentata): si ignorano */
const DEAD_KEYS = new Set(['´', '`', '^', '~', '¨', '˜', 'ˆ']);

export const baseLetter = (c: string) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const chars = (s: string) => [...s.normalize('NFC')];

export interface TraceResult {
  /** Testo accettato (sempre un prefisso corretto della forma) */
  accepted: string;
  /** L'utente ha scritto una lettera sbagliata */
  rejected: boolean;
  /** La lettera era giusta ma senza/con l'accento sbagliato: quale serviva */
  missingAccent: string | null;
  complete: boolean;
}

/**
 * Ricopiatura guidata: dato il testo già accettato e il nuovo valore del campo,
 * accetta solo le lettere che corrispondono alla forma da ricopiare.
 */
export function applyTrace(accepted: string, incoming: string, form: string): TraceResult {
  const expected = chars(form);
  let acc = accepted;
  const value = incoming.normalize('NFC');
  let rejected = false;
  let missingAccent: string | null = null;

  // Cancellazioni o sostituzioni dell'intero testo: si ignorano (quello accettato è già giusto)
  if (value.toLowerCase().startsWith(acc.toLowerCase())) {
    for (const ch of chars(value).slice(chars(acc).length)) {
      if (DEAD_KEYS.has(ch)) continue;
      const exp = expected[chars(acc).length];
      if (exp === undefined) break;
      if (ch.toLowerCase() === exp.toLowerCase()) {
        acc += exp;
        missingAccent = null;
        continue;
      }
      rejected = true;
      if (baseLetter(ch) === baseLetter(exp)) missingAccent = exp;
      break;
    }
  }

  return { accepted: acc, rejected, missingAccent, complete: chars(acc).length === expected.length };
}
