'use client';

type TabType = 'home' | 'grammar' | 'vocab' | 'chat';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface/95 backdrop-blur-md border-t border-orange-200/70 py-2.5 px-6 z-20">
      <div className="max-w-md mx-auto flex justify-between items-center text-[11px]">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 font-bold transition-colors ${
            activeTab === 'home' ? 'text-brand-primary' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex flex-col items-center gap-1 font-bold transition-colors ${
            activeTab === 'grammar' ? 'text-brand-primary' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="text-lg">🏛️</span>
          <span>Gramática</span>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex flex-col items-center gap-1 font-bold transition-colors ${
            activeTab === 'vocab' ? 'text-brand-primary' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="text-lg">🎬</span>
          <span>Vídeos</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 font-bold transition-colors ${
            activeTab === 'chat' ? 'text-brand-primary' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <span className="text-lg">💬</span>
          <span>Conversa</span>
        </button>
      </div>
    </nav>
  );
}