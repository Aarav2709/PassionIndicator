import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';

const Planner = () => {
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-neutral-bg rounded-lg text-neutral-muted hover:text-neutral-text transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-text">Aug 11 (Mon)</h1>
            <span className="text-sm font-medium text-primary bg-primary-soft px-2 py-0.5 rounded">D-57</span>
          </div>
          <button className="p-2 hover:bg-neutral-bg rounded-lg text-neutral-muted hover:text-neutral-text transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="flex gap-2 bg-white p-1 rounded-xl border border-neutral-border">
          <button className="p-2 rounded-lg bg-neutral-bg text-neutral-text shadow-sm">
            <List size={20} />
          </button>
          <button className="p-2 rounded-lg text-neutral-muted hover:bg-neutral-bg transition-colors">
            <CalendarIcon size={20} />
          </button>
        </div>
      </header>

      <div className="flex justify-between mb-8 bg-white p-4 rounded-2xl shadow-sm border border-neutral-border/50">
        {['S','M','T','W','T','F','S'].map((day, i) => (
          <div key={i} className={`flex flex-col items-center gap-1 w-12 py-2 rounded-xl cursor-pointer transition-all ${i === 1 ? 'bg-primary text-white shadow-md scale-110' : 'text-neutral-muted hover:bg-neutral-bg'}`}>
            <span className="text-xs font-medium opacity-80">{day}</span>
            <span className="text-sm font-bold">{10 + i}</span>
            {i === 1 && <div className="w-1 h-1 bg-white rounded-full mt-1" />}
          </div>
        ))}
      </div>

      <div className="flex-1">
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-border/50 overflow-auto">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-primary rounded-full" />
            Tasks & Goals
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-subject-science mb-2 uppercase tracking-wider">Science</h4>
              <div className="space-y-2 pl-4 border-l-2 border-neutral-100">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-5 h-5 rounded border-2 border-neutral-300 group-hover:border-subject-science transition-colors" />
                  <span className="text-neutral-text font-medium">Solve 1 page of a workbook</span>
                </div>
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-5 h-5 rounded border-2 border-neutral-300 group-hover:border-subject-science transition-colors" />
                  <span className="text-neutral-text font-medium">Study physics for 30 min</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-subject-math mb-2 uppercase tracking-wider">Math</h4>
              <div className="space-y-2 pl-4 border-l-2 border-neutral-100">
                <div className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-5 h-5 rounded border-2 border-neutral-300 group-hover:border-subject-math transition-colors" />
                  <span className="text-neutral-text font-medium">Solve 10 calculus problems</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-dashed border-neutral-200">
            <button className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-xl text-neutral-muted font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
              <span>+ Add New Task</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Planner;
