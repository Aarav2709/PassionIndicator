import {
  Session,
  Subject,
  getDateKey,
  formatTime,
  formatTimeCompact,
} from './types';
import {
  getSessions,
  getSessionsInRange,
  getSubjects,
} from './storage';

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getDatesInRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(getDateKey(current.getTime()));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// --- Get Stats for a Date Range ---
export interface RangeStats {
  totalFocusTime: number;
  totalBreakTime: number;
  sessionCount: number;
  averageFocusPerDay: number;
  maxFocusStreak: number;
  daysStudied: number;
  totalDays: number;
  subjectBreakdown: Record<string, { name: string; color: string; time: number }>;
  dailyData: Array<{ date: string; focus: number; break: number }>;
}

export async function getStatsForRange(startDate: string, endDate: string): Promise<RangeStats> {
  const sessions = await getSessionsInRange(startDate, endDate);
  const subjects = await getSubjects();
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  const dailyMap = new Map<string, { focus: number; break: number; sessions: Session[] }>();
  const dates = getDatesInRange(new Date(startDate), new Date(endDate));

  // Initialize all dates
  for (const date of dates) {
    dailyMap.set(date, { focus: 0, break: 0, sessions: [] });
  }

  // Aggregate sessions
  let totalFocusTime = 0;
  let totalBreakTime = 0;
  let maxFocusStreak = 0;
  const subjectTimes: Record<string, number> = {};

  for (const session of sessions) {
    const dateKey = getDateKey(session.startedAt);
    const dayData = dailyMap.get(dateKey);

    if (dayData) {
      dayData.focus += session.focusDuration;
      dayData.break += session.breakDuration;
      dayData.sessions.push(session);
    }

    totalFocusTime += session.focusDuration;
    totalBreakTime += session.breakDuration;

    if (session.focusDuration > maxFocusStreak) {
      maxFocusStreak = session.focusDuration;
    }

    subjectTimes[session.subjectId] = (subjectTimes[session.subjectId] || 0) + session.focusDuration;
  }

  // Build subject breakdown with names
  const subjectBreakdown: Record<string, { name: string; color: string; time: number }> = {};
  for (const [subjectId, time] of Object.entries(subjectTimes)) {
    const subject = subjectMap.get(subjectId);
    subjectBreakdown[subjectId] = {
      name: subject?.name || 'Unknown',
      color: subject?.color || 'bg-gray-500',
      time,
    };
  }

  // Count days with activity
  const daysStudied = Array.from(dailyMap.values()).filter(d => d.focus > 0).length;

  // Build daily data array
  const dailyData = dates.map(date => {
    const data = dailyMap.get(date)!;
    return { date, focus: data.focus, break: data.break };
  });

  return {
    totalFocusTime,
    totalBreakTime,
    sessionCount: sessions.length,
    averageFocusPerDay: daysStudied > 0 ? Math.floor(totalFocusTime / daysStudied) : 0,
    maxFocusStreak,
    daysStudied,
    totalDays: dates.length,
    subjectBreakdown,
    dailyData,
  };
}

// --- Today's Stats ---
export async function getTodayStats(): Promise<RangeStats> {
  const today = getDateKey();
  return getStatsForRange(today, today);
}

// --- This Week's Stats ---
export async function getThisWeekStats(): Promise<RangeStats> {
  const weekStart = getWeekStart();
  const today = new Date();
  return getStatsForRange(getDateKey(weekStart.getTime()), getDateKey(today.getTime()));
}

// --- This Month's Stats ---
export async function getThisMonthStats(): Promise<RangeStats> {
  const monthStart = getMonthStart();
  const today = new Date();
  return getStatsForRange(getDateKey(monthStart.getTime()), getDateKey(today.getTime()));
}

// --- Subject Time by Period ---
export interface SubjectTimeStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
}

export async function getSubjectTimeStats(subjectId: string): Promise<SubjectTimeStats> {
  const allSessions = await getSessions();
  const subjectSessions = allSessions.filter(s => s.subjectId === subjectId);

  const today = getDateKey();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  let todayTime = 0;
  let weekTime = 0;
  let monthTime = 0;
  let allTime = 0;

  for (const session of subjectSessions) {
    const sessionDate = new Date(session.startedAt);
    const dateKey = getDateKey(session.startedAt);

    allTime += session.focusDuration;

    if (dateKey === today) {
      todayTime += session.focusDuration;
    }

    if (sessionDate >= weekStart) {
      weekTime += session.focusDuration;
    }

    if (sessionDate >= monthStart) {
      monthTime += session.focusDuration;
    }
  }

  return {
    today: todayTime,
    thisWeek: weekTime,
    thisMonth: monthTime,
    allTime,
  };
}

// --- All Subjects with Time Stats ---
export interface SubjectWithStats extends Subject {
  todayTime: number;
  weekTime: number;
  monthTime: number;
  allTime: number;
}

