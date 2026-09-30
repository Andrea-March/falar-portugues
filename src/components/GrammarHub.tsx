'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { searchGrammar, studiedVerbs, verbPractice, type GrammarMatch, type StudiedVerb } from '@/content/grammar';
import { exerciseSentence, PERSON_LABELS, tenseLabel, type Person } from '@/content';
import { reviewXp } from '@/content/rewards';
import { preloadSpeech } from '@/utils/textToSpeech';
import { soundFX } from '@/utils/sound';
import type { Exercise } from '@/types/exercise';
import Mascot from '@/components/common/Mascot';
import VerbStudy from './VerbStudy';
import ParadigmReview from './theory/ParadigmReview';
import PracticeSession, { type PracticeStats } from './exercises/PracticeSession';
import LessonCompleteCard from './common/LessonCompleteCard';
import SkillStudy, { SkillList } from './SkillStudy';
import { skillPractice, skillStatuses, getSkill } from '@/content/skills';
import { ui } from '@/content';

type View =
  | { kind: 'hub' }
  | { kind: 'verb'; verb: StudiedVerb; tense?: string; highlight?: VerbHighlight }
  | { kind: 'paradigm'; verb: StudiedVerb; tense: string }
  | { kind: 'practice'; verb: StudiedVerb; tense: string; exercises: Exercise[] }
  | { kind: 'done'; verb: StudiedVerb; tense: string; accuracy: number; bestCombo: number; xp: number }
  | { kind: 'skill'; skillId: string }
  | { kind: 'skill-practice'; skillId: string; exercises: Exercise[] }
  | { kind: 'skill-done'; skillId: string; accuracy: number; bestCombo: number; xp: number };

/** Le due sezioni della Grammatica */
type Section = 'verbs' | 'skills';

type VerbHighlight = { tense: string; persons: string[] };

/**
 * Gramática: il quaderno di ciò che si è studiato. Mostra solo i verbi già incontrati
 * nel percorso, con i tempi studiati lì; quelli che arriveranno restano nascosti
 * (tranne quelli in anteprima, da course.json). Si cerca per infinito o per forma coniugata.
 */
