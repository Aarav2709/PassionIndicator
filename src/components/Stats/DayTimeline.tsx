import { TimelineBlock } from '@/lib/aggregations';
import { dayBounds, formatClock, formatDuration } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SubjectLookup } from './subjectLookup';
import { useTooltip } from './useTooltip';

interface DayTimelineProps {
  dayKey: string;
  blocks: TimelineBlock[];
  subjects: SubjectLookup;
}

const HOUR = 3600_000;

// yeolpumta style planner, one row per hour split into ten minute cells
const DayTimeline = ({ dayKey, blocks, subjects }: DayTimelineProps) => {
  const { containerRef, bind, tooltip } = useTooltip();
  const [dayStart] = dayBounds(dayKey);
  const now = Date.now();

  return (
    <div ref={containerRef} className="relative">
      <div className="space-y-[3px]" role="list" aria-label="Study timeline">
        {Array.from({ length: 24 }, (_, i) => {
          const rowStart = dayStart + i * HOUR;
          const rowEnd = rowStart + HOUR;
          const hour = new Date(rowStart).getHours();
          const rowBlocks = blocks.filter(b => b.end > rowStart && b.start < rowEnd);
          const isNowRow = now >= rowStart && now < rowEnd;

          return (
            <div key={i} role="listitem" className="flex items-center gap-3">
              <span className={cn('w-6 text-right text-[11px] tabular-nums', isNowRow ? 'text-white' : 'text-neutral-600')}>
                {String(hour).padStart(2, '0')}
              </span>
              <div className="relative grid h-4 flex-1 grid-cols-6 gap-[2px]">
                {Array.from({ length: 6 }, (_, c) => (
                  <div key={c} className="rounded-[3px] bg-white/[0.04]" />
                ))}
                {rowBlocks.map((block, j) => {
                  const start = Math.max(block.start, rowStart);
                  const end = Math.min(block.end, rowEnd);
                  const subject = subjects.get(block.subjectId);
                  return (
                    <div
                      key={j}
                      tabIndex={0}
                      aria-label={`${subject.name} ${formatClock(block.start)} to ${formatClock(block.end)}`}
                      className={cn('absolute inset-y-0 rounded-[3px] outline-none hover:brightness-125 focus-visible:ring-2', subject.color)}
                      style={{
                        left: `${((start - rowStart) / HOUR) * 100}%`,
                        width: `max(2px, ${((end - start) / HOUR) * 100}%)`,
                      }}
                      {...bind(
                        <>
                          <div className="font-medium text-white">{subject.name}</div>
                          <div className="tabular-nums">
                            {formatClock(block.start)} to {formatClock(block.end)} · {formatDuration(Math.round((block.end - block.start) / 1000))}
                          </div>
                        </>
                      )}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {tooltip}
    </div>
  );
};

export default DayTimeline;
