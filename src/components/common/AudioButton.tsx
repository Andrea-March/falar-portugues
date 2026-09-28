'use client';

import React from 'react';
import { speakTarget } from '@/utils/textToSpeech';
import { ui } from '@/content';

interface AudioButtonProps {
  textToSpeak: string;
  className?: string;
}

export default function AudioButton({ textToSpeak, className = '' }: AudioButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speakTarget(textToSpeak);
      }}
      title={ui.audio.pronunciation}
      className={`p-2 bg-orange-100 hover:bg-orange-200 text-stone-700 rounded-full transition-all active:scale-90 flex items-center justify-center shrink-0 shadow-sm ${className}`}
    >
      🔊
    </button>
  );
}