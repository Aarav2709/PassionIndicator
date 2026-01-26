import { HelpCircle } from 'lucide-react';

const BigTimer = () => {
  return (
    <div className="bg-primary rounded-3xl p-8 mb-8 text-white text-center shadow-lg relative overflow-hidden group">
      {/* Decorative background circle */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />

      <header className="flex justify-between items-center relative z-10 mb-8">
        <div className="p-2 hover:bg-white/10 rounded-lg cursor-pointer transition">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium opacity-90">Mon, 2/5</span>
        </div>
        <div className="font-bold text-sm bg-white/20 px-3 py-1 rounded-full">
          D-24
        </div>
      </header>

      <div className="relative z-10 py-8">
        <h1 className="text-[6rem] leading-none font-bold tracking-tighter tabular-nums font-mono drop-shadow-sm select-none">
          11:09:18
        </h1>
        <div className="absolute top-1/2 right-12 translate-y-[-50%] opacity-0 group-hover:opacity-60 transition-opacity">
           <HelpCircle size={24} />
        </div>
      </div>

      <div className="relative z-10 mt-8 flex justify-center gap-12 font-medium opacity-90 pb-2">
        {/* Placeholder for future detailed stats like "Focus Level" */}
      </div>
    </div>
  );
};

export default BigTimer;
