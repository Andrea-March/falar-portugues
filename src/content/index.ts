/**
 * Unico punto da cui l'app legge i contenuti del corso.
 * I componenti non importano mai direttamente i file JSON: se un domani i contenuti
 * arriveranno da un database, cambia solo questo file.
 */
import courseJson from './course.json';
import type { Course, CourseNode, Chapter, Exercise as ContentExercise, NodeContent, Person, TheoryCard, Verb, VocabItem } from './schema';
import { verbList, vocabSetList, nodeLoaders } from './registry.generated';
import type { Exercise as RuntimeExercise } from '@/types/exercise';

export type { Chapter, CourseNode, NodeContent, Verb, VocabItem, Person };

// ---------- Corso e mappa ----------

export const course = courseJson as unknown as Course;
export const chapters: Chapter[] = course.chapters;
const allNodes: CourseNode[] = chapters.flatMap((c) => c.nodes);

export const getCourseNode = (id: string) => allNodes.find((n) => n.id === id);

/** Nodo successivo nel percorso (o lo stesso, se è l'ultimo) */
export function nextNodeId(id: string): string {
  const i = allNodes.findIndex((n) => n.id === id);
  return i !== -1 && i < allNodes.length - 1 ? allNodes[i + 1].id : id;
}

// ---------- Lezioni (caricate su richiesta) ----------

const nodeCache = new Map<string, Promise<NodeContent | null>>();

export function loadNode(id: string): Promise<NodeContent | null> {
  let p = nodeCache.get(id);
  if (!p) {
    const loader = nodeLoaders[id];
    p = loader ? loader().catch(() => null) : Promise.resolve(null);
    nodeCache.set(id, p);
  }
  return p;
}

// ---------- Verbi e vocabolario ----------

export const verbs: Verb[] = verbList;
export const getVerb = (id: string) => verbs.find((v) => v.id === id);

const vocabById = new Map<string, VocabItem>(vocabSetList.flatMap((s) => s.items.map((i) => [i.id, i] as const)));
export const getVocab = (id: string) => vocabById.get(id);

export const PERSON_LABELS: Record<Person, string> = {
  eu: 'Eu',
  tu: 'Tu',
  ele_ela_voce: 'Ele / Ela / Você',
  nos: 'Nós',
  eles_elas_voces: 'Eles / Elas / Vocês',
};

export const TENSE_LABELS: Record<string, string> = {
  presente: 'Presente do Indicativo',
  preterito_perfeito: 'Pretérito Perfeito',
  preterito_imperfeito: 'Pretérito Imperfeito',
  futuro: 'Futuro do Indicativo',
};
export const tenseLabel = (t: string) => TENSE_LABELS[t] ?? t.replace(/_/g, ' ');

/** Righe della tabella di coniugazione, nell'ordine standard delle persone */
export function conjugationRows(verbId: string, tense: string) {
  const forms = getVerb(verbId)?.conjugations[tense];
  if (!forms) return [];
  return (Object.keys(PERSON_LABELS) as Person[]).map((p) => ({ person: p, pronoun: PERSON_LABELS[p], verb: forms[p] }));
}

// ---------- Conversione verso i componenti degli esercizi ----------

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function splitAnswer(text: string) {
  const m = text.match(/^([^{}]*)\{([^{}]+)\}([^{}]*)$/);
  if (!m) throw new Error(`Frase senza risposta tra graffe: ${text}`);
  return { before: m[1], answer: m[2], after: m[3] };
}

/** Primo "verb:…" tra le cose allenate, se c'è */
function verbTarget(ex: ContentExercise) {
  const ref = ex.trains.find((t) => t.startsWith('verb:'));
  if (!ref) return null;
  const [, verbId, tense, person] = ref.split(':');
  const verb = getVerb(verbId);
  return verb ? { verb, tense, person } : null;
}

function defaultPrompt(ex: ContentExercise) {
  const target = verbTarget(ex);
  if (target) return `Conjuga o verbo ${target.verb.infinitive} (${tenseLabel(target.tense).toLowerCase()})`;
  return ex.type === 'write' ? 'Completa a frase' : 'Escolhe a opção certa';
}

/** Converte un esercizio del contenuto nel formato usato dai componenti */
export function toRuntimeExercise(ex: ContentExercise): RuntimeExercise {
  const { before, answer, after } = splitAnswer(ex.text);
  const base = { id: ex.id, prompt: ex.prompt ?? defaultPrompt(ex), translationIt: ex.it, trains: ex.trains };

  if (ex.type === 'write') {
    return { ...base, type: 'fill_in_the_blank', sentenceBefore: before, sentenceAfter: after, correctAnswer: answer };
  }

  let wrong = ex.wrong ?? [];
  if (ex.wrongFrom === 'verb-forms') {
    const t = verbTarget(ex);
    const forms = t ? Object.values(t.verb.conjugations[t.tense] ?? {}) : [];
    const unique = [...new Set(forms)].filter((f) => f.toLowerCase() !== answer.toLowerCase());
    wrong = shuffle(unique).slice(0, 3);
  }

  return {
    ...base,
    type: 'multiple_choice',
    sentence: `${before}_____${after}`,
    correctAnswer: answer,
    options: shuffle([answer, ...wrong]),
  };
}

/** Esercizi di pratica di un verbo (sezione Gramática), filtrabili per tempo */
export function verbExercises(verbId: string, tense?: string): RuntimeExercise[] {
  const verb = getVerb(verbId);
  if (!verb) return [];
  return verb.exercises
    .filter((ex) => !tense || ex.trains.some((t) => t.startsWith(`verb:${verbId}:${tense}:`)))
    .map(toRuntimeExercise);
}

// ---------- Teoria pronta da mostrare ----------

export interface ResolvedTheoryCard {
  title: string;
  text: string;
  conjugation?: { pronoun: string; verb: string }[];
  examples?: { pt: string; it: string; note?: string }[];
}

export function resolveTheory(card: TheoryCard): ResolvedTheoryCard {
  const vocabExamples = (card.vocab ?? [])
    .map(getVocab)
    .filter((v): v is VocabItem => Boolean(v))
    .map((v) => ({ pt: v.pt, it: v.it, note: v.note }));
  const examples = [...vocabExamples, ...(card.examples ?? [])];

  return {
    title: card.title,
    text: card.text,
    conjugation: card.verb ? conjugationRows(card.verb.verb, card.verb.tense) : undefined,
    examples: examples.length ? examples : undefined,
  };
}
