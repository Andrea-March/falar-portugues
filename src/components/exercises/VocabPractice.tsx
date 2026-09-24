'use client';

import React from 'react';
import { Exercise } from '@/types/exercise';
import PracticeSession, { type PracticeStats } from './PracticeSession';

interface VocabPracticeProps {
  exercises?: Exercise[];
  onFinish: (stats: PracticeStats) => void;
  onClose: () => void;
}

export default function VocabPractice({ exercises = [], onFinish, onClose }: VocabPracticeProps) {
  return <PracticeSession exercises={exercises} onFinish={onFinish} onClose={onClose} />;
}
