import { Session, Subject, addDaysToKey, dayBounds, getDateKey, parseKey, toKey } from './types';
import { getSessions, getSubjects } from './storage';

// weeks start on monday
export function getWeekStartKey(key: string = getDateKey()): string {
  const day = parseKey(key).getDay();
  return addDaysToKey(key, day === 0 ? -6 : 1 - day);
}

export function getMonthStartKey(key: string = getDateKey()): string {
  return `${key.slice(0, 7)}-01`;
}

export function getDaysInRange(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  for (let key = startKey; key <= endKey; key = addDaysToKey(key, 1)) keys.push(key);
  return keys;
}

export function getMonthEndKey(key: string): string {
  const d = parseKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function sessionSegments(session: Session): [number, number][] {
  if (session.segments?.length) return session.segments;
  if (session.focusDuration === 0) return [];
  // older sessions only kept totals, so draw them as one block from the start
  return [[session.startedAt, session.startedAt + session.focusDuration * 1000]];
}

export function sessionMaxFocus(session: Session): number {
  return session.maxFocusStreak ?? session.focusDuration;
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
  const weekStart = getWeekStartKey(today);
  const monthStart = getMonthStartKey(today);

  const stats = new Map<string, SubjectWithStats>(
    subjects.map(s => [s.id, { ...s, todayTime: 0, weekTime: 0, monthTime: 0, allTime: 0 }])
  );

  for (const session of sessions) {
    const entry = stats.get(session.subjectId);
    if (!entry || session.id === excludeSessionId) continue;

    const key = getDateKey(session.startedAt);
    const focus = session.focusDuration;
    entry.allTime += focus;
    if (key === today) entry.todayTime += focus;
    if (key >= weekStart && key <= today) entry.weekTime += focus;
    if (key >= monthStart && key <= today) entry.monthTime += focus;
  }

  return subjects.map(s => stats.get(s.id)!);
}

export function toSubject({ todayTime, weekTime, monthTime, allTime, ...subject }: SubjectWithStats): Subject {
  return subject;
}

export interface DaySummary {
  key: string;
  focus: number;
  bySubject: Record<string, number>;
  maxFocus: number;
  startedAt: number | null;
  finishedAt: number | null;
}

export function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const byDay = new Map<string, Session[]>();
  for (const session of sessions) {
    const key = getDateKey(session.startedAt);
    const list = byDay.get(key);
    if (list) list.push(session);
    else byDay.set(key, [session]);
  }
  return byDay;
}

export function summarizeDay(key: string, sessions: Session[] = []): DaySummary {
  const summary: DaySummary = { key, focus: 0, bySubject: {}, maxFocus: 0, startedAt: null, finishedAt: null };

  for (const session of sessions) {
    if (session.focusDuration === 0) continue;
    summary.focus += session.focusDuration;
    summary.bySubject[session.subjectId] = (summary.bySubject[session.subjectId] ?? 0) + session.focusDuration;
    summary.maxFocus = Math.max(summary.maxFocus, sessionMaxFocus(session));

    const segments = sessionSegments(session);
    const first = segments[0]?.[0] ?? session.startedAt;
    const last = segments[segments.length - 1]?.[1] ?? session.endedAt ?? session.startedAt;
    summary.startedAt = summary.startedAt === null ? first : Math.min(summary.startedAt, first);
    summary.finishedAt = summary.finishedAt === null ? last : Math.max(summary.finishedAt, last);
  }

  return summary;
}

export function summarizeRange(keys: string[], byDay: Map<string, Session[]>): DaySummary[] {
  return keys.map(key => summarizeDay(key, byDay.get(key)));
}

export function totalBySubject(days: DaySummary[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const day of days) {
    for (const [id, time] of Object.entries(day.bySubject)) totals[id] = (totals[id] ?? 0) + time;
  }
  return totals;
}

// consecutive days with study ending today, or yesterday if today has nothing yet
export function getDayStreak(byDay: Map<string, Session[]>, today: string = getDateKey()): number {
  const studied = (key: string) => (byDay.get(key) ?? []).some(s => s.focusDuration > 0);
  let key = studied(today) ? today : addDaysToKey(today, -1);
  let streak = 0;
  while (studied(key)) {
    streak++;
    key = addDaysToKey(key, -1);
  }
  return streak;
}

export interface TimelineBlock {
  subjectId: string;
  start: number;
  end: number;
}

// focus intervals clipped to the logical day, for the yeolpumta style planner
export function getDayTimeline(key: string, sessions: Session[]): TimelineBlock[] {
  const [dayStart, dayEnd] = dayBounds(key);
  const blocks: TimelineBlock[] = [];
  for (const session of sessions) {
    for (const [start, end] of sessionSegments(session)) {
      const s = Math.max(start, dayStart);
      const e = Math.min(end, dayEnd);
      if (e > s) blocks.push({ subjectId: session.subjectId, start: s, end: e });
    }
  }
  return blocks.sort((a, b) => a.start - b.start);
}
