import { Trash2 } from 'lucide-react';
import { Session, formatClock, formatDuration } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SubjectLookup } from './subjectLookup';

interface SessionLogProps {
  sessions: Session[];
  subjects: SubjectLookup;
  onDelete: (id: string) => void;
}

const SessionLog = ({ sessions, subjects, onDelete }: SessionLogProps) => {
  if (sessions.length === 0) return <p className="text-sm text-neutral-600">No sessions on this day.</p>;

  const sorted = [...sessions].sort((a, b) => a.startedAt - b.startedAt);

  const handleDelete = (session: Session) => {
    const subject = subjects.get(session.subjectId);
    if (window.confirm(`Delete the ${subject.name} session from ${formatClock(session.startedAt)}? This removes ${formatDuration(session.focusDuration)} of study time.`)) {
      onDelete(session.id);
    }
  };

  return (
    <ul className="hairline divide-y divide-white/[0.07] border-y">
      {sorted.map(session => {
        const subject = subjects.get(session.subjectId);
        const lastSegment = session.segments?.[session.segments.length - 1];
        const end = session.endedAt ?? lastSegment?.[1] ?? session.startedAt + (session.focusDuration + session.breakDuration) * 1000;
        return (
          <li key={session.id} className="group flex items-center gap-4 py-3 text-sm">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', subject.color)} />
            <span className="min-w-0 flex-1 truncate text-neutral-300">{subject.name}</span>
            <span className="hidden tabular-nums text-neutral-600 sm:inline">
              {formatClock(session.startedAt)} to {formatClock(end)}
            </span>
            <span className="w-16 text-right tabular-nums text-white">{formatDuration(session.focusDuration)}</span>
            <button
              type="button"
              onClick={() => handleDelete(session)}
              aria-label={`Delete ${subject.name} session from ${formatClock(session.startedAt)}`}
              className="text-neutral-700 opacity-0 transition hover:text-rose-400 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default SessionLog;
