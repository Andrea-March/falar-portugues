'use client';

import React, { useMemo } from 'react';
import { verbExercises } from '@/content';
import PracticeSession, { type PracticeStats } from './PracticeSession';

interface VerbPracticeProps {
  verbId: string;
  tense?: string;
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}

/** Pratica di un singolo verbo (sezione Gramática) */
export default function VerbPractice({ verbId, tense, onFinish, onClose }: VerbPracticeProps) {
  const exercises = useMemo(() => verbExercises(verbId, tense), [verbId, tense]);
  return <PracticeSession exercises={exercises} onFinish={onFinish} onClose={onClose} />;
}
