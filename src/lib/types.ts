export interface Subject {
  id: string;
  name: string;
  color: string;
  order: number;
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

export type TimerMode = 'idle' | 'focusing' | 'break';

export interface PomodoroSettings {
  enabled: boolean;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export const DEFAULT_POMODORO: PomodoroSettings = {
  enabled: false,
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
};

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
  pomodoroCount: number;
  pomodoroPhase: 'focus' | 'shortBreak' | 'longBreak' | null;
}

export type TimerEvent =
  | { type: 'START_SESSION'; subjectId: string; sessionId: string }
  | { type: 'STOP_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'FULLSCREEN_ENTER' }
  | { type: 'FULLSCREEN_EXIT' }
  | { type: 'POMODORO_FOCUS_COMPLETE'; settings: PomodoroSettings }
  | { type: 'POMODORO_BREAK_COMPLETE' };

export const SUBJECT_COLORS = [
  { value: 'bg-subject-math', label: 'Orange' },
  { value: 'bg-subject-science', label: 'Gold' },
  { value: 'bg-subject-history', label: 'Sand' },
  { value: 'bg-subject-english', label: 'Blue' },
  { value: 'bg-emerald-500', label: 'Green' },
  { value: 'bg-rose-500', label: 'Rose' },
  { value: 'bg-violet-500', label: 'Violet' },
  { value: 'bg-cyan-500', label: 'Cyan' },
] as const;

export const STORAGE_KEYS = {
  ACTIVE_STATE: 'pi_active_state',
  POMODORO_SETTINGS: 'pi_pomodoro_settings',
} as const;

export const DB_NAME = 'PassionIndicatorDB';
export const DB_VERSION = 1;

export const STORES = {
  SUBJECTS: 'subjects',
  TODOS: 'todos',
  SESSIONS: 'sessions',
} as const;

export function generateId(): string {
  return crypto.randomUUID();
}

// local calendar date, an iso string would give the utc date and push early morning study into yesterday
export function getDateKey(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
