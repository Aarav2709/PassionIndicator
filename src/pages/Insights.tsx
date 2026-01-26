import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getTodayStats,
  getThisWeekStats,
  getThisMonthStats,
  getCalendarMonth,
  RangeStats,
  CalendarDay,
  formatTime,
  formatTimeCompact,
} from '@/lib/aggregations';

const Insights = () => {
  const [activeTab, setActiveTab] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [stats, setStats] = useState<RangeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
  }, [calendarYear, calendarMonth]);

  useEffect(() => {
    loadStats();
  }, [activeTab]);

  const loadCalendar = async () => {
    const days = await getCalendarMonth(calendarYear, calendarMonth);
    setCalendarDays(days);
  };

  const loadStats = async () => {
    setLoading(true);
    let data: RangeStats;
    if (activeTab === 'Day') {
      data = await getTodayStats();
    } else if (activeTab === 'Week') {
      data = await getThisWeekStats();
    } else {
      data = await getThisMonthStats();
    }
    setStats(data);
    setLoading(false);
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(y => y - 1);
    } else {
      setCalendarMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(y => y + 1);
    } else {
      setCalendarMonth(m => m + 1);
    }
  };

  const monthName = new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto pb-24 animate-in fade-in duration-500">
      <div className="bg-neutral-surface rounded-3xl p-6 shadow-lg border border-neutral-border mb-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-neutral-bg rounded-full text-neutral-muted hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-bold">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-neutral-bg rounded-full text-neutral-muted hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <span key={d} className="text-xs text-neutral-muted font-medium py-2">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {calendarDays.map((date, idx) => (
            <div
              key={idx}
              className={cn(
                "aspect-[0.9] rounded-sm flex flex-col items-center justify-center relative cursor-pointer transition-all hover:brightness-110",
                !date.inMonth && "opacity-20 grayscale",
                date.intensity === 3 ? "bg-primary text-white" :
                date.intensity === 2 ? "bg-primary/80 text-white" :
                date.intensity === 1 ? "bg-primary/60 text-white" :
                "bg-[#2C2C2C] text-neutral-muted"
              )}
            >
              <span className="text-xs font-bold mb-1">{date.day}</span>
              {date.focusTime > 0 && (
                <span className="text-[10px] md:text-xs font-mono font-medium">
                  {formatTimeCompact(date.focusTime)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex border-b border-neutral-border mb-6 px-4">
        {(['Day', 'Week', 'Month'] as const).map(tab => (
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

      <div className="bg-neutral-surface rounded-3xl p-8 shadow-sm border border-neutral-border text-center mb-6 pt-4">
        <h3 className="text-white text-base font-bold mb-8">
          {activeTab === 'Day' ? todayStr : activeTab === 'Week' ? 'This Week' : 'This Month'}
        </h3>

        {loading ? (
          <div className="py-8 text-neutral-muted">Loading...</div>
        ) : stats ? (
          <>
            <div className="flex justify-around items-end">
              <div className="flex flex-col gap-2 items-center">
                <span className="text-primary text-xs uppercase tracking-wider font-bold">Total Focus</span>
                <span className="text-3xl font-mono font-bold text-white tracking-widest">
                  {formatTime(stats.totalFocusTime)}
                </span>
                <span className="text-neutral-500 text-xs">(Break {formatTime(stats.totalBreakTime)})</span>
              </div>

              <div className="flex flex-col gap-2 items-center">
                <span className="text-primary text-xs uppercase tracking-wider font-bold">Max Focus</span>
                <span className="text-3xl font-mono font-bold text-white tracking-widest">
                  {formatTime(stats.maxFocusStreak)}
                </span>
                <span className="h-4"></span>
              </div>
            </div>

            <div className="flex justify-around mt-8 text-xs text-neutral-muted">
              <span>Sessions: {stats.sessionCount}</span>
              {activeTab !== 'Day' && <span>Days Studied: {stats.daysStudied}/{stats.totalDays}</span>}
            </div>

            {Object.keys(stats.subjectBreakdown).length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-border">
                <h4 className="text-primary text-xs uppercase tracking-wider font-bold mb-4">By Subject</h4>
                <div className="space-y-3">
                  {Object.entries(stats.subjectBreakdown).map(([id, data]) => (
                    <div key={id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', data.color)} />
                        <span className="text-sm text-neutral-300">{data.name}</span>
                      </div>
                      <span className="font-mono text-sm text-white">{formatTime(data.time)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-neutral-muted">No data</div>
        )}
      </div>
    </div>
  );
};

export default Insights;
