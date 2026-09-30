/**
 * Scheda Gramática: il quaderno di ciò che si è studiato nel percorso.
 * Un verbo compare quando si è fatta almeno la Descoberta del nodo che ne presenta
 * il paradigma, e solo con i tempi studiati lì (oggi: il presente).
 * In più, i verbi e i tempi di "grammarPreview" in course.json si vedono fin dall'inizio.
 */
import {
  chapters,
  course,
  courseConfig,
  generatedExercises,
  getVerb,
  loadNode,
  PERSONS,
  PERSON_LABELS,
  toRuntimeExercise,
  type CourseNode,
  type NodeContent,
  type Person,
} from './index';
import type { Exercise as RuntimeExercise } from '@/types/exercise';

export interface StudiedVerb {
  verbId: string;
  infinitive: string;
  translation: string;
  /** Tempi da mostrare: prima quelli studiati nel percorso, poi quelli in anteprima */
  tenses: string[];
  /** Tempi visibili solo grazie a grammarPreview, non ancora incontrati nel percorso */
  previewTenses: string[];
}

/** Esercizi per sessione di pratica di un verbo */
export const GRAMMAR_PRACTICE_SIZE = 10;

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Nodi di cui si è fatta almeno una sessione, nell'ordine del percorso, con i loro contenuti */
async function startedNodes(sessionProgress: Record<string, number>, completedNodeIds: string[]) {
  const started = chapters
    .flatMap((c) => c.nodes)
    .filter((n) => !n.draft && ((sessionProgress[n.id] ?? 0) > 0 || completedNodeIds.includes(n.id)));
  const contents = await Promise.all(started.map((n) => loadNode(n.id)));
  return started.flatMap((node, i) => (contents[i] ? [{ node, content: contents[i]! }] : [])) as {
    node: CourseNode;
    content: NodeContent;
  }[];
}

/** Verbi già studiati: quelli con un paradigma in un nodo iniziato */
export async function studiedVerbs(sessionProgress: Record<string, number>, completedNodeIds: string[]): Promise<StudiedVerb[]> {
  const out = new Map<string, StudiedVerb>();
  for (const { content } of await startedNodes(sessionProgress, completedNodeIds)) {
    for (const item of content.theory ?? []) {
      if (!('paradigm' in item)) continue;
      const { verb: verbId, tense } = item.paradigm;
      const verb = getVerb(verbId);
      if (!verb) continue;
      const entry = out.get(verbId) ?? { verbId, infinitive: verb.infinitive, translation: verb.translation, tenses: [], previewTenses: [] };
      if (!entry.tenses.includes(tense)) entry.tenses.push(tense);
      out.set(verbId, entry);
    }
  }
  for (const { verb: verbId, tenses } of course.grammarPreview ?? []) {
    const verb = getVerb(verbId);
    if (!verb) continue;
    const entry = out.get(verbId) ?? { verbId, infinitive: verb.infinitive, translation: verb.translation, tenses: [], previewTenses: [] };
    for (const tense of tenses) {
      if (entry.tenses.includes(tense) || !verb.conjugations[tense]) continue;
      entry.tenses.push(tense);
      entry.previewTenses.push(tense);
    }
    out.set(verbId, entry);
  }
  return [...out.values()];
}

/**
 * Pratica di un verbo: le frasi del percorso che lo allenano (solo dai nodi già iniziati,
 * senza le conversazioni del test) più le forme del paradigma da scrivere.
 * Per un tempo in anteprima, che nel percorso non c'è ancora, le frasi vengono dal file del verbo.
 * Come in Prática: prima le scelte (1 su 3 d'ascolto), poi la scrittura.
 */
