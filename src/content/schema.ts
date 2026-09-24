/**
 * Regole dei file di contenuto (src/content/**).
 * Lo script `npm run content` controlla ogni file con questi schemi e con alcune
 * verifiche incrociate (riferimenti esistenti, ID unici, forme verbali corrette).
 * I tipi TypeScript usati dall'app derivano da qui: schema e codice non possono divergere.
 */
import { z } from 'zod';

// ---------- Mattoni ----------

/** Persone grammaticali (in PT-PT "você" si coniuga come ele/ela) */
export const PERSONS = ['eu', 'tu', 'ele_ela_voce', 'nos', 'eles_elas_voces'] as const;
export const Person = z.enum(PERSONS);
export type Person = z.infer<typeof Person>;

const Slug = z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, 'solo minuscole, cifre, "-" o "_"');
const Tense = z.string().regex(/^[a-z_]+$/, 'es. "presente", "preterito_perfeito"');
const NonEmpty = z.string().trim().min(1);

/**
 * Frase con la risposta tra graffe: "Eu {sou} de Roma."
 * Esattamente una coppia di graffe, non vuota.
 */
export const AnswerText = z
  .string()
  .regex(/^[^{}]*\{[^{}]+\}[^{}]*$/, 'serve esattamente una risposta tra graffe, es. "Eu {sou} de Roma."');

/**
 * Cosa allena un esercizio, per il ripasso futuro:
 *   "verb:ser:presente:eu"  → una forma verbale
 *   "vocab:bom-dia"         → una voce del vocabolario
 */
export const TrainsRef = z
  .string()
  .regex(/^(verb:[a-z_]+:[a-z_]+:[a-z_]+|vocab:[a-z0-9-]+)$/, 'formato "verb:ser:presente:eu" o "vocab:bom-dia"');

// ---------- Esercizi ----------

const ExerciseBase = {
  id: Slug,
  /** Frase con la risposta tra graffe */
  text: AnswerText,
  /** Traduzione italiana della frase */
  it: NonEmpty.optional(),
  /** Consegna personalizzata; se manca la genera l'app */
  prompt: NonEmpty.optional(),
  /** Battuta dell'altra persona prima di questa risposta (nodi "dialogue"): mostrata come bolla di chat */
  context: NonEmpty.optional(),
  /** Traduzione italiana della battuta in "context" (si mostra toccando la bolla) */
  contextIt: NonEmpty.optional(),
  trains: z.array(TrainsRef).min(1, 'indica almeno una cosa allenata (verb:… o vocab:…)'),
};

/** L'utente scrive la risposta */
export const WriteExercise = z.strictObject({
  ...ExerciseBase,
  type: z.literal('write'),
});

/** L'utente sceglie tra opzioni */
export const ChooseExercise = z
  .strictObject({
    ...ExerciseBase,
    type: z.literal('choose'),
    /** Opzioni sbagliate scritte a mano */
    wrong: z.array(NonEmpty).min(1).optional(),
    /** Oppure: opzioni sbagliate generate dalle altre forme dello stesso tempo verbale */
    wrongFrom: z.literal('verb-forms').optional(),
  })
  .refine((e) => Boolean(e.wrong) !== Boolean(e.wrongFrom), {
    message: 'indica "wrong" (opzioni a mano) oppure "wrongFrom": "verb-forms", non entrambi',
  });

export const Exercise = z.discriminatedUnion('type', [WriteExercise, ChooseExercise]);
export type Exercise = z.infer<typeof Exercise>;

// ---------- Teoria ----------

export const TheoryCard = z.strictObject({
  title: NonEmpty,
  /** Testo; **grassetto** evidenzia una parola */
  text: NonEmpty,
  /** Mostra la tabella di coniugazione presa dal file del verbo */
  verb: z.strictObject({ verb: Slug, tense: Tense }).optional(),
  /** Mostra queste voci del vocabolario (per id) */
  vocab: z.array(Slug).min(1).optional(),
  /** Esempi liberi */
  examples: z.array(z.strictObject({ pt: NonEmpty, it: NonEmpty })).min(1).optional(),
});
export type TheoryCard = z.infer<typeof TheoryCard>;

/** Studio guidato di un paradigma: diventa 4 schermate (singolare, plurale, tutto con traccia, tutto a memoria) */
export const ParadigmCard = z.strictObject({
  paradigm: z.strictObject({ verb: Slug, tense: Tense }),
});
export type ParadigmCard = z.infer<typeof ParadigmCard>;

