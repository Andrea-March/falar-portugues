'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { setAudioEnabled, useAudioEnabled } from '@/utils/audioSettings';

export default function AudioToggle({ className = '' }: { className?: string }) {
  const enabled = useAudioEnabled();
  return (
    <button
      type="button"
      onClick={() => setAudioEnabled(!enabled)}
      aria-pressed={!enabled}
      aria-label={enabled ? 'Desligar o som' : 'Ligar o som'}
      title={enabled ? 'Desligar o som' : 'Ligar o som'}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        enabled ? 'text-brand-muted hover:text-ink' : 'text-brand-primary bg-brand-light'
      } ${className}`}
    >
      {enabled ? <Volume2 size={24} strokeWidth={2.4} /> : <VolumeX size={24} strokeWidth={2.4} />}
    </button>
  );
}
