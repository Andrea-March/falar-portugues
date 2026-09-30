/**
 * Regole dei file di contenuto (src/content/courses/<corso>/**).
 * Lo script `npm run content` controlla ogni file con questi schemi e con alcune
 * verifiche incrociate (riferimenti esistenti, ID unici, forme verbali corrette).
 * I tipi TypeScript usati dall'app derivano da qui: schema e codice non possono divergere.
 */
import { z } from 'zod';

// ---------- Mattoni ----------

/**
 * Persona grammaticale, es. "eu" o "ele_ela_voce". Quali esistono lo decide il corso
 * (persons in courses/<id>/config.ts); lo script dei contenuti controlla che coincidano.
 */
export const Person = z.string().regex(/^[a-z_]+$/, 'solo minuscole e "_"');
export type Person = z.infer<typeof Person>;

const Slug = z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, 'solo minuscole, cifre, "-" o "_"');
const Tense = z.string().regex(/^[a-z_]+$/, 'es. "presente", "preterito_perfeito"');
const NonEmpty = z.string().trim().min(1);

/**
 * Nota per chi impara, nella sua lingua: dove sbaglia davvero (pronuncia, falsi amici,
 * cortesia, varianti da evitare). Al massimo 2 frasi brevi; va confermata da una madrelingua.
 */
const LearnerNote = NonEmpty.max(240, 'al massimo 2 frasi brevi');

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
 *   "skill:doppie"          → un punto difficile (pronuncia, ortografia, grammatica)
 */
export const TrainsRef = z
  .string()
  .regex(/^(verb:[a-z_]+:[a-z_]+:[a-z_]+|vocab:[a-z0-9-]+|skill:[a-z0-9-]+)$/, 'formato "verb:ser:presente:eu", "vocab:bom-dia" o "skill:doppie"');

// ---------- Esercizi ----------

const ExerciseBase = {
  id: Slug,
  /** Frase con la risposta tra graffe */
  text: AnswerText,
  /** Traduzione della frase nella lingua di chi impara */
  translation: NonEmpty.optional(),
  /** Consegna personalizzata; se manca la genera l'app */
  prompt: NonEmpty.optional(),
  /** Battuta dell'altra persona prima di questa risposta (nodi "dialogue"): mostrata come bolla di chat */
  context: NonEmpty.optional(),
  /** Traduzione della battuta in "context" (si mostra toccando la bolla) */
  contextTranslation: NonEmpty.optional(),
  /**
   * Altre risposte giuste quando si scrive (es. "Obrigada" accanto a "Obrigado").
   * Servono perché nelle sessioni "Produção" e "Teste" anche le scelte multiple si scrivono.
   */
  accept: z.array(NonEmpty).min(1).optional(),
  /** Nota per chi impara, mostrata dopo un errore (se manca, si usa quella della voce allenata) */
  learnerNote: LearnerNote.optional(),
  trains: z.array(TrainsRef).min(1, 'indica almeno una cosa allenata (verb:… o vocab:…)'),
  /**
   * Esercizio di ascolto: si sente la frase e la traduzione resta nascosta.
   * Con "choose" è una coppia minima (Ho detto {carro} / caro), con "write" un dettato.
   */
  listen: z.literal(true).optional(),
};

