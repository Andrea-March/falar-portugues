import { APP_VERSION, CONTACT_EMAIL } from '@/config';
import { courseConfig, ui } from '@/content';

/**
 * Feedback via email: la riserva dei moduli (components/feedback) quando l'invio non riesce.
 * Sotto il testo libero aggiungiamo i dati tecnici che servono a capire di cosa si parla.
 */
function mailto(subject: string, details: string[]) {
  const body = [
    '',
    '',
    '',
    '———',
    ui.feedback.mailKeepLines,
    ...details,
    `Versione: ${APP_VERSION}`,
    typeof navigator !== 'undefined' ? `Dispositivo: ${navigator.userAgent}` : '',
  ]
    .filter((l) => l !== undefined)
    .join('\n');
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Feedback generale (menu in alto) */
export function generalFeedbackUrl() {
  return mailto(`${courseConfig.appName} · feedback`, []);
}

export interface ExerciseReport {
  exerciseId: string;
  sentence: string;
  correctAnswer: string;
  /** Quello che ha scritto o scelto l'utente, se c'è */
  answer?: string;
}

/** Segnalazione di un esercizio, con tutto il contesto già compilato */
export function exerciseReportUrl({ exerciseId, sentence, correctAnswer, answer }: ExerciseReport) {
  return mailto(`${courseConfig.appName} · problema nell'esercizio ${exerciseId}`, [
    `Esercizio: ${exerciseId}`,
    `Frase: ${sentence}`,
    `Risposta attesa: ${correctAnswer}`,
    `Risposta data: ${answer?.trim() ? answer : '(nessuna)'}`,
  ]);
}
