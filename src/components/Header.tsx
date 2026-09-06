'use client';

interface HeaderProps {
  streak: number;
  xp: number;
}

export default function Header({ streak, xp }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-brand-surface/90 backdrop-blur-md border-b border-amber-100 px-4 py-3 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-amber-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-brand-primary/20 tracking-tighter">
            PT
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">
              Falar<span className="text-brand-primary">Lisboa</span>
            </span>
            <span className="text-[10px] text-stone-500 font-medium leading-tight">
              Portoghese Europeo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-700 px-2.5 py-1 rounded-full border border-amber-500/20">
            <span>🔥</span>
            <span>{streak}</span>
          </div>
          <div className="flex items-center gap-1 bg-brand-primary/10 text-brand-primary px-2.5 py-1 rounded-full border border-brand-primary/20">
            <span>⭐</span>
            <span>{xp}</span>
          </div>
        </div>
      </div>
    </header>
  );
}