export async function verbPractice(
  verbId: string,
  tense: string,
  sessionProgress: Record<string, number>,
  completedNodeIds: string[],
  preview = false
): Promise<RuntimeExercise[]> {
  const prefix = `verb:${verbId}:${tense}:`;
  const trainsTense = (ex: { trains: string[] }) => ex.trains.some((t) => t.startsWith(prefix));
  const fromPath = preview ? [] : (await startedNodes(sessionProgress, completedNodeIds)).flatMap(({ content }) => content.exercises.filter(trainsTense));
  const fromVerb = preview ? (getVerb(verbId)?.exercises ?? []).filter(trainsTense) : [];
  const written = shuffle([...fromPath, ...fromVerb]);
  const paradigm = shuffle(generatedExercises([{ paradigm: { verb: verbId, tense } }]));

  // Frasi del percorso (almeno 2 posti restano alle forme del paradigma): fino a metà a scelta,
  // le altre da scrivere; le forme del paradigma completano la sessione
  const room = GRAMMAR_PRACTICE_SIZE - 2;
  const choosable = written.filter((ex) => ex.type === 'choose').slice(0, Math.ceil(room / 2));
  const chosen = new Set(choosable.map((ex) => ex.id));
  const toWrite = written.filter((ex) => !chosen.has(ex.id)).slice(0, room - choosable.length);
  const list = [
    ...choosable.map((ex) => toRuntimeExercise(ex)),
    ...toWrite.map((ex) => toRuntimeExercise(ex, { typed: true })),
    ...paradigm.slice(0, GRAMMAR_PRACTICE_SIZE - choosable.length - toWrite.length),
  ];

  const choices = list.filter((e) => e.type === 'multiple_choice');
  const writing = list.filter((e) => e.type !== 'multiple_choice');
  return [...choices.map((e, i) => (i % 3 === 1 ? { ...e, listening: true } : e)), ...writing];
}

// ---------- Ricerca ----------

export interface GrammarMatch {
  verb: StudiedVerb;
  tense: string;
  /** Forma trovata; assente se corrisponde l'infinito o la traduzione */
  form?: string;
  /** Persone con quella forma (es. "sono": io e loro), da evidenziare nella tabella */
  persons: Person[];
}

/** Minuscole, senza accenti e apostrofi tipografici: "È" e "e" si trovano a vicenda */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .trim();

/** Pronome scritto → persone: "noi" → noi, "lei" → lui_lei, "voce" → ele_ela */
const PRONOUNS = new Map<string, Person[]>();
for (const p of PERSONS) {
  const words = [...PERSON_LABELS[p].split('/'), courseConfig.spokenPronouns[p]].map(normalize).filter(Boolean);
  for (const w of words) PRONOUNS.set(w, [...(PRONOUNS.get(w) ?? []), p].filter((x, i, a) => a.indexOf(x) === i));
}

/**
 * Cerca tra i verbi visibili: una forma ("eravamo", anche solo l'inizio), un infinito o una parola della traduzione.
 * Un pronome davanti restringe alle sue persone ("noi e" → eravamo, eravate…); un pronome da solo
 * mostra le forme di quella persona. Prima le forme esatte, poi gli infiniti, poi gli inizi di forma.
 */
export function searchGrammar(query: string, verbs: StudiedVerb[], tenseFilter: string | null, limit = 20): GrammarMatch[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];
  let persons: Person[] | null = null;
  if (PRONOUNS.has(tokens[0])) {
    persons = PRONOUNS.get(tokens[0])!;
    tokens.shift();
  }
  const q = tokens.join(' ');

  const exact: GrammarMatch[] = [];
  const infinitives: GrammarMatch[] = [];
  const prefix: GrammarMatch[] = [];
  for (const verb of verbs) {
    const tenses = verb.tenses.filter((t) => !tenseFilter || t === tenseFilter);
    const forms = getVerb(verb.verbId)?.conjugations ?? {};
    if (q && !persons && tenses.length && (normalize(verb.infinitive).startsWith(q) || (q.length > 1 && normalize(verb.translation).split(/[^\p{L}]+/u).some((w) => w.startsWith(q))))) {
      infinitives.push({ verb, tense: tenses[0], persons: [] });
    }
    for (const tense of tenses) {
      // Stessa forma per più persone (es. "sono"): un solo risultato
      const byForm = new Map<string, Person[]>();
      for (const p of PERSONS) {
        const form = forms[tense]?.[p];
        if (!form || (persons && !persons.includes(p))) continue;
        byForm.set(form, [...(byForm.get(form) ?? []), p]);
      }
      for (const [form, ps] of byForm) {
        const f = normalize(form);
        const match = { verb, tense, form, persons: ps };
        if (!q || f === q) exact.push(match);
        else if (f.startsWith(q)) prefix.push(match);
      }
    }
  }
  return [...exact, ...infinitives, ...prefix].slice(0, limit);
}
