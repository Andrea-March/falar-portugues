'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ChapterMap from '@/components/ChapterMap';
import { chapters, nextNodeId, isOptionalNode, sessionsFor, sameSession, type CourseNode, type Session } from '@/content';
import Onboarding from '@/components/Onboarding';
import { dayKey } from '@/content/rewards';
import { useUser } from '@/context/UserContext';
import Mascot from '@/components/common/Mascot';
import GrammarHub from '@/components/GrammarHub';
import LessonScreen from '@/components/LessonScreen';
import ReviewScreen from '@/components/ReviewScreen';
import { dueRefs } from '@/content/review';
import { RotateCcw } from 'lucide-react';

export default function Home() {
  const { progress, completeSession, completeOnboarding, isLoaded } = useUser();
  const [active, setActive] = useState<{ node: CourseNode; session: Session } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'grammar' | 'vocab' | 'chat'>('home');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true">
        <Mascot mood="idle" size={96} />
      </div>
    );
  }

  // Primo avvio: onboarding, poi dritti nella prima sessione della prima lezione
  if (!progress.onboarded) {
    return (
      <Onboarding
        onDone={(choices) => {
          completeOnboarding(choices);
          const first = chapters[0].nodes[0];
          setActive({ node: first, session: sessionsFor(first)[0] });
        }}
      />
    );
  }

  if (reviewing) return <ReviewScreen onClose={() => setReviewing(false)} />;

  // Lezione aperta: occupa tutto lo schermo, niente header né barra in basso
  if (active) {
    const { node, session } = active;
    return (
      <LessonScreen
        nodeId={node.id}
        session={session}
        onClose={() => setActive(null)}
        onCompleteSession={() => {
          // Gli XP sono già stati assegnati a fine sessione (LessonScreen)
          const list = sessionsFor(node);
          // Un nodo facoltativo (cultura) non sposta il punto in cui si trova l'utente nel percorso
          completeSession(node.id, list.findIndex((s) => sameSession(s, session)), list.length, isOptionalNode(node) ? undefined : nextNodeId(node.id));
          setActive(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen pb-28">
      <Header
        streak={progress.streak}
        xp={progress.xp}
        today={progress.xpDay === dayKey() ? progress.xpToday : 0}
        goal={progress.dailyGoal}
      />

      <main className="max-w-md mx-auto px-4 pt-3">
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <ChapterMap
              aboveCurrentChapter={<ReviewButton review={progress.review} onStart={() => setReviewing(true)} />}
              completedNodeIds={progress.completedNodeIds}
              sessionProgress={progress.sessionProgress}
              currentNodeId={progress.currentNodeId}
              onSelectSession={(node, session) => setActive({ node, session })}
            />
          </div>
        )}

        {activeTab === 'grammar' && (
          <div className="animate-fade-in">
            <GrammarHub />
          </div>
        )}

        {activeTab === 'vocab' && (
          <ComingSoon title="Vídeos" text="Pequenos clipes do dia a dia em Lisboa, em breve." onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'chat' && (
          <ComingSoon title="Conversa" text="Pratica diálogos reais comigo, em breve." onBack={() => setActiveTab('home')} />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

function ComingSoon({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 gap-3 animate-fade-in">
      <Mascot mood="think" size={120} />
      <h2 className="text-3xl font-extrabold text-ink mt-2">{title}</h2>
      <p className="text-lg text-brand-muted font-semibold max-w-xs">{text}</p>
      <button type="button" onClick={onBack} className="btn-3d btn-ghost px-6 py-3 mt-3">
        Voltar ao percurso
      </button>
    </div>
  );
}

/** Pulsante del ripasso sopra la mappa: compare dopo le prime risposte */
function ReviewButton({ review, onStart }: { review: Record<string, unknown>; onStart: () => void }) {
  const learned = Object.keys(review).length;
  if (learned === 0) return null;
  const due = dueRefs(review as Parameters<typeof dueRefs>[0]).length;
  return (
    <button
      type="button"
      onClick={onStart}
      className={`w-full flex items-center shadow-md gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left transition-transform active:translate-y-[2px] ${
        due > 0 ? 'bg-azulejo border-azulejo-dark text-white' : 'bg-white border-brand-border text-ink'
      }`}
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${due > 0 ? 'bg-white/20' : 'bg-azulejo-light text-azulejo-dark'}`}>
        <RotateCcw size={22} strokeWidth={2.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold leading-tight">Revisão</span>
        <span className="block text-sm font-semibold opacity-85 leading-snug">
          {due > 0 ? `${due} ${due === 1 ? 'cosa da rinfrescare' : 'cose da rinfrescare'}` : 'Tutto ripassato: puoi allenarti comunque'}
        </span>
      </span>
    </button>
  );
}
