import { TimerState, TimerEvent, generateId, PomodoroSettings, DEFAULT_POMODORO } from './types';

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

export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  const now = Date.now();

  switch (event.type) {
    case 'START_SESSION': {
      return {
        ...state,
        mode: 'focusing',
        activeSubjectId: event.subjectId,
        activeSessionId: generateId(),
        sessionStartedAt: now,
        focusStartedAt: now,
        breakStartedAt: null,
        accumulatedFocus: 0,
        accumulatedBreak: 0,
        isFullscreen: true,
        pomodoroCount: 0,
        pomodoroPhase: 'focus',
      };
    }

    case 'STOP_SESSION': {
      let finalFocus = state.accumulatedFocus;
      let finalBreak = state.accumulatedBreak;

      if (state.mode === 'focusing' && state.focusStartedAt) {
        finalFocus += Math.floor((now - state.focusStartedAt) / 1000);
      } else if (state.mode === 'break' && state.breakStartedAt) {
        finalBreak += Math.floor((now - state.breakStartedAt) / 1000);
      }

      return {
        ...createInitialState(),
        accumulatedFocus: finalFocus,
        accumulatedBreak: finalBreak,
      };
    }

    case 'SWITCH_SUBJECT': {
      if (state.mode === 'idle') {
        return timerReducer(state, { type: 'START_SESSION', subjectId: event.subjectId });
      }
      return {
        ...state,
        activeSubjectId: event.subjectId,
      };
    }

    case 'POMODORO_FOCUS_COMPLETE': {
      const newCount = state.pomodoroCount + 1;
      const isLongBreak = newCount % (event.settings?.longBreakInterval || 4) === 0;
      let finalFocus = state.accumulatedFocus;
      if (state.focusStartedAt) {
        finalFocus += Math.floor((now - state.focusStartedAt) / 1000);
      }
      return {
        ...state,
        mode: 'break',
        focusStartedAt: null,
        breakStartedAt: now,
        accumulatedFocus: finalFocus,
        isFullscreen: false,
        pomodoroCount: newCount,
        pomodoroPhase: isLongBreak ? 'longBreak' : 'shortBreak',
      };
    }

    case 'POMODORO_BREAK_COMPLETE': {
      let finalBreak = state.accumulatedBreak;
      if (state.breakStartedAt) {
        finalBreak += Math.floor((now - state.breakStartedAt) / 1000);
      }
      return {
        ...state,
        mode: 'focusing',
        focusStartedAt: now,
        breakStartedAt: null,
        accumulatedBreak: finalBreak,
        isFullscreen: true,
        pomodoroPhase: 'focus',
      };
    }

    case 'FULLSCREEN_ENTER': {
      if (state.mode === 'idle' || state.isFullscreen) {
        return { ...state, isFullscreen: true };
      }

      if (state.mode === 'break' && state.breakStartedAt) {
        const breakElapsed = Math.floor((now - state.breakStartedAt) / 1000);
        return {
          ...state,
          mode: 'focusing',
          isFullscreen: true,
          focusStartedAt: now,
          breakStartedAt: null,
          accumulatedBreak: state.accumulatedBreak + breakElapsed,
        };
      }

      return {
        ...state,
        mode: 'focusing',
        isFullscreen: true,
        focusStartedAt: now,
      };
    }

    case 'FULLSCREEN_EXIT': {
      if (state.mode === 'idle' || !state.isFullscreen) {
        return { ...state, isFullscreen: false };
      }

      if (state.mode === 'focusing' && state.focusStartedAt) {
        const focusElapsed = Math.floor((now - state.focusStartedAt) / 1000);
        return {
          ...state,
          mode: 'break',
          isFullscreen: false,
          focusStartedAt: null,
          breakStartedAt: now,
          accumulatedFocus: state.accumulatedFocus + focusElapsed,
        };
      }

      return {
        ...state,
        mode: 'break',
        isFullscreen: false,
        breakStartedAt: now,
      };
    }

    case 'TICK': {
      return state;
    }

    default:
      return state;
  }
}

export interface DisplayTimes {
  sessionDuration: number;
  currentFocus: number;
  currentBreak: number;
  currentSegment: number;
  pomodoroRemaining: number;
}

export function getDisplayTimes(state: TimerState, pomodoroSettings?: PomodoroSettings): DisplayTimes {
  const now = Date.now();
  const settings = pomodoroSettings || DEFAULT_POMODORO;

  if (state.mode === 'idle') {
    return {
      sessionDuration: 0,
      currentFocus: 0,
      currentBreak: 0,
      currentSegment: 0,
      pomodoroRemaining: settings.focusDuration,
    };
  }

  let currentFocus = state.accumulatedFocus;
  let currentBreak = state.accumulatedBreak;
  let currentSegment = 0;
  let pomodoroRemaining = 0;

  if (state.mode === 'focusing' && state.focusStartedAt) {
    const elapsed = Math.floor((now - state.focusStartedAt) / 1000);
    currentFocus += elapsed;
    currentSegment = elapsed;
    pomodoroRemaining = Math.max(0, settings.focusDuration - elapsed);
  } else if (state.mode === 'break' && state.breakStartedAt) {
    const elapsed = Math.floor((now - state.breakStartedAt) / 1000);
    currentBreak += elapsed;
    currentSegment = elapsed;
    const breakDuration = state.pomodoroPhase === 'longBreak'
      ? settings.longBreakDuration
      : settings.shortBreakDuration;
    pomodoroRemaining = Math.max(0, breakDuration - elapsed);
  }

  const sessionDuration = state.sessionStartedAt
    ? Math.floor((now - state.sessionStartedAt) / 1000)
    : 0;

  return {
    sessionDuration,
    currentFocus,
    currentBreak,
    currentSegment,
    pomodoroRemaining,
  };
}

export function isFullscreenSupported(): boolean {
  return !!(
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled
  );
}

export async function enterFullscreen(element?: HTMLElement): Promise<boolean> {
  const el = element || document.documentElement;

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      await (el as any).webkitRequestFullscreen();
    } else if ((el as any).mozRequestFullScreen) {
      await (el as any).mozRequestFullScreen();
    } else if ((el as any).msRequestFullscreen) {
      await (el as any).msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.warn('Failed to enter fullscreen:', error);
    return false;
  }
}

export async function exitFullscreen(): Promise<boolean> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.warn('Failed to exit fullscreen:', error);
    return false;
  }
}

export function isCurrentlyFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

export function getFullscreenChangeEvent(): string {
  if ('onfullscreenchange' in document) return 'fullscreenchange';
  if ('onwebkitfullscreenchange' in document) return 'webkitfullscreenchange';
  if ('onmozfullscreenchange' in document) return 'mozfullscreenchange';
  if ('onmsfullscreenchange' in document) return 'MSFullscreenChange';
  return 'fullscreenchange';
}
