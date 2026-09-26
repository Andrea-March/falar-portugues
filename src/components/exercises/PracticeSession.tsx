'use client';

import React, { useEffect, useRef, useState } from 'react';
import { soundFX } from '@/utils/sound';
import { speakPortuguese, stopSpeaking } from '@/utils/textToSpeech';
import { matchAnswerAny } from '@/utils/answerCheck';
import { useUser } from '@/context/UserContext';
import { Exercise } from '@/types/exercise';
import LessonShell from '@/components/common/LessonShell';
import Mascot from '@/components/common/Mascot';
import ExerciseRenderer from './ExerciseRenderer';
import FeedbackSheet from './FeedbackSheet';

/**
 * idle     → l'utente sta rispondendo
 * correct  → giusta
 * wrong    → sbagliata (conta come errore), si può riprovare o vedere la soluzione
 * revealed → soluzione mostrata ("Não sei" o "Ver a solução"), conta come errore e si prosegue
 */
export type Feedback = 'idle' | 'correct' | 'wrong' | 'revealed';

export interface PracticeStats {
  total: number;
  errors: number;
  /** Serie più lunga di risposte giuste al primo tentativo */
  bestCombo: number;
}

interface PracticeSessionProps {
  exercises: Exercise[];
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}

/** Pausa prima della lettura, per non sovrapporre voce e suono di successo */
const SPEAK_DELAY_MS = 550;

export default function PracticeSession({ exercises, onFinish, onClose }: PracticeSessionProps) {
  const { recordAnswer } = useUser();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [accentHint, setAccentHint] = useState(false);
  /** Risposta riconosciuta (può essere un'alternativa, es. "Obrigada") */
  const [matched, setMatched] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [failedCurrent, setFailedCurrent] = useState(false);
  // Serie di risposte giuste al primo tentativo: un errore o "Não sei" la azzera
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const speakTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (speakTimer.current) clearTimeout(speakTimer.current);
      stopSpeaking();
    },
    []
  );

  const exercise = exercises[index];

  if (!exercise) {
    return (
      <LessonShell progress={100} onClose={onClose}>
        <div className="flex flex-col items-center text-center gap-4 pt-16">
          <Mascot mood="think" size={120} />
          <h2 className="text-2xl font-extrabold">Ainda não há exercícios aqui</h2>
          <p className="text-brand-muted font-semibold">Esta lição está a ser preparada.</p>
          <button type="button" onClick={() => onFinish({ total: 0, errors: 0, bestCombo: 0 })} className="btn-3d btn-primary px-8 py-3.5 text-lg mt-2">
            Concluir
          </button>
        </div>
      </LessonShell>
    );
  }

  const isChoice = exercise.type === 'multiple_choice';
  const sentenceWith = (answerText: string) =>
    isChoice ? exercise.sentence.replace(/_{3,}/, answerText) : `${exercise.sentenceBefore}${answerText}${exercise.sentenceAfter}`;
  const fullSentence = sentenceWith(matched ?? exercise.correctAnswer);

  const countError = () => {
    if (!failedCurrent) {
      recordAnswer(exercise.trains, false);
      setErrorCount((n) => n + 1);
      setFailedCurrent(true);
    }
  };

  const speakLater = (text = fullSentence) => {
    if (speakTimer.current) clearTimeout(speakTimer.current);
    speakTimer.current = setTimeout(() => speakPortuguese(text), SPEAK_DELAY_MS);
  };

  const markCorrect = (match: string) => {
    if (!failedCurrent) recordAnswer(exercise.trains, true);
    const newCombo = failedCurrent ? 0 : combo + 1;
    setCombo(newCombo);
    setBestCombo((b) => Math.max(b, newCombo));
    setAccentHint(false);
    setFeedback('correct');
    soundFX.playSuccess(newCombo);
    speakLater(sentenceWith(match));
  };

  const markWrong = () => {
    setFeedback('wrong');
    soundFX.playError();
    setCombo(0);
    countError();
  };

  const reveal = () => {
    setCombo(0);
    countError();
    setAccentHint(false);
    setAnswer(exercise.correctAnswer);
    setFeedback('revealed');
    speakLater();
  };

  /** Valuta una risposta; `explicit` = l'utente ha premuto Verificar/Invio */
  const evaluate = (value: string, explicit: boolean) => {
    const { result, match } = matchAnswerAny(value, [exercise.correctAnswer, ...(exercise.alternatives ?? [])]);
    if (result === 'exact') {
      setMatched(match);
      return markCorrect(match);
    }
    if (!explicit) return;
    if (result === 'accents') {
      setAccentHint(true);
      soundFX.playClick();
    } else {
      markWrong();
    }
  };

  const handleChange = (value: string) => {
    if (feedback !== 'idle') return;
    setAnswer(value);
    if (isChoice) {
      // Scelta multipla: il primo tocco è la risposta
      evaluate(value, true);
    } else {
      // Scrittura: accettata appena è giusta, senza bisogno di confermare
      setAccentHint(false);
      evaluate(value, false);
    }
  };

  const next = () => {
    soundFX.playClick();
    if (speakTimer.current) clearTimeout(speakTimer.current);
    stopSpeaking();
    if (index + 1 < exercises.length) {
      setIndex((i) => i + 1);
      setAnswer('');
      setFeedback('idle');
      setAccentHint(false);
      setMatched(null);
      setFailedCurrent(false);
    } else {
      onFinish({ total: exercises.length, errors: errorCount, bestCombo });
    }
  };

  const retry = () => {
    soundFX.playClick();
    // Nella scrittura si tiene quello che si è scritto, così si corregge senza ricominciare
    if (isChoice) setAnswer('');
    setFeedback('idle');
  };

  const done = index + (feedback === 'correct' || feedback === 'revealed' ? 1 : 0);

  return (
    <LessonShell
      progress={(done / exercises.length) * 100}
      onClose={onClose}
      footer={
        <FeedbackSheet
          key={`${exercise.id}-${feedback}`}
          mode={isChoice ? 'choice' : 'typing'}
          feedback={feedback}
          combo={combo}
          canCheck={answer.trim().length > 0}
          correctAnswer={exercise.correctAnswer}
          sentence={fullSentence}
          italianNote={exercise.italianNote}
          onCheck={() => evaluate(answer, true)}
          onDontKnow={reveal}
          onReveal={reveal}
          onContinue={next}
          onRetry={retry}
        />
      }
    >
      <ExerciseRenderer
        key={exercise.id}
        exercise={exercise}
        value={answer}
        feedback={feedback}
        accentHint={accentHint}
        onChange={handleChange}
        onSubmit={() => evaluate(answer, true)}
      />
    </LessonShell>
  );
}
