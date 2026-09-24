'use client';

import React from 'react';
import { Exercise } from '@/types/exercise';
import PracticeSession from './PracticeSession';

interface VocabPracticeProps {
  exercises?: Exercise[];
  onFinish: (stats: { total: number; errors: number }) => void;
  onClose: () => void;
}

export default function VocabPractice({ exercises = [], onFinish, onClose }: VocabPracticeProps) {
  return <PracticeSession exercises={exercises} onFinish={onFinish} onClose={onClose} />;
}