/** L'utente scrive la risposta */
export const WriteExercise = z
  .strictObject({
    ...ExerciseBase,
    type: z.literal('write'),
    /**
     * Facoltativi: opzioni sbagliate per quando una sessione trasforma il turno in scelta.
     * Obbligatori nelle conversazioni, dove in Prática tutti i turni sono a scelta.
     */
    wrong: z.array(NonEmpty).min(1).optional(),
    wrongFrom: z.literal('verb-forms').optional(),
  })
  .refine((e) => !(e.wrong && e.wrongFrom), {
    message: 'indica "wrong" oppure "wrongFrom": "verb-forms", non entrambi',
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
  /** Testo; **grassetto** evidenzia una parola o frase nella lingua che si impara, che si ascolta toccandola (mai per la lingua di chi impara) */
  text: NonEmpty,
  /** Mostra la tabella di coniugazione presa dal file del verbo */
  verb: z.strictObject({ verb: Slug, tense: Tense }).optional(),
  /** Mostra queste voci del vocabolario (per id) */
  vocab: z.array(Slug).min(1).optional(),
  /** Esempi liberi */
  examples: z.array(z.strictObject({ text: NonEmpty, translation: NonEmpty, learnerNote: LearnerNote.optional() })).min(1).optional(),
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

// ---------- File: una lezione (courses/<corso>/nodes/<id>.json) ----------

/** Interlocutore di un nodo "dialogue": nome e avatar in cima alla chat */
export const Speaker = z.strictObject({
  name: NonEmpty,
  /** Riga sotto il nome, es. "Empregado · Café Nicola" */
  role: NonEmpty.optional(),
  /** Un'emoji */
  avatar: NonEmpty,
  /** Voce delle sue battute: una chiave di audio.config.json (predefinita: "default") */
  voice: Slug.optional(),
});
export type Speaker = z.infer<typeof Speaker>;

export const NodeContent = z.strictObject({
  id: Slug,
  speaker: Speaker.optional(),
  theory: z.array(TheoryItem).optional(),
  /**
   * Assaggio di conversazione alla fine della prima Descoberta: poche battute facili
   * con un personaggio, per arrivare subito a "parlare". Usa solo le espressioni appena viste.
   */
  warmup: z
    .strictObject({
      speaker: Speaker,
      exercises: z.array(Exercise).min(1).max(3),
    })
    .optional(),
  exercises: z.array(Exercise).min(1),
  /**
   * Solo nodi "dialogue": la conversazione del Teste final. È una conversazione nuova
   * nella stessa situazione, così il test non si supera ricordando quella di Produção.
   * Riusa le espressioni di tutto il capitolo. Si scrive tutto, senza traduzioni.
   */
  /**
   * Solo nodi "dialogue", nei corsi con listeningSession: la sessione Ascolto, la prima del nodo.
   * Si sente tutta la conversazione (le battute di "exercises", in ordine) senza testo,
   * poi 2–4 domande di comprensione sul senso generale, poi il testo si svela.
   */
  listening: z
    .strictObject({
      /** La situazione, prima di ascoltare (lingua di chi impara), es. "A Ines entra num café." */
      intro: NonEmpty.optional(),
      questions: z
        .array(
          z.strictObject({
            /** Domanda nella lingua di chi impara */
            question: NonEmpty,
            answer: NonEmpty,
            wrong: z.array(NonEmpty).min(1).max(3),
            /** Mostrata dopo la risposta, es. dove si sente nella conversazione */
            note: LearnerNote.optional(),
          })
        )
        .min(2)
        .max(4),
    })
    .optional(),
  test: z
    .strictObject({
      /** Interlocutore, se diverso da quello del nodo */
      speaker: Speaker.optional(),
      exercises: z.array(Exercise).min(3),
    })
    .optional(),
});
export type NodeContent = z.infer<typeof NodeContent>;

// ---------- File: un verbo (courses/<corso>/verbs/<id>.json) ----------

export const Verb = z.strictObject({
  id: Slug,
  infinitive: NonEmpty,
  /** Traduzione dell'infinito nella lingua di chi impara */
  translation: NonEmpty,
  regular: z.boolean(),
  /** Coniugazione, es. "ar" (i valori ammessi li decide il corso: verbGroups) */
  group: z.string().regex(/^[a-z]+$/),
  /** Per ogni tempo, la forma di ogni persona del corso */
  conjugations: z.record(Tense, z.record(Person, NonEmpty)),
  /** Frasi d'esempio/esercizi per la pratica del verbo (sezione Gramática) */
  exercises: z.array(Exercise),
});
export type Verb = z.infer<typeof Verb>;

// ---------- File: un punto difficile (courses/<corso>/skills/<id>.json) ----------

/**
 * Punto difficile per chi parla la lingua di partenza (doppie, pronomi…): spiegazione
 * contrastiva e palestra di esercizi, nella tab "Punti difficili" della Grammatica.
 * Ogni esercizio allena "skill:<id>"; gli errori su quella skill la fanno salire nella lista.
 */
export const Skill = z.strictObject({
  id: Slug,
  title: NonEmpty,
  /** Una riga sotto il titolo, nella lingua di chi impara */
  subtitle: NonEmpty,
  /** Un'emoji */
  icon: NonEmpty,
  /** Schede di spiegazione (niente paradigmi né studio del vocabolario) */
  theory: z.array(TheoryCard).min(1),
  exercises: z.array(Exercise).min(4),
});
export type Skill = z.infer<typeof Skill>;

// ---------- File: una registrazione (courses/<corso>/recordings/<id>.json) ----------

/**
 * Registrazione vera (voce umana) per la tab Ascolto. L'audio sta in
 * public/recordings/<corso>/<file>; il testo è diviso in frasi con la traduzione.
 * "at" (secondi dall'inizio) è facoltativo: se c'è in tutte le frasi, la frase che si
 * sta ascoltando si evidenzia e toccandone una si salta lì.
 */
export const Recording = z.strictObject({
  id: Slug,
  title: NonEmpty,
  /** Una riga sotto il titolo, nella lingua di chi impara */
  subtitle: NonEmpty,
  /** Per quando è adatta, es. "Depois do capítulo 2" */
  level: NonEmpty.optional(),
  /** Nome del file audio in public/recordings/<corso>/ */
  file: z.string().regex(/^[a-z0-9_-]+\.(mp3|m4a)$/, 'es. "un-caffe-al-volo.mp3" (mp3 o m4a, minuscole)'),
  /** In preparazione: non compare nell'app e l'audio può ancora mancare */
  draft: z.boolean().optional(),
  segments: z
    .array(
      z.strictObject({
        text: NonEmpty,
        translation: NonEmpty,
        at: z.number().nonnegative().optional(),
      })
    )
    .min(1),
});
export type Recording = z.infer<typeof Recording>;

// ---------- File: un gruppo di vocaboli (courses/<corso>/vocab/<id>.json) ----------

export const VocabItem = z.strictObject({
  id: Slug,
  /** L'espressione nella lingua che si impara */
  text: NonEmpty,
  /** Il significato nella lingua di chi impara */
  translation: NonEmpty,
  /** Nota d'uso, es. "informale", "detto da un uomo" */
  note: NonEmpty.optional(),
  /** Un'emoji che accompagna la voce nello studio guidato, es. "☀️" */
  icon: NonEmpty.optional(),
  /** Quando si usa, mostrato nello studio guidato, es. "Dal mattino fino all'ora di pranzo" */
  usage: NonEmpty.optional(),
  /** Situazione per il ripasso a memoria: deve portare a questa espressione e non a un'altra */
  situation: NonEmpty.optional(),
  /** Nota per chi impara: nello studio guidato, negli esempi e dopo un errore collegato */
  learnerNote: LearnerNote.optional(),
});
export type VocabItem = z.infer<typeof VocabItem>;

export const VocabSet = z.strictObject({
  id: Slug,
  title: NonEmpty,
  items: z.array(VocabItem).min(1),
});
export type VocabSet = z.infer<typeof VocabSet>;

// ---------- File: il corso (courses/<corso>/course.json) ----------

/** "culture": scheda breve + poche domande leggere; è facoltativo e non blocca il percorso */
export const NodeKind = z.enum(['verb', 'vocab', 'dialogue', 'culture', 'checkpoint']);

export const CourseNode = z.strictObject({
  id: Slug,
  kind: NodeKind,
  title: NonEmpty,
  subtitle: NonEmpty,
  icon: NonEmpty,
  /** Nodi da completare prima (se manca: basta il precedente) */
  requires: z.array(Slug).optional(),
  /** Si sblocca insieme al nodo precedente, senza doverlo prima fare (non vale per il primo del capitolo) */
  openWithPrevious: z.boolean().optional(),
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
  /**
   * Verbi e tempi visibili nella Grammatica fin dall'inizio, anche prima di incontrarli nel percorso
   * (es. per un test). Gli altri compaiono man mano che si studiano.
   */
  grammarPreview: z.array(z.strictObject({ verb: Slug, tenses: z.array(Tense).min(1) })).optional(),
});
export type Course = z.infer<typeof Course>;
