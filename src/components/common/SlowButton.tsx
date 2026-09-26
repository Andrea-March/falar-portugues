'use client';

import { Turtle } from 'lucide-react';
import { speakPortuguese, type VoiceKey } from '@/utils/textToSpeech';

/** 🐢 Riascolta più lentamente */
export default function SlowButton({ text, voice, size = 'md', className = '' }: { text: string; voice?: VoiceKey; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = size === 'lg' ? 'w-14 h-14' : size === 'md' ? 'w-11 h-11' : 'w-8 h-8';
  const icon = size === 'lg' ? 26 : size === 'md' ? 20 : 16;
  return (
    <button
      type="button"
      onClick={() => speakPortuguese(text, undefined, { voice, slow: true })}
      aria-label="Ouvir devagar"
      title="Ouvir devagar"
      className={`btn-3d ${dim} flex items-center justify-center bg-white border-brand-border text-azulejo-dark !border-b-4 shrink-0 ${className}`}
    >
      <Turtle size={icon} strokeWidth={2.4} aria-hidden="true" />
    </button>
  );
}
