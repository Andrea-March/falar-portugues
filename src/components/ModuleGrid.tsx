'use client';

interface ModuleGridProps {
  onSelectModule: (tab: 'grammar' | 'vocab' | 'chat') => void;
}

export default function ModuleGrid({ onSelectModule }: ModuleGridProps) {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-3 px-1">
        Módulos de Aprendizagem
      </h3>

      <div className="space-y-3">
        <button
          onClick={() => onSelectModule('grammar')}
          className="w-full text-left bg-brand-surface border border-orange-200/80 p-4 rounded-2xl shadow-sm hover:border-brand-primary transition-all flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-100/70 text-brand-primary flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
              🏛️
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-800 group-hover:text-brand-primary transition-colors">
                Gramática e Verbos
              </h4>
              <p className="text-xs text-stone-500 font-medium">Conjugações e regras PT-PT</p>
            </div>
          </div>
          <span className="text-stone-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all">→</span>
        </button>

        <button
          onClick={() => onSelectModule('vocab')}
          className="w-full text-left bg-brand-surface border border-orange-200/80 p-4 rounded-2xl shadow-sm hover:border-brand-primary transition-all flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
              🎬
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-800 group-hover:text-brand-primary transition-colors">
                Vocabulário em Vídeo
              </h4>
              <p className="text-xs text-stone-500 font-medium">Micro-clips de situações reais</p>
            </div>
          </div>
          <span className="text-stone-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all">→</span>
        </button>

        <button
          onClick={() => onSelectModule('chat')}
          className="w-full text-left bg-brand-surface border border-orange-200/80 p-4 rounded-2xl shadow-sm hover:border-brand-primary transition-all flex items-center justify-between group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-yellow-100/70 text-yellow-800 flex items-center justify-center text-xl font-bold group-hover:scale-105 transition-transform">
              💬
            </div>
            <div>
              <h4 className="font-bold text-sm text-stone-800 group-hover:text-brand-primary transition-colors">
                Conversação AI
              </h4>
              <p className="text-xs text-stone-500 font-medium">Roleplay em cafés e lojas</p>
            </div>
          </div>
          <span className="text-stone-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all">→</span>
        </button>
      </div>
    </div>
  );
}