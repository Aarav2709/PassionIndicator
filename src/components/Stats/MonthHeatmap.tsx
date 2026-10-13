import { DaySummary } from '@/lib/aggregations';
import { addDaysToKey, formatDuration, getDateKey, parseKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTooltip } from './useTooltip';

interface MonthHeatmapProps {
  monthKey: string;
  days: DaySummary[];
  goalSeconds: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// one hue getting stronger with more study, reaching the goal hits the strongest step
const LEVELS = ['bg-white/[0.04]', 'bg-emerald-500/20', 'bg-emerald-500/40', 'bg-emerald-500/65', 'bg-emerald-400'];

function level(focus: number, goal: number): number {
  if (focus <= 0) return 0;
  const ratio = focus / Math.max(goal, 3600);
  if (ratio >= 1) return 4;
  if (ratio >= 2 / 3) return 3;
  if (ratio >= 1 / 3) return 2;
  return 1;
}

// yeolpumta style calendar where each day is shaded by focus time
const MonthHeatmap = ({ monthKey, days, goalSeconds }: MonthHeatmapProps) => {
  const { containerRef, bind, tooltip } = useTooltip();
  const today = getDateKey();
  const leading = (parseKey(monthKey).getDay() + 6) % 7;
  const byKey = new Map(days.map(d => [d.key, d]));
  const cellCount = Math.ceil((leading + days.length) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, i) => addDaysToKey(monthKey, i - leading));

  return (
    <div ref={containerRef} className="relative max-w-[720px]">
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map(d => (
          <span key={d} className="text-center text-[11px] text-neutral-600">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map(key => {
          const day = byKey.get(key);
          if (!day) return <div key={key} />;
          const lvl = level(day.focus, goalSeconds);
          const isFuture = key > today;
          const date = parseKey(key);
          const strong = lvl === 4;
          return (
            <div
              key={key}
              tabIndex={isFuture ? -1 : 0}
              aria-label={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} ${formatDuration(day.focus)}`}
              className={cn(
                'flex aspect-square flex-col justify-between rounded-lg p-1.5 outline-none sm:p-2',
                LEVELS[lvl],
                key === today && 'ring-1 ring-white/60',
                isFuture && 'opacity-40'
              )}
              {...(isFuture
                ? {}
                : bind(
                    <>
                      <div className="font-medium text-white">{date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                      <div className="tabular-nums">{day.focus > 0 ? formatDuration(day.focus) : 'No study'}</div>
                    </>
                  ))}
            >
              <span className={cn('text-[11px] tabular-nums', strong ? 'text-black/80' : 'text-neutral-400')}>{date.getDate()}</span>
              {day.focus > 0 && (
                <span className={cn('hidden text-[10px] tabular-nums sm:block', strong ? 'text-black/80' : 'text-neutral-300')}>
                  {formatDuration(day.focus)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-neutral-500">
        Less
        {LEVELS.map(l => (
          <span key={l} className={cn('h-3 w-3 rounded-[3px]', l)} />
        ))}
        Goal
      </div>
      {tooltip}
    </div>
  );
};

export default MonthHeatmap;
