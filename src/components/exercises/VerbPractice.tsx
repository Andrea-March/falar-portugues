'use client';

import React, { useMemo } from 'react';
import rawVerbData from '@/data/verbs.json';
import { generateExercisesFromVerbs, VerbEntry } from '@/utils/exerciseGenerator';
import { Exercise } from '@/types/exercise';
import PracticeSession from './PracticeSession';

interface VerbPracticeProps {
  exercises?: Exercise[];
  filterVerbId?: string;
  filterTense?: string;
  onFinish: (stats: { total: number; errors: number }) => void;
  onClose: () => void;
}

export default function VerbPractice({ exercises: directExercises, filterVerbId, filterTense, onFinish, onClose }: VerbPracticeProps) {
  const exercises = useMemo(() => {
    if (directExercises && directExercises.length > 0) return directExercises;
    return generateExercisesFromVerbs(rawVerbData as unknown as VerbEntry[], filterVerbId, filterTense);
  }, [directExercises, filterVerbId, filterTense]);

  return <PracticeSession exercises={exercises} onFinish={onFinish} onClose={onClose} />;
}
