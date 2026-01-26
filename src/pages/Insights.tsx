import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data for Calendar
const CALENDAR_DAYS = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2; // Offset to start late previous month
    if (day <= 0) return { day: 30 + day, inMonth: false, time: null };
    if (day > 31) return { day: day - 31, inMonth: false, time: null };

    // Random data generation
    const hasData = Math.random() > 0.3;
    if (!hasData) return { day, inMonth: true, time: null, label: 'Day Off' };

    const hours = Math.floor(Math.random() * 8) + 1;
    const mins = Math.floor(Math.random() * 60);
    return {
        day,
        inMonth: true,
        time: `${hours}:${mins.toString().padStart(2, '0')}`,
        intensity: hours > 6 ? 3 : hours > 3 ? 2 : 1
    };
});

const Insights = () => {
    const [activeTab, setActiveTab] = useState('Day');

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-in fade-in duration-500">

      {/* Calendar Card */}
      <div className="bg-neutral-surface rounded-3xl p-6 shadow-lg border border-neutral-border mb-6">
          <div className="flex items-center justify-between mb-6">
              <button className="p-2 hover:bg-neutral-bg rounded-full text-neutral-muted hover:text-white transition-colors"><ChevronLeft size={20} /></button>
              <h2 className="text-lg font-bold">August 2026</h2>
              <button className="p-2 hover:bg-neutral-bg rounded-full text-neutral-muted hover:text-white transition-colors"><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <span key={d} className="text-xs text-neutral-muted font-medium py-2">{d}</span>
              ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
              {CALENDAR_DAYS.map((date, idx) => (
                  <div
                    key={idx}
                    className={cn(
                        "aspect-[0.9] rounded-sm flex flex-col items-center justify-center relative cursor-pointer transition-all hover:brightness-110",
                        !date.inMonth && "opacity-20 grayscale",
                        date.label ? "bg-white/5 text-neutral-muted" :
                        date.intensity === 3 ? "bg-primary text-white" : // Use primary color
                        date.intensity === 2 ? "bg-primary/80 text-white" :
                        date.intensity === 1 ? "bg-primary/60 text-white" :
                        "bg-[#2C2C2C] text-neutral-muted", // Dark gray blocks for empty days
                        date.day === 30 && "ring-2 ring-white z-10" // Selected Day Highlight
                    )}
                  >
                        <span className="text-xs font-bold mb-1">{date.day}</span>
                        {date.label ? (
                             <span className="text-[9px] md:text-[10px] leading-tight text-center px-1 text-white/70">{date.label}</span>
                        ) : date.time ? (
                            <span className="text-[10px] md:text-xs font-mono font-medium">{date.time}</span>
                        ) : null}
                  </div>
              ))}
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-border mb-6 px-4">
          {['Day', 'Week', 'Month'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                    "flex-1 pb-3 text-sm font-medium transition-colors relative uppercase tracking-wider",
                    activeTab === tab ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                )}
              >
                  {tab}
                  {activeTab === tab && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-white rounded-t-full" />
                  )}
              </button>
          ))}
      </div>

      {/* Daily Stats */}
      <div className="bg-neutral-surface rounded-3xl p-8 shadow-sm border border-neutral-border text-center mb-6 pt-4">
          <h3 className="text-white text-base font-bold mb-8">Wed, Jul 30</h3>

          <div className="flex justify-around items-end">
              <div className="flex flex-col gap-2 items-center">
                  <span className="text-primary text-xs uppercase tracking-wider font-bold">Total</span>
                  <span className="text-3xl font-mono font-bold text-white tracking-widest">20:26:03</span>
                  <span className="text-neutral-500 text-xs">(Break 11:36:49)</span>
              </div>

              <div className="flex flex-col gap-2 items-center">
                  <span className="text-primary text-xs uppercase tracking-wider font-bold">Max Focus</span>
                  <span className="text-3xl font-mono font-bold text-white tracking-widest">03:42:16</span>
                  <span className="h-4"></span>  {/* Spacer */}
              </div>
          </div>

           <div className="flex justify-around mt-8 text-xs text-primary font-bold uppercase tracking-wider">
               <span>Started</span>
               <span>Finished</span>
           </div>
      </div>

    </div>
  );
};

export default Insights;
