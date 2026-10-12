import { TimerState, TimerEvent, PomodoroSettings, DEFAULT_POMODORO } from './types';

export function createInitialState(): TimerState {
  return {
    mode: 'idle',
    activeSubjectId: null,
    activeSessionId: null,
    sessionStartedAt: null,
    focusStartedAt: null,
    breakStartedAt: null,
    accumulatedFocus: 0,
    accumulatedBreak: 0,
    isFullscreen: false,
    pomodoroCount: 0,
    pomodoroPhase: null,
  };
}

function secondsSince(start: number | null, now: number): number {
  return start ? Math.floor((now - start) / 1000) : 0;
}

function toBreak(state: TimerState, now: number, isFullscreen: boolean): TimerState {
  return {
    ...state,
    mode: 'break',
    focusStartedAt: null,
    breakStartedAt: now,
    accumulatedFocus: state.accumulatedFocus + secondsSince(state.focusStartedAt, now),
    isFullscreen,
  };
}

function toFocus(state: TimerState, now: number, isFullscreen: boolean): TimerState {
  return {
    ...state,
    mode: 'focusing',
    focusStartedAt: now,
    breakStartedAt: null,
    accumulatedBreak: state.accumulatedBreak + secondsSince(state.breakStartedAt, now),
    isFullscreen,
    pomodoroPhase: 'focus',
  };
}

export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  const now = Date.now();

  switch (event.type) {
    case 'START_SESSION':
      return {
        ...createInitialState(),
        mode: 'focusing',
        activeSubjectId: event.subjectId,
        activeSessionId: event.sessionId,
        sessionStartedAt: now,
        focusStartedAt: now,
        isFullscreen: true,
        pomodoroPhase: 'focus',
      };

    case 'STOP_SESSION':
      return createInitialState();

    case 'PAUSE_SESSION':
      return state.mode === 'focusing' ? toBreak(state, now, state.isFullscreen) : state;

    case 'RESUME_SESSION':
      return state.mode === 'break' ? toFocus(state, now, true) : state;

    case 'POMODORO_FOCUS_COMPLETE': {
      if (state.mode !== 'focusing') return state;
      const pomodoroCount = state.pomodoroCount + 1;
      const isLongBreak = pomodoroCount % (event.settings.longBreakInterval || 4) === 0;
      return {
        ...toBreak(state, now, false),
        pomodoroCount,
        pomodoroPhase: isLongBreak ? 'longBreak' : 'shortBreak',
      };
    }

    case 'POMODORO_BREAK_COMPLETE':
      if (state.mode !== 'break') return state;
      return toFocus(state, now, true);

    case 'FULLSCREEN_ENTER':
      if (state.mode === 'idle') return state;
      return state.mode === 'break' ? toFocus(state, now, true) : { ...state, isFullscreen: true };

    // leaving fullscreen while focusing counts as a break, like yeolpumta locking the phone
    case 'FULLSCREEN_EXIT':
      if (state.mode === 'idle') return state;
      return state.mode === 'focusing' ? toBreak(state, now, false) : { ...state, isFullscreen: false };

    default:
      return state;
  }
}

export interface DisplayTimes {
  currentFocus: number;
  currentBreak: number;
  pomodoroRemaining: number;
}

export function getDisplayTimes(state: TimerState, settings: PomodoroSettings = DEFAULT_POMODORO): DisplayTimes {
  const now = Date.now();

  if (state.mode === 'focusing') {
    const elapsed = secondsSince(state.focusStartedAt, now);
    return {
      currentFocus: state.accumulatedFocus + elapsed,
      currentBreak: state.accumulatedBreak,
      pomodoroRemaining: Math.max(0, settings.focusDuration - elapsed),
    };
  }

  if (state.mode === 'break') {
    const elapsed = secondsSince(state.breakStartedAt, now);
    const breakLength = state.pomodoroPhase === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration;
    return {
      currentFocus: state.accumulatedFocus,
      currentBreak: state.accumulatedBreak + elapsed,
      pomodoroRemaining: Math.max(0, breakLength - elapsed),
    };
  }

  return { currentFocus: 0, currentBreak: 0, pomodoroRemaining: settings.focusDuration };
}

export async function enterFullscreen(): Promise<boolean> {
  if (document.fullscreenElement || !document.fullscreenEnabled) return !!document.fullscreenElement;
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch (error) {
    console.warn('failed to enter fullscreen', error);
    return false;
  }
}

export async function exitFullscreen(): Promise<boolean> {
  if (!document.fullscreenElement) return true;
  try {
    await document.exitFullscreen();
    return true;
  } catch (error) {
    console.warn('failed to exit fullscreen', error);
    return false;
  }
}
