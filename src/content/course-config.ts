/**
 * Cosa cambia da un corso all'altro, oltre ai contenuti JSON.
 * Ogni corso ha la sua cartella in src/content/courses/<id>/ con config.ts, ui.ts e i contenuti.
 * Quale corso finisce nell'app lo decide la variabile COURSE al momento della build (predefinito: pt).
 */
import type { PtUi } from './courses/pt/ui';

/** Testi dell'interfaccia: il corso portoghese fa da modello, gli altri devono avere le stesse chiavi */
export type UiStrings = PtUi;

export interface CourseConfig {
  id: string;
  /** Nome dell'app (menu, email di feedback) */
  appName: string;
  /** Nome breve sotto l'icona del telefono */
  appShortName: string;
  /** Titolo della pagina e nome completo nel manifest */
  appTitle: string;
  /** Descrizione per il manifest e i motori di ricerca */
  appDescription: string;
  /** Lingua che si impara: codice BCP 47 per la sintesi vocale, es. "pt-PT" */
  targetLang: string;
  /** Lingua di chi impara (spiegazioni e traduzioni), es. "it-IT" */
  learnerLang: string;
  /** Nomi delle due lingue, per gli script di revisione, es. "Portoghese" e "Italiano" */
  targetName: string;
  learnerName: string;
  /** Persone grammaticali nell'ordine della tabella di coniugazione (chiavi usate nei "trains") */
  persons: readonly string[];
  /** Le stesse, divise per lo studio guidato del paradigma */
  singular: readonly string[];
  plural: readonly string[];
  /** Etichetta mostrata nella tabella, es. "Ele / Ela / Você" */
  personLabels: Record<string, string>;
  /** Pronome breve letto ad alta voce con la forma, es. "ele" */
  spokenPronouns: Record<string, string>;
  /** Gruppi (coniugazioni) ammessi per i verbi, es. ["ar", "er", "ir"] */
  verbGroups: readonly string[];
  /** Tasti per le lettere accentate sotto il campo di risposta */
  specialChars: readonly string[];
  /**
   * Riconosce gli errori sulle doppie (caro/carro): nota apposta dopo l'errore e
   * "skill:doppie" nel ripasso. Per chi impara l'italiano partendo dal portoghese.
   */
  doubleConsonants?: boolean;
  /**
   * Sessione Ascolto all'inizio dei nodi conversazione: il dialogo senza testo e
   * domande di comprensione. Richiede "listening" nel JSON di ogni nodo dialogue.
   */
  listeningSession?: boolean;
  /** Bandierina delle note per chi impara, es. "🇮🇹" */
  learnerFlag: string;
  /** Nomi dei tempi verbali */
  tenseLabels: Record<string, string>;
  ui: UiStrings;
}
