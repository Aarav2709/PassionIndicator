import { Subject, getDateKey } from './types';
import { getSessions, getSubjects } from './storage';

// weeks start on monday
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export interface SubjectWithStats extends Subject {
  todayTime: number;
  weekTime: number;
  monthTime: number;
  allTime: number;
}

// skips the running session since the live clock already counts it
export async function getSubjectsWithStats(excludeSessionId: string | null = null): Promise<SubjectWithStats[]> {
  const [subjects, sessions] = await Promise.all([getSubjects(), getSessions()]);

  const today = getDateKey();
  const weekStart = getWeekStart().getTime();
  const monthStart = getMonthStart().getTime();

  const stats = new Map<string, SubjectWithStats>(
    subjects.map(s => [s.id, { ...s, todayTime: 0, weekTime: 0, monthTime: 0, allTime: 0 }])
  );

  for (const session of sessions) {
    const entry = stats.get(session.subjectId);
    if (!entry || session.id === excludeSessionId) continue;

    const focus = session.focusDuration;
    entry.allTime += focus;
    if (getDateKey(session.startedAt) === today) entry.todayTime += focus;
    if (session.startedAt >= weekStart) entry.weekTime += focus;
    if (session.startedAt >= monthStart) entry.monthTime += focus;
  }

  return subjects.map(s => stats.get(s.id)!);
}

export function toSubject({ todayTime, weekTime, monthTime, allTime, ...subject }: SubjectWithStats): Subject {
  return subject;
}
