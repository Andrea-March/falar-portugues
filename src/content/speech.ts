/**
 * Tutto ciò che l'app legge ad alta voce, ricavato dai contenuti.
 * Lo usa lo script degli audio (per sapere quali file generare) e l'app
 * (per scaricarli in anticipo all'inizio di una sessione).
 * Se un componente inizia a leggere un testo nuovo, va aggiunto qui.
 */
import {
  chapters,
  exerciseSentence,
  loadNode,
  PERSON_LABELS,
  sessionPool,
  sessionsFor,
  theorySteps,
  verbExercises,
  verbs,
  type CourseNode,
  type NodeContent,
  type Person,
  type Session,
  theoryForSession,
  toRuntimeExercise,
} from './index';

export interface SpeechItem {
  text: string;
  /** Chiave di audio.config.json; assente = "default" */
  voice?: string;
}

/** Testi letti in una sessione di un nodo */
export function sessionSpeech(session: Session, node: CourseNode, content: NodeContent): SpeechItem[] {
  const kind = session.kind;
  const out: SpeechItem[] = [];

  if (kind === 'discovery') {
    for (const step of theorySteps(theoryForSession(content.theory ?? [], session))) {
      if (step.kind === 'info') {
        // Le parole in grassetto del testo si ascoltano toccandole
        for (const m of step.text.matchAll(/\*\*(.*?)\*\*/g)) out.push({ text: m[1].replace(/…/g, '') });
        step.examples?.forEach((e) => out.push({ text: e.pt }));
        step.conjugation?.forEach((c) => out.push({ text: c.spoken }));
      } else if (step.kind === 'paradigm') {
        step.rows.forEach((r) => out.push({ text: `${r.spoken} ${r.form}` }));
      } else if (step.kind === 'vocab-present') {
        out.push({ text: step.item.pt });
      } else if (step.kind === 'vocab-recall') {
        step.rows.forEach((r) => out.push({ text: r.pt }));
      }
    }
    // Assaggio di conversazione alla fine della prima Descoberta
    if (content.warmup && (session.part ?? 0) === 0) {
      for (const ex of content.warmup.exercises.map((e) => toRuntimeExercise(e))) {
        if (ex.context) out.push({ text: ex.context, voice: content.warmup.speaker.voice });
        out.push({ text: exerciseSentence(ex) });
      }
    }
    return out;
  }

  for (const ex of sessionPool(kind, node, content)) {
    if (ex.context) out.push({ text: ex.context, voice: content.speaker?.voice });
    out.push({ text: exerciseSentence(ex) });
    ex.alternatives?.forEach((a) => out.push({ text: exerciseSentence(ex, a) }));
  }
  return out;
}

/** Testi della sezione Gramática: infinito, forme con il pronome, esercizi dei verbi */
function grammarSpeech(): SpeechItem[] {
  return verbs.flatMap((v) => [
    { text: v.infinitive },
    ...Object.values(v.conjugations).flatMap((forms) =>
      (Object.keys(PERSON_LABELS) as Person[]).filter((p) => forms[p]).map((p) => ({ text: `${PERSON_LABELS[p]} ${forms[p]}` }))
    ),
    ...verbExercises(v.id).map((ex) => ({ text: exerciseSentence(ex) })),
  ]);
}

/** Tutto il corso (per lo script degli audio) */
export async function allSpeech(): Promise<SpeechItem[]> {
  const out: SpeechItem[] = [];
  for (const node of chapters.flatMap((c) => c.nodes)) {
    const content = await loadNode(node.id);
    if (!content) continue;
    for (const session of sessionsFor(node)) out.push(...sessionSpeech(session, node, content));
  }
  out.push(...grammarSpeech());
  return out;
}
