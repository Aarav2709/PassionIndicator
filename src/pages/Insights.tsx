import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flame, Target, TrendingUp } from 'lucide-react';
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

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-6">Statistics</h2>

      {/* Calendar Heatmap */}
      <div className="ypt-card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-muted hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h3 className="text-sm font-bold text-white">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-muted hover:text-white transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-neutral-muted/60 font-semibold py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            const isToday = date.date === new Date().toISOString().split('T')[0];
            return (
              <div
                key={idx}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-center',
                  !date.inMonth && 'opacity-15',
                  isToday && 'ring-1 ring-primary/50',
                  date.intensity === 3 ? 'bg-primary/90 text-white' :
                  date.intensity === 2 ? 'bg-primary/50 text-white' :
                  date.intensity === 1 ? 'bg-primary/25 text-white/80' :
                  'bg-white/[0.03] text-neutral-muted/60'
                )}
              >
                <span className="text-[11px] font-semibold">{date.day}</span>
                {date.focusTime > 0 && (
                  <span className="text-[8px] font-mono mt-0.5 opacity-80">
                    {formatTimeCompact(date.focusTime)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4">
          <span className="text-[10px] text-neutral-muted/50">Less</span>
          <div className="w-3 h-3 rounded bg-white/[0.03]" />
          <div className="w-3 h-3 rounded bg-primary/25" />
          <div className="w-3 h-3 rounded bg-primary/50" />
          <div className="w-3 h-3 rounded bg-primary/90" />
          <span className="text-[10px] text-neutral-muted/50">More</span>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 bg-neutral-surface rounded-xl p-1 border border-neutral-border mb-6">
        {(['Day', 'Week', 'Month'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-xs font-semibold rounded-lg transition-all uppercase tracking-wider',
              activeTab === tab
                ? 'bg-primary text-white'
                : 'text-neutral-muted hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Display */}
      {loading ? (
        <div className="ypt-card p-12 text-center">
          <div className="text-neutral-muted text-sm">Loading...</div>
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="ypt-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock size={14} className="text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-muted font-semibold">
                  Total Focus
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
                {formatTime(stats.totalFocusTime)}
              </div>
              <div className="text-[11px] text-neutral-muted/60 mt-1 font-mono">
                Break: {formatTime(stats.totalBreakTime)}
              </div>
            </div>

            <div className="ypt-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Flame size={14} className="text-emerald-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-muted font-semibold">
                  Max Focus
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
                {formatTime(stats.maxFocusStreak)}
              </div>
              <div className="text-[11px] text-neutral-muted/60 mt-1">
                Longest single session
              </div>
            </div>

            <div className="ypt-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target size={14} className="text-blue-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-muted font-semibold">
                  Sessions
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {stats.sessionCount}
              </div>
              {activeTab !== 'Day' && (
                <div className="text-[11px] text-neutral-muted/60 mt-1">
                  {stats.daysStudied}/{stats.totalDays} days active
                </div>
              )}
            </div>

            <div className="ypt-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-purple-400" />
                </div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-muted font-semibold">
                  Avg/Day
                </span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
                {formatTime(stats.averageFocusPerDay)}
              </div>
              <div className="text-[11px] text-neutral-muted/60 mt-1">
                Average focus per day
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          {Object.keys(stats.subjectBreakdown).length > 0 && (
            <div className="ypt-card p-6">
              <h4 className="text-xs uppercase tracking-wider text-neutral-muted font-semibold mb-5">
                By Subject
              </h4>
              <div className="space-y-4">
                {Object.entries(stats.subjectBreakdown)
                  .sort(([, a], [, b]) => b.time - a.time)
                  .map(([id, data]) => {
                    const pct = stats.totalFocusTime > 0
                      ? (data.time / stats.totalFocusTime) * 100
                      : 0;
                    return (
                      <div key={id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2.5 h-2.5 rounded-full', data.color)} />
                            <span className="text-sm text-white font-medium">{data.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-muted">{Math.round(pct)}%</span>
                            <span className="font-mono text-sm text-white tabular-nums">
                              {formatTime(data.time)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-700', data.color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="ypt-card p-12 text-center">
          <div className="text-neutral-muted text-sm">No data yet. Start studying!</div>
        </div>
      )}
    </div>
  );
};

export default Insights;
