'use client';

interface DailyMetaCardProps {
  progressPercentage: number;
  onStartClick: () => void;
}

export default function DailyMetaCard({ progressPercentage, onStartClick }: DailyMetaCardProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-600 to-stone-900 rounded-3xl p-5 text-white shadow-xl shadow-orange-950/10 border border-orange-400/30">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-100 bg-white/15 px-2.5 py-0.5 rounded-md backdrop-blur-sm">
            Meta Diária
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight">Treino de Hoje</h2>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-lg border border-white/20">
          🇵🇹
        </div>
      </div>

      <p className="text-xs text-amber-100/90 mb-4 font-medium">
        Completa 1 sessione di verbi per mantenere lo streak!
      </p>

      <div className="w-full bg-black/30 h-2.5 rounded-full mb-5 p-0.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-300 to-yellow-200 h-full rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <button
        onClick={onStartClick}
        className="w-full bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all text-sm active:scale-[0.98]"
      >
        Continuar Estudo (5 min)
      </button>
    </div>
  );
}