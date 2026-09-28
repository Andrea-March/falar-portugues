/**
 * Scheda Gramática: il quaderno di ciò che si è studiato nel percorso.
 * Un verbo compare quando si è fatta almeno la Descoberta del nodo che ne presenta
 * il paradigma, e solo con i tempi studiati lì (oggi: il presente).
 */
import { chapters, generatedExercises, getVerb, loadNode, toRuntimeExercise, type CourseNode, type NodeContent } from './index';
import type { Exercise as RuntimeExercise } from '@/types/exercise';

export interface StudiedVerb {
  verbId: string;
  infinitive: string;
  translation: string;
  /** Tempi studiati nel percorso, nell'ordine in cui compaiono */
  tenses: string[];
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
      const entry = out.get(verbId) ?? { verbId, infinitive: verb.infinitive, translation: verb.translation, tenses: [] as string[] };
      if (!entry.tenses.includes(tense)) entry.tenses.push(tense);
      out.set(verbId, entry);
    }
  }
  return [...out.values()];
}

/**
 * Pratica di un verbo: le frasi del percorso che lo allenano (solo dai nodi già iniziati,
 * senza le conversazioni del test) più le forme del paradigma da scrivere.
 * Come in Prática: prima le scelte (1 su 3 d'ascolto), poi la scrittura.
 */
export async function verbPractice(
  verbId: string,
  tense: string,
  sessionProgress: Record<string, number>,
  completedNodeIds: string[]
): Promise<RuntimeExercise[]> {
  const prefix = `verb:${verbId}:${tense}:`;
  const nodes = await startedNodes(sessionProgress, completedNodeIds);
  const written = shuffle(nodes.flatMap(({ content }) => content.exercises.filter((ex) => ex.trains.some((t) => t.startsWith(prefix)))));
  const paradigm = shuffle(
    nodes.flatMap(({ content }) =>
      generatedExercises((content.theory ?? []).filter((c) => 'paradigm' in c && c.paradigm.verb === verbId && c.paradigm.tense === tense))
    ).filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i)
  );

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
