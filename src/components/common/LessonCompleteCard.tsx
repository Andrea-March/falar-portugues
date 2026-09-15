'use client';

import React from 'react';
import { soundFX } from '@/utils/sound';

interface LessonCompleteCardProps {
  title: string;
  xpEarned?: number;
  accuracy?: number; // Es. 100 per 100%
  streakDays?: number; // Facoltativo, se gestisci la serie di giorni
  onContinue: () => void;
}

export default function LessonCompleteCard({
  title,
  xpEarned = 15,
  accuracy = 100,
  streakDays,
  onContinue,
}: LessonCompleteCardProps) {
  const handleContinue = () => {
    soundFX.playClick();
    onContinue();
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-8 border-2 border-stone-200 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
      {/* Icona Trionfale con Bagliore */}
      <div className="relative inline-block">
        <div className="w-24 h-24 bg-emerald-100 border-4 border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner">
          🏆
        </div>
        <span className="absolute -bottom-1 -right-1 text-2xl animate-bounce">
          ✨
        </span>
      </div>

      {/* Titoli e Feedback */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-black text-stone-900 tracking-tight">
          Excelente trabalho!
        </h2>
        <p className="text-xs font-bold text-stone-500 max-w-xs mx-auto">
          Completaste com sucesso <span className="text-stone-800">{title}</span>.
        </p>
      </div>

      {/* Griglia Statistiche */}
      <div className={`grid gap-3 ${streakDays ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <div className="bg-amber-50 border-2 border-amber-200/80 rounded-2xl p-3.5 flex flex-col justify-center">
          <span className="text-2xl font-black text-amber-600">+{xpEarned}</span>
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider mt-0.5">
            Pontos XP
          </p>
        </div>

        <div className="bg-emerald-50 border-2 border-emerald-200/80 rounded-2xl p-3.5 flex flex-col justify-center">
          <span className="text-2xl font-black text-emerald-600">{accuracy}%</span>
          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mt-0.5">
            Precisão
          </p>
        </div>

        {streakDays !== undefined && (
          <div className="bg-orange-50 border-2 border-orange-200/80 rounded-2xl p-3.5 flex flex-col justify-center">
            <span className="text-2xl font-black text-orange-600">🔥 {streakDays}</span>
            <p className="text-[10px] font-black text-orange-800 uppercase tracking-wider mt-0.5">
              Dias
            </p>
          </div>
        )}
      </div>

      {/* Bottone 3D Tattile */}
      <button
        type="button"
        onClick={handleContinue}
        className="w-full bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 text-white font-black py-4 rounded-2xl active:border-b-0 active:translate-y-1 transition-all text-sm uppercase tracking-wide shadow-md cursor-pointer"
      >
        Continuar no Mapa →
      </button>
    </div>
  );
}