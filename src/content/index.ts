/**
 * Unico punto da cui l'app legge i contenuti del corso.
 * I componenti non importano mai direttamente i file JSON: se un domani i contenuti
 * arriveranno da un database, cambia solo questo file.
 */
import courseJson from './course.json';
import { SINGULAR, PLURAL } from './schema';
import type { Course, CourseNode, Chapter, Exercise as ContentExercise, NodeContent, Person, TheoryCard, TheoryItem, Verb, VocabItem, VocabStudyCard } from './schema';
import { verbList, vocabSetList, nodeLoaders } from './registry.generated';
import type { Exercise as RuntimeExercise } from '@/types/exercise';

export type { Chapter, CourseNode, NodeContent, Verb, VocabItem, Person };
export type { Speaker } from './schema';

// ---------- Corso e mappa ----------

export const course = courseJson as unknown as Course;
export const chapters: Chapter[] = course.chapters;
const allNodes: CourseNode[] = chapters.flatMap((c) => c.nodes);

export const getCourseNode = (id: string) => allNodes.find((n) => n.id === id);

/** Categoria del nodo, mostrata sopra il titolo sulla mappa */
export const KIND_LABELS: Record<CourseNode['kind'], string> = {
  verb: 'Verbo',
  vocab: 'Vocabulário',
  dialogue: 'Conversa',
  checkpoint: 'Desafio',
};

/** Titolo completo, per i punti dove la categoria non si vede (es. fine lezione) */
export const fullNodeTitle = (node: CourseNode) => (node.kind === 'verb' ? `Verbo ${node.title.toLowerCase()}` : node.title);

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
  const base = { id: ex.id, prompt: ex.prompt ?? defaultPrompt(ex), translationIt: ex.it, context: ex.context, contextIt: ex.contextIt, trains: ex.trains };

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
  kind: 'info';
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
    kind: 'info',
    title: card.title,
    text: card.text,
    conjugation: card.verb ? conjugationRows(card.verb.verb, card.verb.tense) : undefined,
    examples: examples.length ? examples : undefined,
  };
}

// ---------- Studio guidato del paradigma ----------

export interface ParadigmRow {
  person: Person;
  /** Etichetta mostrata, es. "Ele / Ela / Você" */
  pronoun: string;
  /** Pronome letto ad alta voce insieme alla forma, es. "ele" */
  spoken: string;
  form: string;
}

export interface ParadigmStep {
  kind: 'paradigm';
  /** trace = si ricopia sopra la forma in trasparenza; recall = si scrive a memoria */
  mode: 'trace' | 'recall';
  verbId: string;
  infinitive: string;
  tense: string;
  /** Sottotitolo della schermata */
  label: string;
  rows: ParadigmRow[];
}

// ---------- Studio guidato del vocabolario ----------

/** Separa la punteggiatura finale, che si mostra ma non si digita: "Tudo bem?" → "Tudo bem" + "?" */
export function splitTrailingPunctuation(pt: string) {
  const m = pt.trim().match(/^(.*?[\p{L}\p{N}])([^\p{L}\p{N}]*)$/u);
  return m ? { form: m[1], after: m[2] } : { form: pt.trim(), after: '' };
}

export interface VocabPresentStep {
  kind: 'vocab-present';
  groupLabel: string;
  /** Posizione nel gruppo (da 1) e dimensione del gruppo */
  position: number;
  groupSize: number;
  item: VocabItem;
  form: string;
  after: string;
}

export interface VocabRecallStep {
  kind: 'vocab-recall';
  rows: { id: string; situation: string; form: string; after: string; pt: string }[];
}

function vocabStudySteps(card: VocabStudyCard['vocabStudy']): (VocabPresentStep | VocabRecallStep)[] {
  const present: VocabPresentStep[] = card.groups.flatMap((g) => {
    const items = g.items.map(getVocab).filter((v): v is VocabItem => Boolean(v));
    return items.map((item, i) => ({
      kind: 'vocab-present' as const,
      groupLabel: g.label,
      position: i + 1,
      groupSize: items.length,
      item,
      ...splitTrailingPunctuation(item.pt),
    }));
  });
  if (card.recall === false) return present;
  const recall: VocabRecallStep = {
    kind: 'vocab-recall',
    rows: present.map(({ item, form, after }) => ({ id: item.id, situation: item.situation ?? item.it, form, after, pt: item.pt })),
  };
  return [...present, recall];
}

export type TheoryStep = ResolvedTheoryCard | ParadigmStep | VocabPresentStep | VocabRecallStep;

const SPOKEN: Record<Person, string> = { eu: 'eu', tu: 'tu', ele_ela_voce: 'ele', nos: 'nós', eles_elas_voces: 'eles' };

function paradigmSteps(verbId: string, tense: string): ParadigmStep[] {
  const verb = getVerb(verbId);
  const forms = verb?.conjugations[tense];
  if (!verb || !forms) return [];
  const rows = (persons: Person[]): ParadigmRow[] =>
    persons.map((p) => ({ person: p, pronoun: PERSON_LABELS[p], spoken: SPOKEN[p], form: forms[p] }));
  const base = { kind: 'paradigm' as const, verbId, infinitive: verb.infinitive, tense };
  return [
    { ...base, mode: 'trace', label: 'Singular', rows: rows(SINGULAR) },
    { ...base, mode: 'trace', label: 'Plural', rows: rows(PLURAL) },
    { ...base, mode: 'trace', label: 'Todas as formas', rows: rows([...SINGULAR, ...PLURAL]) },
    { ...base, mode: 'recall', label: 'Agora de memória', rows: rows([...SINGULAR, ...PLURAL]) },
  ];
}

/** Trasforma la teoria del contenuto nelle schermate da mostrare */
export function theorySteps(items: TheoryItem[]): TheoryStep[] {
  return items.flatMap((item): TheoryStep[] => {
    if ('paradigm' in item) return paradigmSteps(item.paradigm.verb, item.paradigm.tense);
    if ('vocabStudy' in item) return vocabStudySteps(item.vocabStudy);
    return [resolveTheory(item)];
  });
}
