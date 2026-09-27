'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { studiedVerbs, verbPractice, type StudiedVerb } from '@/content/grammar';
import { exerciseSentence, tenseLabel } from '@/content';
import { reviewXp } from '@/content/rewards';
import { preloadSpeech } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';
import type { Exercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import VerbStudy from './VerbStudy';
import ParadigmReview from './theory/ParadigmReview';
import PracticeSession, { type PracticeStats } from './exercises/PracticeSession';
import LessonCompleteCard from './common/LessonCompleteCard';

type View =
  | { kind: 'hub' }
  | { kind: 'verb'; verb: StudiedVerb }
  | { kind: 'paradigm'; verb: StudiedVerb; tense: string }
  | { kind: 'practice'; verb: StudiedVerb; exercises: Exercise[] }
  | { kind: 'done'; verb: StudiedVerb; accuracy: number; bestCombo: number; xp: number };

/**
 * Gramática: il quaderno di ciò che si è studiato. Mostra solo i verbi già incontrati
 * nel percorso, con i tempi studiati lì; quelli che arriveranno restano nascosti.
 */
export default function GrammarHub() {
  const { progress, addXp } = useUser();
  const [verbs, setVerbs] = useState<StudiedVerb[] | null>(null);
  const [view, setView] = useState<View>({ kind: 'hub' });

  useEffect(() => {
    let alive = true;
    studiedVerbs(progress.sessionProgress, progress.completedNodeIds).then((list) => alive && setVerbs(list));
    return () => {
      alive = false;
    };
  }, [progress.sessionProgress, progress.completedNodeIds]);

  const startPractice = async (verb: StudiedVerb, tense: string) => {
    const exercises = await verbPractice(verb.verbId, tense, progress.sessionProgress, progress.completedNodeIds);
    preloadSpeech(exercises.map((e) => ({ text: exerciseSentence(e) })));
    setView({ kind: 'practice', verb, exercises });
  };

  if (view.kind === 'paradigm') {
    return <ParadigmReview verbId={view.verb.verbId} tense={view.tense} onClose={() => setView({ kind: 'verb', verb: view.verb })} />;
  }

  if (view.kind === 'practice') {
    const back = () => setView({ kind: 'verb', verb: view.verb });
    return (
      <PracticeSession
        exercises={view.exercises}
        onClose={back}
        onFinish={(stats: PracticeStats) => {
          // Allenamento libero: vale come un ripasso senza scadenze
          const accuracy = Math.round(((stats.total - stats.errors) / stats.total) * 100);
          const xp = reviewXp(false, accuracy);
          addXp(xp);
          soundFX.playComplete();
          setView({ kind: 'done', verb: view.verb, accuracy, bestCombo: stats.bestCombo, xp });
        }}
      />
    );
  }

  if (view.kind === 'done') {
    return (
      <LessonCompleteCard
        title={`Verbo ${view.verb.infinitive}`}
        xpEarned={view.xp}
        streakDays={progress.streak}
        accuracy={view.accuracy}
        bestCombo={view.bestCombo}
        onContinue={() => setView({ kind: 'verb', verb: view.verb })}
      />
    );
  }

  if (view.kind === 'verb') {
    return (
      <VerbStudy
        verb={view.verb}
        onBack={() => setView({ kind: 'hub' })}
        onStudy={(tense) => setView({ kind: 'paradigm', verb: view.verb, tense })}
        onPractice={(tense) => startPractice(view.verb, tense)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">Gramática</h2>
        <p className="font-semibold text-brand-muted">Il quaderno di quello che hai studiato nel percorso.</p>
      </header>

      {verbs === null ? (
        <div className="flex justify-center pt-10" aria-busy="true">
          <Mascot mood="think" size={80} />
        </div>
      ) : verbs.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 pt-8">
          <Mascot mood="idle" size={100} />
          <p className="text-lg font-bold text-brand-muted max-w-xs">
            Qui troverai i verbi man mano che li studi. Il primo arriva presto nel percorso!
          </p>
        </div>
      ) : (
        <section aria-labelledby="grammar-verbs" className="space-y-3">
          <h3 id="grammar-verbs" className="text-xs font-extrabold uppercase tracking-[0.09em] text-azulejo">
            Verbos
          </h3>
          {verbs.map((verb) => (
            <button
              key={verb.verbId}
              type="button"
              onClick={() => {
                soundFX.playClick();
                setView({ kind: 'verb', verb });
              }}
              className="btn-3d w-full !justify-between bg-white border-2 border-brand-border !border-b-[5px] px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-2xl bg-azulejo-light flex items-center justify-center text-xl shrink-0" aria-hidden="true">
                  📖
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-xl font-extrabold text-ink leading-tight">{verb.infinitive}</span>
                  <span className="block text-sm font-semibold text-brand-muted truncate">
                    {verb.it} · {verb.tenses.map((t) => tenseLabel(t).toLowerCase()).join(', ')}
                  </span>
                </span>
              </span>
              <ChevronRight size={22} strokeWidth={2.8} className="text-brand-muted shrink-0" />
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
