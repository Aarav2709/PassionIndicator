import { TimerState, TimerEvent, PomodoroSettings, DEFAULT_POMODORO } from './types';
import { distanceKm, flightProfile, getAirport } from './flights';

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
    maxFocusSegment: 0,
    segments: [],
    pomodoroCount: 0,
    pomodoroPhase: null,
    flight: null,
  };
}

function secondsSince(start: number | null, now: number): number {
  return start ? Math.floor((now - start) / 1000) : 0;
}

function toBreak(state: TimerState, now: number): TimerState {
  const focused = secondsSince(state.focusStartedAt, now);
  return {
    ...state,
    mode: 'break',
    focusStartedAt: null,
    breakStartedAt: now,
    accumulatedFocus: state.accumulatedFocus + focused,
    maxFocusSegment: Math.max(state.maxFocusSegment, focused),
    segments: state.focusStartedAt ? [...state.segments, [state.focusStartedAt, now]] : state.segments,
  };
}

// closed segments plus the one still running, ready to be saved
export function currentSegments(state: TimerState, now: number = Date.now()): [number, number][] {
  return state.mode === 'focusing' && state.focusStartedAt ? [...state.segments, [state.focusStartedAt, now]] : state.segments;
}

function toFocus(state: TimerState, now: number): TimerState {
  return {
    ...state,
    mode: 'focusing',
    focusStartedAt: now,
    breakStartedAt: null,
    accumulatedBreak: state.accumulatedBreak + secondsSince(state.breakStartedAt, now),
    pomodoroPhase: state.pomodoroPhase === null ? null : 'focus',
  };
}

export function timerReducer(state: TimerState, event: TimerEvent): TimerState {
  const now = Date.now();

  switch (event.type) {
    case 'START_SESSION': {
      const { plan } = event;
      return {
        ...createInitialState(),
        mode: 'focusing',
        activeSubjectId: event.subjectId,
        activeSessionId: event.sessionId,
        sessionStartedAt: now,
        focusStartedAt: now,
        pomodoroPhase: plan.kind === 'pomodoro' ? 'focus' : null,
        flight: {
          kind: plan.kind,
          flightNo: plan.flightNo,
          todoId: plan.todoId,
          from: event.from,
          to: plan.to,
          plannedSeconds: plan.plannedSeconds,
          mystery: plan.mystery,
          legFocusStart: 0,
          legs: [],
        },
      };
    }

    case 'STOP_SESSION':
      return createInitialState();

    case 'PAUSE_SESSION':
      return state.mode === 'focusing' ? toBreak(state, now) : state;

    case 'RESUME_SESSION':
      return state.mode === 'break' ? toFocus(state, now) : state;

    // the plane lands, the leg is logged and a layover starts at the destination
    case 'POMODORO_FOCUS_COMPLETE': {
      if (state.mode !== 'focusing' || !state.flight) return state;
      const pomodoroCount = state.pomodoroCount + 1;
      const isLongBreak = pomodoroCount % (event.settings.longBreakInterval || 4) === 0;
      const next = toBreak(state, now);
      const { flight } = state;
      return {
        ...next,
        pomodoroCount,
        pomodoroPhase: isLongBreak ? 'longBreak' : 'shortBreak',
        flight: {
          ...flight,
          from: flight.to,
          legs: [
            ...flight.legs,
            {
              from: flight.from,
              to: flight.to,
              focusSeconds: next.accumulatedFocus - flight.legFocusStart,
              distanceKm: distanceKm(getAirport(flight.from), getAirport(flight.to)),
            },
          ],
        },
      };
    }

    // boarding again after the layover, on to the next city
    case 'POMODORO_BREAK_COMPLETE': {
      if (state.mode !== 'break' || !state.flight) return state;
      const next = toFocus(state, now);
      return { ...next, flight: { ...state.flight, to: event.nextTo, legFocusStart: next.accumulatedFocus } };
    }

    default:
      return state;
  }
}

export interface DisplayTimes {
  currentFocus: number;
  currentBreak: number;
  maxFocusStreak: number;
  // focus time on the current leg
  legFocus: number;
  // countdown for fixed flights and pomodoro rounds, null when the clock counts up
  remaining: number | null;
  // share of the current leg flown, from 0 to 1
  progress: number;
  speedKmh: number;
  altitudeFt: number;
  phase: 'ground' | 'taxi' | 'climb' | 'cruise' | 'descent';
}

export function getDisplayTimes(state: TimerState, settings: PomodoroSettings = DEFAULT_POMODORO): DisplayTimes {
  const now = Date.now();
  const flight = state.flight;

  if (state.mode === 'idle' || !flight) {
    return { currentFocus: 0, currentBreak: 0, maxFocusStreak: 0, legFocus: 0, remaining: null, progress: 0, speedKmh: 0, altitudeFt: 0, phase: 'ground' };
  }

  const focusing = state.mode === 'focusing';
  const focusElapsed = focusing ? secondsSince(state.focusStartedAt, now) : 0;
  const breakElapsed = focusing ? 0 : secondsSince(state.breakStartedAt, now);
  const currentFocus = state.accumulatedFocus + focusElapsed;
  const legFocus = currentFocus - flight.legFocusStart;
  const onLayover = state.pomodoroPhase === 'shortBreak' || state.pomodoroPhase === 'longBreak';

  const base = {
    currentFocus,
    currentBreak: state.accumulatedBreak + breakElapsed,
    maxFocusStreak: Math.max(state.maxFocusSegment, focusElapsed),
    legFocus,
  };

  if (flight.kind === 'pomodoro' && onLayover) {
    const layover = state.pomodoroPhase === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration;
    return { ...base, remaining: Math.max(0, layover - breakElapsed), progress: 1, speedKmh: 0, altitudeFt: 0, phase: 'ground' };
  }

  const total = flight.kind === 'pomodoro' ? settings.focusDuration : flight.kind === 'fixed' ? flight.plannedSeconds : null;
  const profile = flightProfile(legFocus, total, distanceKm(getAirport(flight.from), getAirport(flight.to)));
  return {
    ...base,
    remaining: total === null ? null : Math.max(0, total - legFocus),
    progress: profile.progress,
    speedKmh: profile.speedKmh,
    altitudeFt: profile.altitudeFt,
    phase: profile.phase,
  };
}
