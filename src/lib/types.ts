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
  // focus time spent on flights that carried this task
  focusSeconds?: number;
}

export type FlightKind = 'fixed' | 'open' | 'pomodoro';

export interface Leg {
  from: string;
  to: string;
  focusSeconds: number;
  distanceKm: number;
}

export interface SessionFlight {
  kind: FlightKind;
  flightNo: string;
  todoId: string | null;
  legs: Leg[];
}

export interface Session {
  id: string;
  subjectId: string;
  startedAt: number;
  endedAt: number | null;
  focusDuration: number;
  breakDuration: number;
  // longest stretch of focus without a break, missing on sessions saved before it was tracked
  maxFocusStreak?: number;
  // focus intervals as start and end timestamps, used by the day timeline
  segments?: [number, number][];
  flight?: SessionFlight;
}

export type TimerMode = 'idle' | 'focusing' | 'break';

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
}

export const DEFAULT_POMODORO: PomodoroSettings = {
  focusDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
};

// the flight in progress, from and to always describe the current leg
export interface ActiveFlight {
  kind: FlightKind;
  flightNo: string;
  todoId: string | null;
  from: string;
  to: string;
  plannedSeconds: number | null;
  // surprise routes keep the destination hidden until landing
  mystery: boolean;
  legFocusStart: number;
  legs: Leg[];
}

export interface BoardingPlan {
  kind: FlightKind;
  to: string;
  plannedSeconds: number | null;
  mystery: boolean;
  todoId: string | null;
  flightNo: string;
}

export interface TimerState {
  mode: TimerMode;
  activeSubjectId: string | null;
  activeSessionId: string | null;
  sessionStartedAt: number | null;
  focusStartedAt: number | null;
  breakStartedAt: number | null;
  accumulatedFocus: number;
  accumulatedBreak: number;
  maxFocusSegment: number;
  segments: [number, number][];
  isFullscreen: boolean;
  pomodoroCount: number;
  pomodoroPhase: 'focus' | 'shortBreak' | 'longBreak' | null;
  flight: ActiveFlight | null;
}

export type TimerEvent =
  | { type: 'START_SESSION'; subjectId: string; sessionId: string; from: string; plan: BoardingPlan }
  | { type: 'STOP_SESSION' }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'FULLSCREEN_ENTER' }
  | { type: 'FULLSCREEN_EXIT' }
  | { type: 'POMODORO_FOCUS_COMPLETE'; settings: PomodoroSettings }
  | { type: 'POMODORO_BREAK_COMPLETE'; nextTo: string };

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

export type DistanceUnit = 'km' | 'mi' | 'nm';
export type SpeedUnit = 'kmh' | 'mph' | 'kts';
export type AmbienceKind = 'off' | 'cabin' | 'rain';

export interface AppSettings {
  dailyGoalSeconds: number;
  dayStartHour: number;
  sound: boolean;
  notifications: boolean;
  homeAirport: string;
  distanceUnit: DistanceUnit;
  speedUnit: SpeedUnit;
  ambience: AmbienceKind;
  ambienceVolume: number;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  dailyGoalSeconds: 6 * 3600,
  dayStartHour: 0,
  sound: true,
  notifications: false,
  homeAirport: 'ICN',
  distanceUnit: 'km',
  speedUnit: 'kmh',
  ambience: 'cabin',
  ambienceVolume: 0.5,
};

export const STORAGE_KEYS = {
  POMODORO_SETTINGS: 'pi_pomodoro_settings',
  APP_SETTINGS: 'pi_app_settings',
  LOCATION: 'pi_location',
  BOARDING: 'pi_boarding',
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

let dayStartHour = DEFAULT_APP_SETTINGS.dayStartHour;

// like yeolpumta, study before this hour still belongs to the previous day
export function setDayStartHour(hour: number): void {
  dayStartHour = hour;
}

// logical study day as yyyy-mm-dd in local time, shifted back by the day start hour
export function getDateKey(timestamp: number = Date.now()): string {
  const d = new Date(timestamp - dayStartHour * 3600_000);
  return toKey(d);
}

export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// local midnight of a date key
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysToKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

// timestamps where a logical day starts and ends
export function dayBounds(key: string): [number, number] {
  const d = parseKey(key);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), dayStartHour).getTime();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, dayStartHour).getTime();
  return [start, end];
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}