/**
 * Studio guidato del vocabolario: ogni gruppo diventa una schermata per espressione
 * (ascolto + significato + ricopiatura), poi una schermata finale a memoria in cui
 * si risponde alle situazioni ("situation" delle voci).
 */
export const VocabStudyCard = z.strictObject({
  vocabStudy: z.strictObject({
    groups: z
      .array(
        z.strictObject({
          /** Nome del gruppo, es. "Saluti del giorno" */
          label: NonEmpty,
          items: z.array(Slug).min(1),
        })
      )
      .min(1),
    /** Schermata finale a memoria (predefinito: sì) */
    recall: z.boolean().optional(),
  }),
});
export type VocabStudyCard = z.infer<typeof VocabStudyCard>;

export const TheoryItem = z.union([TheoryCard, ParadigmCard, VocabStudyCard]);
export type TheoryItem = z.infer<typeof TheoryItem>;

export const SINGULAR: Person[] = ['eu', 'tu', 'ele_ela_voce'];
export const PLURAL: Person[] = ['nos', 'eles_elas_voces'];

// ---------- File: una lezione (src/content/nodes/<id>.json) ----------

/** Interlocutore di un nodo "dialogue": nome e avatar in cima alla chat */
export const Speaker = z.strictObject({
  name: NonEmpty,
  /** Riga sotto il nome, es. "Empregado · Café Nicola" */
  role: NonEmpty.optional(),
  /** Un'emoji */
  avatar: NonEmpty,
});
export type Speaker = z.infer<typeof Speaker>;

export const NodeContent = z.strictObject({
  id: Slug,
  speaker: Speaker.optional(),
  theory: z.array(TheoryItem).optional(),
  exercises: z.array(Exercise).min(1),
});
export type NodeContent = z.infer<typeof NodeContent>;

// ---------- File: un verbo (src/content/verbs/<id>.json) ----------

export const Verb = z.strictObject({
  id: Slug,
  infinitive: NonEmpty,
  it: NonEmpty,
  regular: z.boolean(),
  group: z.enum(['ar', 'er', 'ir']),
  conjugations: z.record(Tense, z.strictObject(Object.fromEntries(PERSONS.map((p) => [p, NonEmpty])) as Record<Person, typeof NonEmpty>)),
  /** Frasi d'esempio/esercizi per la pratica del verbo (sezione Gramática) */
  exercises: z.array(Exercise),
});
export type Verb = z.infer<typeof Verb>;

// ---------- File: un gruppo di vocaboli (src/content/vocab/<id>.json) ----------

export const VocabItem = z.strictObject({
  id: Slug,
  pt: NonEmpty,
  it: NonEmpty,
  /** Nota d'uso, es. "informale", "detto da un uomo" */
  note: NonEmpty.optional(),
  /** Un'emoji che accompagna la voce nello studio guidato, es. "☀️" */
  icon: NonEmpty.optional(),
  /** Quando si usa, mostrato nello studio guidato, es. "Dal mattino fino all'ora di pranzo" */
  usage: NonEmpty.optional(),
  /** Situazione per il ripasso a memoria: deve portare a questa espressione e non a un'altra */
  situation: NonEmpty.optional(),
});
export type VocabItem = z.infer<typeof VocabItem>;

export const VocabSet = z.strictObject({
  id: Slug,
  title: NonEmpty,
  items: z.array(VocabItem).min(1),
});
export type VocabSet = z.infer<typeof VocabSet>;

// ---------- File: il corso (src/content/course.json) ----------

export const NodeKind = z.enum(['verb', 'vocab', 'dialogue', 'checkpoint']);

export const CourseNode = z.strictObject({
  id: Slug,
  kind: NodeKind,
  title: NonEmpty,
  subtitle: NonEmpty,
  icon: NonEmpty,
  /** Nodi da completare prima (se manca: basta il precedente) */
  requires: z.array(Slug).optional(),
  /** Lezione non ancora scritta: compare sulla mappa ma non si può aprire */
  draft: z.boolean().optional(),
});
export type CourseNode = z.infer<typeof CourseNode>;

export const Chapter = z.strictObject({
  id: Slug,
  number: z.number().int().positive(),
  title: NonEmpty,
  description: NonEmpty,
  icon: NonEmpty,
  nodes: z.array(CourseNode).min(1),
});
export type Chapter = z.infer<typeof Chapter>;

export const Course = z.strictObject({
  chapters: z.array(Chapter).min(1),
});
export type Course = z.infer<typeof Course>;