export default function GrammarHub() {
  const { progress, addXp } = useUser();
  const [verbs, setVerbs] = useState<StudiedVerb[] | null>(null);
  const [view, setView] = useState<View>({ kind: 'hub' });
  // Ricerca e filtro restano quando si torna alla lista da una scheda
  const [query, setQuery] = useState('');
  const [tenseFilter, setTenseFilter] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('verbs');
  const skillList = useMemo(() => skillStatuses(progress.review), [progress.review]);

  const allTenses = useMemo(() => [...new Set((verbs ?? []).flatMap((v) => v.tenses))], [verbs]);
  const shownVerbs = useMemo(() => (verbs ?? []).filter((v) => !tenseFilter || v.tenses.includes(tenseFilter)), [verbs, tenseFilter]);
  const matches = useMemo(() => (verbs && query.trim() ? searchGrammar(query, verbs, tenseFilter) : null), [verbs, query, tenseFilter]);

  useEffect(() => {
    let alive = true;
    studiedVerbs(progress.sessionProgress, progress.completedNodeIds).then((list) => alive && setVerbs(list));
    return () => {
      alive = false;
    };
  }, [progress.sessionProgress, progress.completedNodeIds]);

  const startPractice = async (verb: StudiedVerb, tense: string) => {
    const exercises = await verbPractice(verb.verbId, tense, progress.sessionProgress, progress.completedNodeIds, verb.previewTenses.includes(tense));
    preloadSpeech(exercises.map((e) => ({ text: exerciseSentence(e) })));
    setView({ kind: 'practice', verb, tense, exercises });
  };

  const openMatch = (m: GrammarMatch) =>
    setView({ kind: 'verb', verb: m.verb, tense: m.tense, highlight: m.persons.length ? { tense: m.tense, persons: m.persons } : undefined });

  // ---------- Punti difficili ----------
  if (view.kind === 'skill-practice') {
    const back = () => setView({ kind: 'skill', skillId: view.skillId });
    return (
      <PracticeSession
        exercises={view.exercises}
        onClose={back}
        onFinish={(stats: PracticeStats) => {
          const accuracy = Math.round(((stats.total - stats.errors) / stats.total) * 100);
          const xp = reviewXp(false, accuracy);
          addXp(xp);
          soundFX.playComplete();
          setView({ kind: 'skill-done', skillId: view.skillId, accuracy, bestCombo: stats.bestCombo, xp });
        }}
      />
    );
  }

  if (view.kind === 'skill-done') {
    return (
      <LessonCompleteCard
        title={getSkill(view.skillId)?.title ?? ui.skills.title}
        xpEarned={view.xp}
        streakDays={progress.streak}
        accuracy={view.accuracy}
        bestCombo={view.bestCombo}
        onContinue={() => setView({ kind: 'skill', skillId: view.skillId })}
      />
    );
  }

  if (view.kind === 'skill') {
    const status = skillList.find((s) => s.skill.id === view.skillId);
    if (status) {
      return (
        <SkillStudy
          status={status}
          onBack={() => setView({ kind: 'hub' })}
          onPractice={() => {
            const exercises = skillPractice(status.skill);
            preloadSpeech(exercises.map((e) => ({ text: exerciseSentence(e) })));
            setView({ kind: 'skill-practice', skillId: status.skill.id, exercises });
          }}
        />
      );
    }
  }

  if (view.kind === 'paradigm') {
    return <ParadigmReview verbId={view.verb.verbId} tense={view.tense} onClose={() => setView({ kind: 'verb', verb: view.verb, tense: view.tense })} />;
  }

  if (view.kind === 'practice') {
    const back = () => setView({ kind: 'verb', verb: view.verb, tense: view.tense });
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
          setView({ kind: 'done', verb: view.verb, tense: view.tense, accuracy, bestCombo: stats.bestCombo, xp });
        }}
      />
    );
  }

  if (view.kind === 'done') {
    return (
      <LessonCompleteCard
        title={ui.verbNodeTitle(view.verb.infinitive)}
        xpEarned={view.xp}
        streakDays={progress.streak}
        accuracy={view.accuracy}
        bestCombo={view.bestCombo}
        onContinue={() => setView({ kind: 'verb', verb: view.verb, tense: view.tense })}
      />
    );
  }

  if (view.kind === 'verb') {
    return (
      <VerbStudy
        key={`${view.verb.verbId}-${view.tense ?? ''}`}
        verb={view.verb}
        initialTense={view.tense}
        highlight={view.highlight}
        onBack={() => setView({ kind: 'hub' })}
        onStudy={(tense) => setView({ kind: 'paradigm', verb: view.verb, tense })}
        onPractice={(tense) => startPractice(view.verb, tense)}
      />
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <header>
        <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">{ui.grammar.title}</h2>
        <p className="font-semibold text-brand-muted">{ui.grammar.subtitle}</p>
      </header>

      {skillList.length > 0 && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-brand-background p-1" role="tablist" aria-label={ui.grammar.title}>
          {(['verbs', 'skills'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={section === s}
              onClick={() => {
                soundFX.playClick();
                setSection(s);
              }}
              className={`rounded-xl py-2 font-extrabold transition-colors ${
                section === s ? 'bg-white text-ink shadow-sm' : 'text-brand-muted hover:text-ink'
              }`}
            >
              {s === 'verbs' ? ui.grammar.verbs : ui.skills.title}
            </button>
          ))}
        </div>
      )}

      {section === 'skills' && skillList.length > 0 ? (
        <SkillList statuses={skillList} onOpen={(skill) => setView({ kind: 'skill', skillId: skill.id })} />
      ) : verbs === null ? (
        <div className="flex justify-center pt-10" aria-busy="true">
          <Mascot mood="think" size={80} />
        </div>
      ) : verbs.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 pt-8">
          <Mascot mood="idle" size={100} />
          <p className="text-lg font-bold text-brand-muted max-w-xs">
            {ui.grammar.empty}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <label className="relative block">
              <span className="sr-only">{ui.grammar.search}</span>
              <Search size={20} strokeWidth={2.6} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ui.grammar.searchPlaceholder}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                className="w-full rounded-2xl border-2 border-brand-border bg-white pl-12 pr-12 py-3 text-lg font-bold text-ink placeholder:text-brand-muted/70 placeholder:font-semibold focus:outline-none focus:border-azulejo [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label={ui.grammar.clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-brand-muted hover:text-ink hover:bg-brand-background"
                >
                  <X size={20} strokeWidth={2.8} />
                </button>
              )}
            </label>

            {allTenses.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label={ui.grammar.tense}>
                {[null, ...allTenses].map((t) => (
                  <button
                    key={t ?? 'all'}
                    type="button"
                    aria-pressed={t === tenseFilter}
                    onClick={() => {
                      soundFX.playClick();
                      setTenseFilter(t);
                    }}
                    className={`rounded-full px-3 py-1 font-extrabold border-2 ${
                      t === tenseFilter ? 'bg-azulejo text-white border-azulejo-dark' : 'bg-white text-brand-muted border-brand-border'
                    }`}
                  >
                    {t ? tenseLabel(t) : ui.grammar.allTenses}
                  </button>
                ))}
              </div>
            )}
          </div>

          {matches ? (
            <section aria-live="polite" className="space-y-3">
              {matches.length === 0 ? (
                <p className="text-center font-bold text-brand-muted pt-4">{ui.grammar.noResults(query.trim())}</p>
              ) : (
                matches.map((m) => <MatchButton key={`${m.verb.verbId}-${m.tense}-${m.form ?? ''}`} match={m} onOpen={openMatch} />)
              )}
            </section>
          ) : (
            <section aria-labelledby="grammar-verbs" className="space-y-3">
              <h3 id="grammar-verbs" className="text-xs font-extrabold uppercase tracking-[0.09em] text-azulejo">
                {ui.grammar.verbs}
              </h3>
              {shownVerbs.map((verb) => (
                <VerbButton
                  key={verb.verbId}
                  verb={verb}
                  tenses={tenseFilter ? [tenseFilter] : verb.tenses}
                  onOpen={() => setView({ kind: 'verb', verb, tense: tenseFilter ?? undefined })}
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

const rowButton = 'btn-3d w-full !justify-between bg-white border-2 border-brand-border !border-b-[5px] px-4 py-3.5 text-left';

function VerbButton({ verb, tenses, onOpen }: { verb: StudiedVerb; tenses: string[]; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        soundFX.playClick();
        onOpen();
      }}
      className={rowButton}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-11 h-11 rounded-2xl bg-azulejo-light flex items-center justify-center text-xl shrink-0" aria-hidden="true">
          📖
        </span>
        <span className="min-w-0">
          <span className="block font-display text-xl font-extrabold text-ink leading-tight">{verb.infinitive}</span>
          <span className="block text-sm font-semibold text-brand-muted truncate">
            {verb.translation} · {tenses.map((t) => tenseLabel(t).toLowerCase()).join(', ')}
          </span>
        </span>
      </span>
      <ChevronRight size={22} strokeWidth={2.8} className="text-brand-muted shrink-0" />
    </button>
  );
}

/** Un risultato: la forma trovata in grande, sotto a quale verbo, tempo e persona appartiene */
function MatchButton({ match, onOpen }: { match: GrammarMatch; onOpen: (m: GrammarMatch) => void }) {
  const persons = match.persons.map((p) => PERSON_LABELS[p as Person]).join(', ');
  return (
    <button
      type="button"
      onClick={() => {
        soundFX.playClick();
        onOpen(match);
      }}
      className={rowButton}
    >
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold text-ink leading-tight">{match.form ?? match.verb.infinitive}</span>
        <span className="block text-sm font-semibold text-brand-muted truncate">
          {match.form ? `${match.verb.infinitive} · ${tenseLabel(match.tense).toLowerCase()} · ${persons}` : match.verb.translation}
        </span>
      </span>
      <ChevronRight size={22} strokeWidth={2.8} className="text-brand-muted shrink-0" />
    </button>
  );
}
