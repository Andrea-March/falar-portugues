'use client';

import React from 'react';

export type MascotMood = 'idle' | 'happy' | 'sad' | 'cheer' | 'think';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  /** Testo del fumetto accanto alla mascotte */
  say?: string;
  /** Lato del fumetto rispetto al galletto */
  bubbleSide?: 'right' | 'left';
  animate?: boolean;
  className?: string;
}

const INK = '#18213f';
const RED = '#e5392b';
const YELLOW = '#ffc21a';
const BLUE = '#1d5bd8';

/**
 * "Galo" — il galletto di Barcelos che accompagna l'utente.
 * SVG puro, nessuna immagine esterna: leggero e animabile.
 */
export default function Mascot({
  mood = 'idle',
  size = 96,
  say,
  bubbleSide = 'right',
  animate = true,
  className = '',
}: MascotProps) {
  const happyEyes = mood === 'happy' || mood === 'cheer';
  const motion = !animate ? '' : mood === 'cheer' ? 'animate-hop' : mood === 'sad' ? '' : 'animate-bob';

  const bird = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Galo, a mascote"
      className={`shrink-0 overflow-visible ${motion}`}
    >
      {/* coda */}
      <path d="M86 62 C104 44 112 52 110 66 C116 70 112 82 100 82 Z" fill={INK} />
      <path d="M100 52 C106 50 110 55 108 60" stroke={RED} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M104 68 C110 68 111 74 106 77" stroke={YELLOW} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* zampe */}
      <g stroke={YELLOW} strokeWidth="4" strokeLinecap="round">
        <path d="M50 98 V110 M44 112 H56" />
        <path d="M66 98 V110 M60 112 H72" />
      </g>

      {/* cresta */}
      <g fill={RED}>
        <circle cx="47" cy="37" r="8" />
        <circle cx="58" cy="31" r="9" />
        <circle cx="69" cy="37" r="8" />
      </g>

      {/* corpo */}
      <ellipse cx="58" cy="70" rx="35" ry="33" fill={INK} />

      {/* decorazioni dipinte (cuore + fiorellini, come la ceramica di Barcelos) */}
      <path d="M58 92 C50 86 48 80 53 78 C56 77 58 80 58 80 C58 80 60 77 63 78 C68 80 66 86 58 92 Z" fill={RED} />
      <circle cx="44" cy="86" r="3" fill={YELLOW} />
      <circle cx="72" cy="86" r="3" fill={BLUE} stroke="#fff" strokeWidth="1" />

      {/* ali */}
      {mood === 'cheer' ? (
        <>
          <path d="M26 66 C12 54 10 42 18 40 C22 50 28 56 32 60 Z" fill={INK} />
          <path d="M90 66 C104 54 106 42 98 40 C94 50 88 56 84 60 Z" fill={INK} />
        </>
      ) : (
        <>
          <ellipse cx="25" cy="74" rx="7" ry="13" fill={INK} transform="rotate(12 25 74)" />
          <ellipse cx="91" cy="74" rx="7" ry="13" fill={INK} transform="rotate(-12 91 74)" />
        </>
      )}

      {/* occhi */}
      {happyEyes ? (
        <g stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M40 58 Q46 50 52 58" />
          <path d="M64 58 Q70 50 76 58" />
        </g>
      ) : (
        <>
          <circle cx="46" cy="56" r="9" fill="#fff" />
          <circle cx="70" cy="56" r="9" fill="#fff" />
          <circle
            cx={mood === 'think' ? 49 : 47}
            cy={mood === 'think' ? 52 : mood === 'sad' ? 59 : 57}
            r="4.5"
            fill={INK}
          />
          <circle
            cx={mood === 'think' ? 73 : 71}
            cy={mood === 'think' ? 52 : mood === 'sad' ? 59 : 57}
            r="4.5"
            fill={INK}
          />
          {mood === 'sad' && (
            <g stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M37 44 L50 48" />
              <path d="M79 44 L66 48" />
            </g>
          )}
        </>
      )}

      {/* guance */}
      {happyEyes && (
        <g fill={RED} opacity="0.55">
          <ellipse cx="36" cy="66" rx="5" ry="3" />
          <ellipse cx="80" cy="66" rx="5" ry="3" />
        </g>
      )}

      {/* becco */}
      {mood === 'cheer' ? (
        <>
          <path d="M52 63 L64 63 L58 69 Z" fill={YELLOW} />
          <path d="M53 70 L63 70 L58 76 Z" fill={YELLOW} />
        </>
      ) : (
        <path d="M51 63 L65 63 L58 73 Z" fill={YELLOW} />
      )}
      {/* bargiglio */}
      <path d="M58 73 C54 78 55 83 58 83 C61 83 62 78 58 73 Z" fill={RED} />
    </svg>
  );

  if (!say) return <div className={className}>{bird}</div>;

  return (
    <div className={`flex items-center gap-3 ${bubbleSide === 'left' ? 'flex-row-reverse' : ''} ${className}`}>
      {bird}
      <div
        className={`relative bg-white border-2 border-brand-border rounded-2xl px-4 py-2.5 text-[15px] font-bold text-ink leading-snug animate-pop
          before:absolute before:top-1/2 before:-translate-y-1/2 before:w-3 before:h-3 before:bg-white before:border-brand-border before:rotate-45
          ${bubbleSide === 'right'
            ? 'before:-left-[7px] before:border-l-2 before:border-b-2'
            : 'before:-right-[7px] before:border-r-2 before:border-t-2'}`}
      >
        {say}
      </div>
    </div>
  );
}
