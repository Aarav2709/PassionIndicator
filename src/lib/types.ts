export interface Subject {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface Todo {
  id: string;
  subjectId: string;
  title: string;
  completed: boolean;
  createdAt: number;
}

export interface Session {
  id: string;
  subjectId: string;
  startedAt: number;
  endedAt: number | null;
  focusDuration: number;
  breakDuration: number;
}

export interface DailyStats {
  date: string;
  totalFocusTime: number;
  totalBreakTime: number;
  sessionCount: number;
  maxFocusStreak: number;
  subjectBreakdown: Record<string, number>;
  firstSessionAt: number | null;
  lastSessionAt: number | null;
}

export type TimerMode = 'idle' | 'focusing' | 'break';

export interface TimerState {
  mode: TimerMode;
  activeSubjectId: string | null;
  activeSessionId: string | null;
  sessionStartedAt: number | null;
  focusStartedAt: number | null;
  breakStartedAt: number | null;
  accumulatedFocus: number;
  accumulatedBreak: number;
  isFullscreen: boolean;
}

export type TimerEvent =
  | { type: 'START_SESSION'; subjectId: string }
  | { type: 'STOP_SESSION' }
  | { type: 'SWITCH_SUBJECT'; subjectId: string }
  | { type: 'FULLSCREEN_ENTER' }
  | { type: 'FULLSCREEN_EXIT' }
  | { type: 'TICK' };

export const STORAGE_KEYS = {
  SUBJECTS: 'pi_subjects',
  TODOS: 'pi_todos',
  SESSIONS: 'pi_sessions',
  DAILY_STATS: 'pi_daily_stats',
  ACTIVE_STATE: 'pi_active_state',
} as const;

export const DB_NAME = 'PassionIndicatorDB';
export const DB_VERSION = 1;

export const STORES = {
  SUBJECTS: 'subjects',
  TODOS: 'todos',
  SESSIONS: 'sessions',
  DAILY_STATS: 'dailyStats',
} as const;

export function generateId(): string {
  return crypto.randomUUID();
}

export function getDateKey(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  return d.toISOString().split('T')[0];
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimeCompact(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  return `${m}m`;
}
