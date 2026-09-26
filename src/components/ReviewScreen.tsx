'use client';

import React, { useEffect, useState } from 'react';
import PracticeSession, { type PracticeStats } from '@/components/exercises/PracticeSession';
import LessonCompleteCard from '@/components/common/LessonCompleteCard';
import Mascot from '@/components/common/Mascot';
import { useUser } from '@/context/UserContext';
import { reviewExercises } from '@/content/review';
import { preloadSpeech } from '@/utils/textToSpeech';
import { exerciseSentence } from '@/content';
import type { Exercise } from '@/types/exercise';
import { dueRefs } from '@/content/review';
import { reviewXp } from '@/content/rewards';

/** Sessione di ripasso: esercizi sulle cose sbagliate di recente o da rinfrescare */
export default function ReviewScreen({ onClose }: { onClose: () => void }) {
  const { progress, addXp, markSeen } = useUser();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [result, setResult] = useState<{ accuracy: number; bestCombo: number; xp: number } | null>(null);
  // C'era qualcosa in scadenza all'apertura? Decide quanti XP vale il ripasso
  const [hadDue] = useState(() => dueRefs(progress.review).length > 0);

  // Gli esercizi si scelgono una volta sola, all'apertura
  useEffect(() => {
    let alive = true;
    reviewExercises(progress.review, progress.sessionProgress).then((list) => {
      if (!alive) return;
      preloadSpeech(list.map((e) => ({ text: exerciseSentence(e) })));
      setExercises(list);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!exercises) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <Mascot mood="think" size={96} />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot mood="happy" size={96} />
        <p className="font-extrabold text-lg">Ancora niente da ripassare: completa prima qualche sessione.</p>
        <button type="button" onClick={onClose} className="btn-3d px-6 py-3 bg-brand-primary border-brand-dark text-white">
          Voltar
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <LessonCompleteCard
        title="Revisão concluída"
        xpEarned={result.xp}
        streakDays={progress.streak}
        accuracy={result.accuracy}
        bestCombo={result.bestCombo}
        note="Le espressioni sbagliate torneranno presto, quelle giuste più avanti."
        onContinue={onClose}
      />
    );
  }

  return (
    <PracticeSession
      exercises={exercises}
      onClose={onClose}
      onFinish={(stats: PracticeStats) => {
        const accuracy = Math.round(((stats.total - stats.errors) / stats.total) * 100);
        const xp = reviewXp(hadDue, accuracy);
        addXp(xp);
        markSeen(exercises.map((e) => e.id));
        setResult({ accuracy, bestCombo: stats.bestCombo, xp });
      }}
    />
  );
}
