/**
 * Unico punto da cui l'app legge i contenuti del corso.
 * I componenti non importano mai direttamente i file JSON: se un domani i contenuti
 * arriveranno da un database, cambia solo questo file.
 */
import courseJson from './course.json';
import { SINGULAR, PLURAL } from './schema';
import type { Course, CourseNode, Chapter, Exercise as ContentExercise, NodeContent, Person, TheoryCard, TheoryItem, Verb, VocabItem, VocabStudyCard } from './schema';
import { verbList, vocabSetList, nodeLoaders, vocabGroupLabels } from './registry.generated';
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
  culture: 'Cultura · opcional',
  checkpoint: 'Desafio',
};

/** Titolo completo, per i punti dove la categoria non si vede (es. fine lezione) */
export const fullNodeTitle = (node: CourseNode) => (node.kind === 'verb' ? `Verbo ${node.title.toLowerCase()}` : node.title);

/** Nodo successivo nel percorso (o lo stesso, se è l'ultimo) */
/** Nodi facoltativi: si possono fare, ma non servono a sbloccare i successivi */
export const isOptionalNode = (node: CourseNode) => node.kind === 'culture';

/** Primo nodo del corso: il punto di partenza di un nuovo utente */
export const firstNodeId = allNodes[0].id;

/** Nodo successivo nel percorso obbligatorio (o lo stesso, se è l'ultimo) */
export function nextNodeId(id: string): string {
  const i = allNodes.findIndex((n) => n.id === id);
  if (i === -1) return id;
  const next = allNodes.slice(i + 1).find((n) => !isOptionalNode(n));
  return next ? next.id : id;
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
/** Pronome breve letto ad alta voce insieme alla forma del verbo */
const SPOKEN: Record<Person, string> = { eu: 'eu', tu: 'tu', ele_ela_voce: 'ele', nos: 'nós', eles_elas_voces: 'eles' };

export const tenseLabel = (t: string) => TENSE_LABELS[t] ?? t.replace(/_/g, ' ');

/** Righe della tabella di coniugazione, nell'ordine standard delle persone */
export function conjugationRows(verbId: string, tense: string) {
  const forms = getVerb(verbId)?.conjugations[tense];
  if (!forms) return [];
  return (Object.keys(PERSON_LABELS) as Person[]).map((p) => ({
    person: p,
    pronoun: PERSON_LABELS[p],
    verb: forms[p],
    /** Cosa si legge: pronome breve + forma, es. "ele é" */
    spoken: `${SPOKEN[p]} ${forms[p]}`,
  }));
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

function defaultPrompt(ex: ContentExercise, typed: boolean) {
  const target = verbTarget(ex);
  if (target) return `Conjuga o verbo ${target.verb.infinitive} (${tenseLabel(target.tense).toLowerCase()})`;
  return typed ? 'Completa a frase' : 'Escolhe a opção certa';
}

/** Prima nota per italiani tra le voci di vocabolario allenate dall'esercizio */
function italianNoteFromTrains(trains: string[]): string | undefined {
  for (const ref of trains) {
    if (!ref.startsWith('vocab:')) continue;
    const note = getVocab(ref.slice('vocab:'.length))?.italianNote;
    if (note) return note;
  }
  return undefined;
}

/**
 * Converte un esercizio del contenuto nel formato usato dai componenti.
 * Con `typed` anche le scelte multiple diventano da scrivere (sessioni senza aiuti).
 */
export function toRuntimeExercise(ex: ContentExercise, opts: { typed?: boolean } = {}): RuntimeExercise {
  const { before, answer, after } = splitAnswer(ex.text);
  const typed = ex.type === 'write' || Boolean(opts.typed);
  const base = {
    id: ex.id,
    prompt: ex.prompt ?? defaultPrompt(ex, typed),
    translationIt: ex.it,
    context: ex.context,
    contextIt: ex.contextIt,
    alternatives: ex.accept,
    trains: ex.trains,
    italianNote: ex.italianNote ?? italianNoteFromTrains(ex.trains),
  };

  if (typed) {
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

/** Frase completa di un esercizio con una data risposta: è quella che si legge ad alta voce */
export function exerciseSentence(ex: RuntimeExercise, answer: string = ex.correctAnswer) {
  return ex.type === 'multiple_choice' ? ex.sentence.replace(/_{3,}/, answer) : `${ex.sentenceBefore}${answer}${ex.sentenceAfter}`;
}

/** Esercizi di pratica di un verbo (sezione Gramática), filtrabili per tempo */
export function verbExercises(verbId: string, tense?: string): RuntimeExercise[] {
  const verb = getVerb(verbId);
  if (!verb) return [];
  return verb.exercises
    .filter((ex) => !tense || ex.trains.some((t) => t.startsWith(`verb:${verbId}:${tense}:`)))
    .map((ex) => toRuntimeExercise(ex));
}

// ---------- Teoria pronta da mostrare ----------

export interface ResolvedTheoryCard {
  kind: 'info';
  title: string;
  text: string;
  conjugation?: { pronoun: string; verb: string; spoken: string }[];
  examples?: { pt: string; it: string; note?: string; italianNote?: string }[];
}

export function resolveTheory(card: TheoryCard): ResolvedTheoryCard {
  const vocabExamples = (card.vocab ?? [])
    .map(getVocab)
    .filter((v): v is VocabItem => Boolean(v))
    .map((v) => ({ pt: v.pt, it: v.it, note: v.note, italianNote: v.italianNote }));
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

// ---------- Sessioni di un nodo ----------

/**
 * Ogni nodo si fa in più sessioni brevi, dal più guidato al più libero.
 * "listening" arriverà con l'audio pregenerato: è già previsto qui, ma non ancora attivo.
 */
export type SessionKind = 'discovery' | 'guided' | 'listening' | 'production' | 'test';

export const SESSION_INFO: Record<SessionKind, { name: string; description: string; icon: string }> = {
  discovery: { name: 'Descoberta', description: 'Teoria, ascolto e ricopiatura', icon: '📖' },
  guided: { name: 'Prática', description: 'Esercizi con opzioni e aiuti', icon: '✏️' },
  listening: { name: 'Escuta', description: 'Ascolta e scrivi', icon: '🎧' },
  production: { name: 'Produção', description: 'Scrivi tutto da solo, senza opzioni', icon: '🖊️' },
  test: { name: 'Teste final', description: 'Tutto mescolato: serve l’80% per superarlo', icon: '🏁' },
};

/** Precisione minima per superare il test finale (%) */
export const TEST_PASS_ACCURACY = 80;

/**
 * Una sessione di un nodo. "part" divide in più sessioni brevi la Descoberta dei nodi
 * di frasi: la prima presenta solo il primo gruppo di espressioni, la seconda gli altri.
 */
export interface Session {
  kind: SessionKind;
  part?: number;
}

export function sessionsFor(node: CourseNode): Session[] {
  if (node.kind === 'checkpoint') return [{ kind: 'test' }];
  if (node.kind === 'culture') return [{ kind: 'discovery' }, { kind: 'guided' }];
  // Nodi di frasi: poche espressioni alla volta, ognuna subito praticata
  const learn: Session[] =
    node.kind === 'vocab'
      ? [{ kind: 'discovery', part: 0 }, { kind: 'guided', part: 0 }, { kind: 'discovery', part: 1 }, { kind: 'guided', part: 1 }]
      : [{ kind: 'discovery' }, { kind: 'guided' }];
  return [...learn, { kind: 'production' }, { kind: 'test' }];
}

/** Identificativo stabile di una sessione, es. "discovery-1", "guided" */
export const sessionKey = (s: Session) => (s.part === undefined ? s.kind : `${s.kind}-${s.part + 1}`);
export const sameSession = (a: Session, b: Session) => sessionKey(a) === sessionKey(b);

export function sessionName(s: Session) {
  const name = SESSION_INFO[s.kind].name;
  return s.part === undefined ? name : `${name} ${s.part + 1}`;
}

/** Nome del gruppo (o dei gruppi) di espressioni di una parte, es. "Saluti del giorno" */
function partLabel(node: CourseNode, part: number) {
  const labels = vocabGroupLabels[node.id] ?? [];
  const mine = part === 0 ? labels.slice(0, 1) : labels.slice(1);
  return mine.join(' · ');
}

/** Descrizione mostrata sotto il nome della sessione nel fumetto della mappa */
export function sessionDescription(s: Session, node: CourseNode) {
  if (s.part !== undefined) {
    const label = partLabel(node, s.part);
    const what = label ? label.toLowerCase() : 'nuove espressioni';
    if (s.kind === 'discovery') return `Impara: ${what}`;
    if (s.kind === 'guided') return s.part === 0 ? `Esercitati: ${what}` : `Esercitati: ${what}, più un ripasso`;
  }
  if (s.kind === 'discovery') {
    if (node.kind === 'verb') return 'La regola e le sue forme, da ascoltare e ricopiare';
    if (node.kind === 'dialogue') return 'Le frasi che ti servono nella conversazione';
    if (node.kind === 'culture') return 'Una curiosità da leggere';
  }
  if (s.kind === 'guided' && node.kind === 'culture') return 'Tre domande veloci';
  if (node.kind === 'dialogue') {
    if (s.kind === 'guided') return 'La conversazione, con opzioni e aiuti';
    if (s.kind === 'production') return 'La conversazione, tutta da scrivere';
    if (s.kind === 'test') return 'La conversazione senza aiuti: serve l’80%';
  }
  if (node.kind === 'checkpoint') return 'Frasi da tutto il capitolo: serve l’80%';
  return SESSION_INFO[s.kind].description;
}

/**
 * Teoria di una sessione di Descoberta. Senza "part": tutta.
 * Parte 0: le schede introduttive e il primo gruppo dello studio del vocabolario.
 * Parte 1: gli altri gruppi.
 */
export function theoryForSession(theory: TheoryItem[], session: Session): TheoryItem[] {
  if (session.part === undefined) return theory;
  return theory.flatMap((item): TheoryItem[] => {
    if (!('vocabStudy' in item)) return session.part === 0 ? [item] : [];
    const groups = session.part === 0 ? item.vocabStudy.groups.slice(0, 1) : item.vocabStudy.groups.slice(1);
    return groups.length ? [{ vocabStudy: { ...item.vocabStudy, groups } }] : [];
  });
}

/**
 * Il nodo successivo si sblocca già dopo Prática: Produção e Teste final consolidano
 * e si possono fare anche più avanti. Il checkpoint invece chiede tutti i test del capitolo.
 */
export function sessionsToOpenNext(node: CourseNode) {
  const list = sessionsFor(node);
  const i = list.map((s) => s.kind).lastIndexOf('guided');
  return i === -1 ? list.length : i + 1;
}

/** Il nodo ha fatto abbastanza sessioni da sbloccare il successivo */
export function opensNext(node: CourseNode, completedNodeIds: string[], sessionProgress: Record<string, number>) {
  return completedNodeIds.includes(node.id) || (sessionProgress[node.id] ?? 0) >= sessionsToOpenNext(node);
}

/** Sessioni completate di un nodo, a partire dai progressi salvati */
export function sessionsDone(node: CourseNode, completedNodeIds: string[], sessionProgress: Record<string, number>) {
  const total = sessionsFor(node).length;
  if (completedNodeIds.includes(node.id)) return total;
  return Math.min(total, sessionProgress[node.id] ?? 0);
}

/**
 * Esercizi ricavati dalla teoria, senza scriverli a mano:
 * - studio del vocabolario → per ogni situazione si scrive l'espressione;
 * - paradigma → per ogni persona si scrive la forma del verbo.
 */
function generatedExercises(theory: TheoryItem[]): RuntimeExercise[] {
  return theory.flatMap((item): RuntimeExercise[] => {
    if ('vocabStudy' in item) {
      return item.vocabStudy.groups
        .flatMap((g) => g.items)
        .map(getVocab)
        .filter((v): v is VocabItem => Boolean(v?.situation))
        .map((v) => {
          const { form, after } = splitTrailingPunctuation(v.pt);
          return {
            id: `gen-vocab-${v.id}`,
            type: 'fill_in_the_blank' as const,
            prompt: v.situation!,
            sentenceBefore: '',
            sentenceAfter: after,
            correctAnswer: form,
            trains: [`vocab:${v.id}`],
            italianNote: v.italianNote,
          };
        });
    }
    if ('paradigm' in item) {
      const { verb: verbId, tense } = item.paradigm;
      const verb = getVerb(verbId);
      const forms = verb?.conjugations[tense];
      if (!verb || !forms) return [];
      return [...SINGULAR, ...PLURAL].map((p) => ({
        id: `gen-verb-${verbId}-${tense}-${p}`,
        type: 'fill_in_the_blank' as const,
        prompt: `Verbo ${verb.infinitive} · ${tenseLabel(tense).toLowerCase()}`,
        sentenceBefore: `${PERSON_LABELS[p]} `,
        sentenceAfter: '',
        correctAnswer: forms[p],
        trains: [`verb:${verbId}:${tense}:${p}`],
      }));
    }
    return [];
  });
}

/** Quanti esercizi propone una sessione (il modello di capitolo prevede 8–12, il checkpoint 12–15) */
export const SESSION_SIZE: Record<SessionKind, number> = { discovery: 0, guided: 10, listening: 10, production: 10, test: 12 };
/** Checkpoint: frasi proprie + frasi pescate da ogni nodo obbligatorio del capitolo */
export const CHECKPOINT_OWN = 4;
/** Prática divisa in parti: esercizi sulle espressioni nuove + ripasso delle precedenti */
export const GUIDED_PART_SIZE = 6;
export const GUIDED_REVIEW = 2;
export const CHECKPOINT_PER_NODE = 3;

/**
 * Tutti gli esercizi che una sessione può proporre, prima del campionamento.
 * Serve anche a chi deve conoscere ogni frase possibile (es. la generazione degli audio).
 * - guided: gli esercizi così come sono scritti (opzioni, frase con spazio);
 * - production / test: tutto da scrivere, più gli esercizi ricavati dalla teoria.
 * Nelle conversazioni l'ordine resta quello del dialogo.
 */
export function sessionPool(kind: SessionKind, node: CourseNode, content: NodeContent): RuntimeExercise[] {
  if (kind === 'discovery') return [];
  if (kind === 'guided') return content.exercises.map((ex) => toRuntimeExercise(ex));
  const typed = content.exercises.map((ex) => toRuntimeExercise(ex, { typed: true }));
  if (node.kind === 'dialogue') return typed;
  return [...typed, ...generatedExercises(content.theory ?? [])];
}

/**
 * Pesca `n` esercizi, prima tra quelli mai visti e poi tra gli altri, in ordine casuale.
 * Così ogni sessione propone frasi nuove finché ce ne sono, e il test finale
 * contiene il più possibile frasi mai incontrate prima.
 */
export function pickExercises<T extends { id: string }>(list: T[], n: number, seen: ReadonlySet<string>): T[] {
  const fresh = shuffle(list.filter((e) => !seen.has(e.id)));
  const old = shuffle(list.filter((e) => seen.has(e.id)));
  return [...fresh, ...old].slice(0, n);
}

export interface SessionOptions {
  /** Esercizi già visti dall'utente */
  seen?: ReadonlySet<string>;
  /** Parte della sessione (nodi di frasi): Prática 1 usa il primo gruppo, Prática 2 gli altri */
  part?: number;
  /** Solo per il checkpoint: i contenuti dei nodi del capitolo da cui pescare */
  chapterContents?: { node: CourseNode; content: NodeContent }[];
}

/**
 * Esercizi di una sessione. Si scrivono le frasi una volta sola nel JSON;
 * le sessioni ne ricavano le varie modalità e ne pescano solo una parte.
 * - conversazioni: tutto il dialogo, nell'ordine;
 * - checkpoint: alcune frasi sue + alcune da ogni nodo obbligatorio del capitolo;
 * - altri nodi: un campione, con precedenza alle frasi mai viste.
 */
export function sessionExercises(kind: SessionKind, node: CourseNode, content: NodeContent, opts: SessionOptions = {}): RuntimeExercise[] {
  const seen = opts.seen ?? new Set<string>();
  const pool = sessionPool(kind, node, content);
  if (node.kind === 'dialogue') return pool;

  if (node.kind === 'checkpoint') {
    const own = pickExercises(pool, CHECKPOINT_OWN, seen);
    const fromNodes = (opts.chapterContents ?? []).flatMap(({ node: n, content: c }) =>
      pickExercises(sessionPool('test', n, c), CHECKPOINT_PER_NODE, seen)
    );
    return shuffle([...own, ...fromNodes]);
  }

  // Prática divisa in parti: solo le espressioni della parte, più un piccolo ripasso delle precedenti
  if (kind === 'guided' && opts.part !== undefined) {
    const groups = (content.theory ?? []).flatMap((c) => ('vocabStudy' in c ? c.vocabStudy.groups : []));
    const idsOf = (gs: typeof groups) => new Set(gs.flatMap((g) => g.items.map((id) => `vocab:${id}`)));
    const current = idsOf(opts.part === 0 ? groups.slice(0, 1) : groups.slice(1));
    const previous = idsOf(opts.part === 0 ? [] : groups.slice(0, 1));
    const reserved = new Set(content.exercises.filter((_, i) => i % 3 === 2).map((e) => e.id));
    const trainsAny = (e: RuntimeExercise, ids: Set<string>) => (e.trains ?? []).some((t) => ids.has(t));
    const usable = pool.filter((e) => !reserved.has(e.id));
    const main = pickExercises(usable.filter((e) => trainsAny(e, current)), GUIDED_PART_SIZE, seen);
    const review = pickExercises(usable.filter((e) => trainsAny(e, previous) && !main.includes(e)), GUIDED_REVIEW, seen);
    return shuffle([...main, ...review]);
  }

  // Circa un terzo delle frasi scritte resta da parte per il test finale, così il test
  // ne propone sempre di mai viste. Nei nodi piccoli (es. cultura) si usano tutte.
  const size = SESSION_SIZE[kind];
  if (kind !== 'test') {
    const reserved = new Set(content.exercises.filter((_, i) => i % 3 === 2).map((e) => e.id));
    const available = pool.filter((e) => !reserved.has(e.id));
    if (available.length >= Math.min(size, 8)) return pickExercises(available, size, seen);
  }
  return pickExercises(pool, size, seen);
}

/**
 * Nodi da cui pesca un checkpoint: quelli indicati in "requires" oppure,
 * se mancano, tutti i nodi obbligatori che lo precedono nel capitolo.
 */
export function checkpointSources(node: CourseNode): CourseNode[] {
  const chapter = chapters.find((c) => c.nodes.some((n) => n.id === node.id));
  if (!chapter) return [];
  const before = chapter.nodes.slice(0, chapter.nodes.findIndex((n) => n.id === node.id));
  const ids = node.requires ?? before.filter((n) => !isOptionalNode(n) && !n.draft).map((n) => n.id);
  return ids.map(getCourseNode).filter((n): n is CourseNode => Boolean(n));
}

/** Carica i contenuti dei nodi da cui pesca un checkpoint */
export async function loadCheckpointSources(node: CourseNode) {
  const sources = checkpointSources(node);
  const contents = await Promise.all(sources.map((n) => loadNode(n.id)));
  return sources.flatMap((n, i) => (contents[i] ? [{ node: n, content: contents[i]! }] : []));
}
