import { formatDuration } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SubjectLookup } from './subjectLookup';

interface SubjectBreakdownProps {
  totals: Record<string, number>;
  subjects: SubjectLookup;
}

const SubjectBreakdown = ({ totals, subjects }: SubjectBreakdownProps) => {
  const rows = Object.entries(totals)
    .filter(([, time]) => time > 0)
    .sort(([, a], [, b]) => b - a);
  const total = rows.reduce((acc, [, time]) => acc + time, 0);

  if (rows.length === 0) return <p className="text-sm text-neutral-600">Nothing recorded.</p>;

  return (
    <ul className="space-y-4">
      {rows.map(([id, time]) => {
        const subject = subjects.get(id);
        const share = time / total;
        return (
          <li key={id}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-neutral-300">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', subject.color)} />
                <span className="truncate">{subject.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-neutral-300">
                {formatDuration(time)} <span className="ml-1 text-neutral-600">{Math.round(share * 100)}%</span>
              </span>
            </div>
            <div className="mt-2 h-[3px] rounded-full bg-white/[0.06]">
              <div className={cn('h-full rounded-full', subject.color)} style={{ width: `${share * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default SubjectBreakdown;
