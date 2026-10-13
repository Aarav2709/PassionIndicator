import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimer } from '@/context/TimerContext';
import { Session, addDaysToKey, formatClock, formatDuration, formatTime, parseKey, toKey } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import {
  getDayStreak,
  getDayTimeline,
  getDaysInRange,
  getMonthEndKey,
  getMonthStartKey,
  getWeekStartKey,
  groupByDay,
  summarizeRange,
  totalBySubject,
} from '@/lib/aggregations';
import Segmented from '@/components/ui/Segmented';
import DayTimeline from '@/components/Stats/DayTimeline';
import WeekBars from '@/components/Stats/WeekBars';
import MonthHeatmap from '@/components/Stats/MonthHeatmap';
import SubjectBreakdown from '@/components/Stats/SubjectBreakdown';
import SessionLog from '@/components/Stats/SessionLog';
import { makeSubjectLookup } from '@/components/Stats/subjectLookup';

type Period = 'day' | 'week' | 'month';

function shiftAnchor(anchor: string, period: Period, direction: 1 | -1): string {
  if (period === 'day') return addDaysToKey(anchor, direction);
  if (period === 'week') return addDaysToKey(anchor, 7 * direction);
  const d = parseKey(anchor);
  return toKey(new Date(d.getFullYear(), d.getMonth() + direction, 1));
}

function rangeFor(anchor: string, period: Period): [string, string] {
  if (period === 'day') return [anchor, anchor];
  if (period === 'week') {
    const start = getWeekStartKey(anchor);
    return [start, addDaysToKey(start, 6)];
  }
  const start = getMonthStartKey(anchor);
  return [start, getMonthEndKey(start)];
}

function rangeLabel(start: string, end: string, period: Period, today: string): string {
  const s = parseKey(start);
  if (period === 'day') {
    if (start === today) return 'Today';
    if (start === addDaysToKey(today, -1)) return 'Yesterday';
    return s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  if (period === 'month') return s.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const e = parseKey(end);
  return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} to ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between py-3 text-sm">
    <dt className="text-neutral-500">{label}</dt>
    <dd className="tabular-nums text-white">{value}</dd>
  </div>
);

const Stats = () => {
  const { subjects, todayKey, dataVersion, appSettings, deleteSession } = useTimer();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [period, setPeriod] = useState<Period>('day');
  const [anchor, setAnchor] = useState(todayKey);

  useEffect(() => {
    getSessions().then(setSessions);
  }, [dataVersion]);

  const lookup = useMemo(() => makeSubjectLookup(subjects), [subjects]);
  const byDay = useMemo(() => groupByDay(sessions), [sessions]);
  const [start, end] = rangeFor(anchor, period);
  const keys = useMemo(() => getDaysInRange(start, end), [start, end]);
  const days = useMemo(() => summarizeRange(keys, byDay), [keys, byDay]);
  const totals = useMemo(() => totalBySubject(days), [days]);
  const streak = useMemo(() => getDayStreak(byDay, todayKey), [byDay, todayKey]);
  // sessions started the day before can run past the day start hour
  const timeline = useMemo(
    () => (period === 'day' ? getDayTimeline(anchor, [...(byDay.get(addDaysToKey(anchor, -1)) ?? []), ...(byDay.get(anchor) ?? [])]) : []),
    [period, anchor, byDay]
  );

  const goal = appSettings.dailyGoalSeconds;
  const total = days.reduce((acc, d) => acc + d.focus, 0);
  const maxFocus = Math.max(0, ...days.map(d => d.maxFocus));
  const elapsedDays = keys.filter(k => k <= todayKey).length;
  const studiedDays = days.filter(d => d.focus > 0).length;
  const goalDays = goal > 0 ? days.filter(d => d.focus >= goal).length : 0;
  const day = period === 'day' ? days[0] : null;
  const canGoForward = end < todayKey;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 md:pb-10 lg:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-medium">Stats</h1>

        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <div className="flex items-center">
            <button type="button" onClick={() => setAnchor(shiftAnchor(anchor, period, -1))} aria-label="Previous" className="icon-btn">
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(todayKey)}
              title="Jump to today"
              className="min-w-[9.5rem] rounded-full px-2 py-1 text-center text-sm text-white hover:bg-white/[0.04]"
            >
              {rangeLabel(start, end, period, todayKey)}
            </button>
            <button
              type="button"
              onClick={() => setAnchor(shiftAnchor(anchor, period, 1))}
              disabled={!canGoForward}
              aria-label="Next"
              className="icon-btn disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-16">
        <aside>
          <p className="label">{period === 'day' ? 'Total' : `Total this ${period}`}</p>
          <p className="mt-2 text-5xl font-normal tracking-tight tabular-nums">{day ? formatTime(day.focus) : formatDuration(total)}</p>

          <dl className="hairline mt-6 divide-y divide-white/[0.07] border-y">
            {day ? (
              <>
                <Row label="Max focus" value={formatTime(day.maxFocus)} />
                <Row label="Started" value={day.startedAt ? formatClock(day.startedAt) : '--:--'} />
                <Row label="Finished" value={day.finishedAt ? formatClock(day.finishedAt) : '--:--'} />
                {goal > 0 && <Row label="Goal" value={`${Math.round((day.focus / goal) * 100)}%`} />}
              </>
            ) : (
              <>
                <Row label="Daily average" value={formatDuration(elapsedDays ? Math.round(total / elapsedDays) : 0)} />
                <Row label="Max focus" value={formatTime(maxFocus)} />
                <Row label="Days studied" value={`${studiedDays} of ${elapsedDays}`} />
                {goal > 0 && <Row label="Goal reached" value={`${goalDays} ${goalDays === 1 ? 'day' : 'days'}`} />}
                <Row label="Current streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
              </>
            )}
          </dl>

          <p className="label mb-5 mt-10">Subjects</p>
          <SubjectBreakdown totals={totals} subjects={lookup} />
        </aside>

        <section className="min-w-0">
          <p className="label mb-5">{period === 'day' ? 'Timeline' : period === 'week' ? 'Focus by day' : 'Calendar'}</p>
          {period === 'day' && <DayTimeline dayKey={anchor} blocks={timeline} subjects={lookup} />}
          {period === 'week' && <WeekBars days={days} goalSeconds={goal} subjects={lookup} />}
          {period === 'month' && <MonthHeatmap monthKey={start} days={days} goalSeconds={goal} />}

          {period === 'day' && (
            <>
              <p className="label mb-3 mt-12">Sessions</p>
              <SessionLog sessions={byDay.get(anchor) ?? []} subjects={lookup} onDelete={deleteSession} />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Stats;