export async function getSubjectsWithStats(): Promise<SubjectWithStats[]> {
  const subjects = await getSubjects();
  const allSessions = await getSessions();

  const today = getDateKey();
  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  // Pre-compute times per subject
  const subjectTimes = new Map<string, { today: number; week: number; month: number; all: number }>();

  for (const subject of subjects) {
    subjectTimes.set(subject.id, { today: 0, week: 0, month: 0, all: 0 });
  }

  for (const session of allSessions) {
    const times = subjectTimes.get(session.subjectId);
    if (!times) continue;

    const sessionDate = new Date(session.startedAt);
    const dateKey = getDateKey(session.startedAt);

    times.all += session.focusDuration;

    if (dateKey === today) {
      times.today += session.focusDuration;
    }

    if (sessionDate >= weekStart) {
      times.week += session.focusDuration;
    }

    if (sessionDate >= monthStart) {
      times.month += session.focusDuration;
    }
  }

  return subjects.map(subject => {
    const times = subjectTimes.get(subject.id) || { today: 0, week: 0, month: 0, all: 0 };
    return {
      ...subject,
      todayTime: times.today,
      weekTime: times.week,
      monthTime: times.month,
      allTime: times.all,
    };
  });
}

// --- Trend Analysis ---
export type TrendDirection = 'increasing' | 'flat' | 'decreasing';

export interface TrendData {
  direction: TrendDirection;
  percentChange: number;
  previousPeriod: number;
  currentPeriod: number;
}

export function analyzeTrend(currentValue: number, previousValue: number): TrendData {
  if (previousValue === 0) {
    return {
      direction: currentValue > 0 ? 'increasing' : 'flat',
      percentChange: currentValue > 0 ? 100 : 0,
      previousPeriod: previousValue,
      currentPeriod: currentValue,
    };
  }

  const percentChange = ((currentValue - previousValue) / previousValue) * 100;

  let direction: TrendDirection = 'flat';
  if (percentChange > 10) direction = 'increasing';
  else if (percentChange < -10) direction = 'decreasing';

  return {
    direction,
    percentChange: Math.round(percentChange),
    previousPeriod: previousValue,
    currentPeriod: currentValue,
  };
}

// Compare this week to last week
export async function getWeeklyTrend(): Promise<TrendData> {
  const thisWeekStart = getWeekStart();
  const lastWeekStart = addDays(thisWeekStart, -7);
  const lastWeekEnd = addDays(thisWeekStart, -1);

  const thisWeek = await getStatsForRange(
    getDateKey(thisWeekStart.getTime()),
    getDateKey(Date.now())
  );

  const lastWeek = await getStatsForRange(
    getDateKey(lastWeekStart.getTime()),
    getDateKey(lastWeekEnd.getTime())
  );

  return analyzeTrend(thisWeek.totalFocusTime, lastWeek.totalFocusTime);
}

// --- Calendar Heatmap Data ---
export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  focusTime: number;
  breakTime: number;
  intensity: 0 | 1 | 2 | 3; // For coloring
  label?: string;
}

export async function getCalendarMonth(year: number, month: number): Promise<CalendarDay[]> {
  const firstDay = new Date(year, month, 1);

  // Get start of calendar (might include days from previous month)
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const calendarStart = addDays(firstDay, -startOffset);

  // Get 42 days (6 weeks)
  const days: CalendarDay[] = [];
  const sessions = await getSessionsInRange(
    getDateKey(calendarStart.getTime()),
    getDateKey(addDays(calendarStart, 41).getTime())
  );

  // Group sessions by date
  const sessionsByDate = new Map<string, Session[]>();
  for (const session of sessions) {
    const dateKey = getDateKey(session.startedAt);
    if (!sessionsByDate.has(dateKey)) {
      sessionsByDate.set(dateKey, []);
    }
    sessionsByDate.get(dateKey)!.push(session);
  }

  for (let i = 0; i < 42; i++) {
    const date = addDays(calendarStart, i);
    const dateKey = getDateKey(date.getTime());
    const daySessions = sessionsByDate.get(dateKey) || [];

    let focusTime = 0;
    let breakTime = 0;
    for (const s of daySessions) {
      focusTime += s.focusDuration;
      breakTime += s.breakDuration;
    }

    // Calculate intensity (0-3)
    const hours = focusTime / 3600;
    let intensity: 0 | 1 | 2 | 3 = 0;
    if (hours >= 6) intensity = 3;
    else if (hours >= 3) intensity = 2;
    else if (hours > 0) intensity = 1;

    days.push({
      date: dateKey,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      focusTime,
      breakTime,
      intensity,
      label: focusTime === 0 && date.getMonth() === month ? undefined : undefined,
    });
  }

  return days;
}

// --- Export utilities ---
export { formatTime, formatTimeCompact };
