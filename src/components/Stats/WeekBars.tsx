import { DaySummary } from '@/lib/aggregations';
import { formatDuration, getDateKey, parseKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SubjectLookup } from './subjectLookup';
import { useTooltip } from './useTooltip';

interface WeekBarsProps {
  days: DaySummary[];
  goalSeconds: number;
  subjects: SubjectLookup;
}

const CHART_HEIGHT = 280;

function niceMaxHours(seconds: number): { max: number; step: number } {
  const hours = Math.max(1, Math.ceil(seconds / 3600));
  const step = hours <= 6 ? 1 : hours <= 12 ? 2 : 4;
  return { max: Math.ceil(hours / step) * step, step };
}

// focus hours per day stacked by subject, like the pomofocus report
const WeekBars = ({ days, goalSeconds, subjects }: WeekBarsProps) => {
  const { containerRef, bind, tooltip } = useTooltip();
  const today = getDateKey();
  const peak = Math.max(goalSeconds, ...days.map(d => d.focus));
  const { max, step } = niceMaxHours(peak);
  const scale = (seconds: number) => (seconds / (max * 3600)) * CHART_HEIGHT;
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  const columns = { gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-3">
        <div className="relative w-6 shrink-0 text-right text-[11px] tabular-nums text-neutral-600" style={{ height: CHART_HEIGHT }}>
          {ticks.map(h => (
            <span key={h} className="absolute right-0 translate-y-1/2" style={{ bottom: scale(h * 3600) }}>
              {h}h
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: CHART_HEIGHT }}>
          {ticks.map(h => (
            <div key={h} className="absolute inset-x-0 h-px bg-white/[0.06]" style={{ bottom: scale(h * 3600) }} />
          ))}

          {goalSeconds > 0 && (
            <div className="absolute inset-x-0 h-px bg-emerald-400/50" style={{ bottom: scale(goalSeconds) }}>
              <span className="absolute -top-4 right-0 text-xs text-neutral-500">Goal</span>
            </div>
          )}

          <div className="absolute inset-0 grid" style={columns}>
            {days.map(day => {
              const parts = Object.entries(day.bySubject).sort(([a], [b]) => subjects.order(a) - subjects.order(b));
              const date = parseKey(day.key);
              return (
                <div
                  key={day.key}
                  tabIndex={0}
                  aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long' })} ${formatDuration(day.focus)}`}
                  className="group relative flex h-full flex-col items-center justify-end outline-none"
                  {...bind(
                    <>
                      <div className="mb-1 font-medium text-white">
                        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {formatDuration(day.focus)}
                      </div>
                      {parts.length === 0 && <div>No study</div>}
                      {parts.map(([id, time]) => (
                        <div key={id} className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', subjects.get(id).color)} />
                          <span className="flex-1">{subjects.get(id).name}</span>
                          <span className="tabular-nums">{formatDuration(time)}</span>
                        </div>
                      ))}
                    </>
                  )}
                >
                  {day.focus > 0 && <span className="mb-1 text-[10px] tabular-nums text-neutral-400">{formatDuration(day.focus)}</span>}
                  <div className="flex w-full max-w-6 flex-col-reverse gap-[2px] group-hover:brightness-110" style={{ height: scale(day.focus) }}>
                    {parts.map(([id, time], i) => (
                      <div
                        key={id}
                        className={cn(subjects.get(id).color, i === parts.length - 1 && 'rounded-t')}
                        style={{ height: `${(time / day.focus) * 100}%`, minHeight: 2 }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-3">
        <div className="w-6 shrink-0" />
        <div className="grid flex-1" style={columns}>
          {days.map(day => (
            <span key={day.key} className={cn('text-center text-[11px]', day.key === today ? 'font-medium text-white' : 'text-neutral-500')}>
              {parseKey(day.key).toLocaleDateString(undefined, { weekday: 'short' })}
            </span>
          ))}
        </div>
      </div>
      {tooltip}
    </div>
  );
};

export default WeekBars;
