/**
 * Tutto ciò che l'app legge ad alta voce, ricavato dai contenuti.
 * Lo usa lo script degli audio (per sapere quali file generare) e l'app
 * (per scaricarli in anticipo all'inizio di una sessione).
 * Se un componente inizia a leggere un testo nuovo, va aggiunto qui.
 */
import {
  chapters,
  course,
  getVerb,
  exerciseSentence,
  loadNode,
  PERSON_LABELS,
  sessionPool,
  sessionsFor,
  dialogueSpeaker,
  theorySteps,
  conjugationRows,
  verbs,
  type CourseNode,
  type NodeContent,
  type Person,
  type Session,
  theoryForSession,
  toRuntimeExercise,
  dialogueLines,
  ui,
} from './index';
import { skillList } from './registry.generated';

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
        step.examples?.forEach((e) => out.push({ text: e.text }));
        step.conjugation?.forEach((c) => out.push({ text: c.spoken }));
      } else if (step.kind === 'paradigm') {
        step.rows.forEach((r) => out.push({ text: `${r.spoken} ${r.form}` }));
      } else if (step.kind === 'vocab-present') {
        out.push({ text: step.item.text });
      } else if (step.kind === 'vocab-recall') {
        step.rows.forEach((r) => out.push({ text: r.text }));
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

  if (kind === 'listening') return dialogueLines(content).map((l) => ({ text: l.text, voice: l.voice }));

  for (const ex of sessionPool(kind, node, content)) {
    if (ex.context) out.push({ text: ex.context, voice: dialogueSpeaker(kind, content)?.voice });
    out.push({ text: exerciseSentence(ex) });
    ex.alternatives?.forEach((a) => out.push({ text: exerciseSentence(ex, a) }));
  }
  return out;
}

/**
 * Testi della sezione Gramática: infinito e righe della tabella (pronome breve + forma,
 * come nello studio del paradigma). Gli esercizi vengono dai nodi, già inclusi sopra.
 */
function grammarSpeech(): SpeechItem[] {
  const rows = verbs.flatMap((v) => [
    { text: v.infinitive },
    ...Object.keys(v.conjugations).flatMap((tense) => conjugationRows(v.id, tense).map((r) => ({ text: r.spoken }))),
  ]);
  // I tempi in anteprima si allenano con le frasi del file del verbo (vedi verbPractice)
  const preview = (course.grammarPreview ?? []).flatMap(({ verb, tenses }) =>
    (getVerb(verb)?.exercises ?? [])
      .filter((ex) => tenses.some((t) => ex.trains.some((tr) => tr.startsWith(`verb:${verb}:${t}:`))))
      .map((ex) => toRuntimeExercise(ex))
      .flatMap((ex) => [exerciseSentence(ex), ...(ex.alternatives ?? []).map((a) => exerciseSentence(ex, a))])
      .map((text) => ({ text }))
  );
  return [...rows, ...preview];
}

/** Punti difficili: parole in grassetto ed esempi delle spiegazioni, frasi degli esercizi */
export function skillSpeech(): SpeechItem[] {
  const out: SpeechItem[] = [];
  for (const skill of skillList) {
    for (const card of skill.theory) {
      for (const m of card.text.matchAll(/\*\*(.*?)\*\*/g)) out.push({ text: m[1].replace(/…/g, '') });
      card.examples?.forEach((e) => out.push({ text: e.text.replace(/\*\*/g, '') }));
    }
    for (const ex of skill.exercises.map((e) => toRuntimeExercise(e))) {
      out.push({ text: exerciseSentence(ex) });
      ex.alternatives?.forEach((a) => out.push({ text: exerciseSentence(ex, a) }));
    }
  }
  return out;
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
  out.push(...skillSpeech());
  // La frase di prova dell'onboarding
  out.push({ text: ui.onboarding.audioSample });
  return out;
}
