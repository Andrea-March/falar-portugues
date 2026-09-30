'use client';

import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import type { SkillStatus, Skill } from '@/content/skills';
import { skillTheory } from '@/content/skills';
import InfoCard from '@/components/theory/InfoCard';
import { soundFX } from '@/utils/sound';
import { ui } from '@/content';

/** Riga di stato di una skill: quanti errori, mai allenata, oppure a posto */
function statusText(s: SkillStatus) {
  if (s.errors > 0) return ui.skills.errors(s.errors);
  return s.box === undefined ? ui.skills.fresh : ui.skills.noErrors;
}

/** Lista dei punti difficili: in cima quelli dove sbagli di più */
export function SkillList({ statuses, onOpen }: { statuses: SkillStatus[]; onOpen: (skill: Skill) => void }) {
  return (
    <section aria-label={ui.skills.title} className="space-y-3">
      <p className="font-semibold text-brand-muted leading-snug">{ui.skills.intro}</p>
      {statuses.map((s) => (
        <button
          key={s.skill.id}
          type="button"
          onClick={() => {
            soundFX.playClick();
            onOpen(s.skill);
          }}
          className="btn-3d w-full !justify-between bg-white border-2 border-brand-border !border-b-[5px] px-4 py-3.5 text-left"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="w-11 h-11 rounded-2xl bg-azulejo-light flex items-center justify-center text-xl shrink-0" aria-hidden="true">
              {s.skill.icon}
            </span>
            <span className="min-w-0">
              <span className="block font-display text-xl font-extrabold text-ink leading-tight">{s.skill.title}</span>
              <span className="block text-sm font-semibold text-brand-muted">{s.skill.subtitle}</span>
              <span className={`block text-sm font-extrabold mt-0.5 ${s.errors > 0 ? 'text-ko-dark' : 'text-brand-muted/80'}`}>
                {statusText(s)}
                {s.due && <span className="ml-2 rounded-full bg-azulejo text-white px-2 py-px text-xs align-middle">{ui.skills.due}</span>}
              </span>
            </span>
          </span>
          <ChevronRight size={22} strokeWidth={2.8} className="text-brand-muted shrink-0" />
        </button>
      ))}
    </section>
  );
}

/** Scheda di un punto difficile: la spiegazione e l'allenamento */
export default function SkillStudy({ status, onBack, onPractice }: { status: SkillStatus; onBack: () => void; onPractice: () => void }) {
  const { skill } = status;
  const practice = (
    <button
      type="button"
      onClick={() => {
        soundFX.playClick();
        onPractice();
      }}
      className="btn-3d w-full py-3.5 text-lg bg-brand-primary border-brand-dark text-white"
    >
      {ui.skills.practice(skill.exercises.length)}
    </button>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <button
        type="button"
        onClick={() => {
          soundFX.playClick();
          onBack();
        }}
        className="flex items-center gap-1.5 font-extrabold text-brand-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={20} strokeWidth={2.8} />
        {ui.skills.title}
      </button>

      <header className="flex items-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-azulejo-light flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
          {skill.icon}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl font-extrabold text-ink leading-tight">{skill.title}</h2>
          <p className={`font-extrabold ${status.errors > 0 ? 'text-ko-dark' : 'text-brand-muted'}`}>{statusText(status)}</p>
        </div>
      </header>

      {practice}

      {skillTheory(skill).map((card) => (
        <div key={card.title} className="rounded-3xl border-2 border-b-[6px] border-brand-border bg-white p-5">
          <InfoCard card={card} />
        </div>
      ))}

      {practice}
    </div>
  );
}
