import React, { createContext, useContext, useState, useEffect, useReducer, useCallback, useRef } from 'react';

import { Todo, TimerState, PomodoroSettings, AppSettings, BoardingPlan, Leg, FlightKind, getDateKey, setDayStartHour } from '@/lib/types';
import {
  createSubject as dbCreateSubject,
  saveSubject,
  deleteSubject as dbDeleteSubject,
  reorderSubjects,
  getTodos,
  createTodo as dbCreateTodo,
  saveTodo,
  deleteTodo as dbDeleteTodo,
  addTodoFocus,
  createSession,
  deleteSession as dbDeleteSession,
  updateSessionProgress,
  getSessions,
  initializeStorage,
  getPomodoroSettings,
  savePomodoroSettings,
  getAppSettings,
  saveAppSettings,
  getLocation,
  saveLocation,
} from '@/lib/storage';
import { createInitialState, timerReducer, getDisplayTimes, currentSegments, enterFullscreen, exitFullscreen, DisplayTimes } from '@/lib/timerMachine';
import { getSubjectsWithStats, summarizeDay, SubjectWithStats, toSubject } from '@/lib/aggregations';
import { distanceKm, getAirport, interpolate, nearestAirport, randomDestination } from '@/lib/flights';
import { setAmbienceLevel, startAmbience, stopAmbience } from '@/lib/ambience';

const TICK_MS = 250;
const ROLLOVER_CHECK_MS = 60_000;
const PERSIST_MS = 15_000;
const CHIME_SRC =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQwLTq3a6KpZBwd/2smmUAwFcNvJnE8FAnPizplPBAFv59SfUAQBcfLgqFkGAnj/9bVlCQJ5AP/HdQ0DeAH/0H8PA3oC/9aGEAR8A//aiRIEfgP/3YsTBH8E/9+OFASAAv/gjxQEgAL/4I8UBIAC/9+OFAR/BP/djBMEfgP/2okSBHwD/9aGEAN6Av/QfxADeQH/x3UNAnj/9bRkCQJy8+CnWQYBb+fUnlAEAXPiyppQBQJw28mcTwUGf9rIpVIMB0+t2uipWQ0LTKja6KxfEAtAot3fsG0SDjOY4d25dxUQLJXk57+BGBUlj+bswokZFiGJ6O/IjxgXH4Xq8suSGBcdhuvzzZQYFxyE7PTPlBgXHYXr88yTGBcehurzy5IYFx+F6vHJkBgXIYfp78eLGBYjiunswoYYFSSR5ui9fxYTK5bj4bVzFA4ynuHZrWYQCUCj3c+dVgsIS67e0ppLBgRf0cmXSwQCX9nTmU4DAl/h2p1SAwJn7+GmXAUDcf3ytnAJBHkGAMh9DgV7CADU';

// what the landing screen shows once a flight is over
export interface Arrival {
  subjectId: string;
  kind: FlightKind;
  flightNo: string;
  todoId: string | null;
  from: string;
  to: string;
  plannedTo: string;
  arrived: boolean;
  mystery: boolean;
  legs: Leg[];
  focusSeconds: number;
  distanceKm: number;
  maxFocus: number;
}

interface TimerContextType {
  subjects: SubjectWithStats[];
  addSubject: (name: string, color: string) => Promise<void>;
  updateSubject: (id: string, name: string, color: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  moveSubjects: (oldIndex: number, newIndex: number) => Promise<void>;
  todos: Todo[];
  addTodo: (subjectId: string, title: string) => Promise<void>;
  toggleTodo: (todoId: string) => Promise<void>;
  deleteTodo: (todoId: string) => Promise<void>;
  timerState: TimerState;
  displayTimes: DisplayTimes;
  location: string;
  setLocation: (code: string) => void;
  boardingSubjectId: string | null;
  openBoarding: (subjectId: string) => void;
  closeBoarding: () => void;
  startSession: (subjectId: string, plan: BoardingPlan) => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  arrival: Arrival | null;
  dismissArrival: () => void;
  muted: boolean;
  toggleMuted: () => void;
  todayTotalFocus: number;
  todayMaxFocus: number;
  todayStartedAt: number | null;
  todayDistanceKm: number;
  todayKey: string;
  deleteSession: (id: string) => Promise<void>;
  reloadAll: () => Promise<void>;
  dataVersion: number;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  activeSubject: SubjectWithStats | null;
  pomodoroSettings: PomodoroSettings;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function sameTimes(a: DisplayTimes, b: DisplayTimes): boolean {
  return (
    a.currentFocus === b.currentFocus &&
    a.currentBreak === b.currentBreak &&
    a.remaining === b.remaining &&
    a.maxFocusStreak === b.maxFocusStreak &&
    Math.abs(a.progress - b.progress) < 0.0005
  );
}

function loadAppSettings(): AppSettings {
  const settings = getAppSettings();
  setDayStartHour(settings.dayStartHour);
  return settings;
}

// distance flown so far on the current leg, zero while parked on a layover
function liveLegKm(state: TimerState, progress: number): number {
  const flight = state.flight;
  if (!flight || state.pomodoroPhase === 'shortBreak' || state.pomodoroPhase === 'longBreak') return 0;
  return distanceKm(getAirport(flight.from), getAirport(flight.to)) * progress;
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [timerState, dispatch] = useReducer(timerReducer, undefined, createInitialState);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(getPomodoroSettings);
  const [appSettings, setAppSettings] = useState<AppSettings>(loadAppSettings);
  const [location, setLocationState] = useState(() => getLocation() ?? getAppSettings().homeAirport);
  const [boardingSubjectId, setBoardingSubjectId] = useState<string | null>(null);
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [todayKey, setTodayKey] = useState(getDateKey);
  const [todayMaxStored, setTodayMaxStored] = useState(0);
  const [todayStartedStored, setTodayStartedStored] = useState<number | null>(null);
  const [todayKmStored, setTodayKmStored] = useState(0);
  const [muted, setMuted] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [displayTimes, setDisplayTimes] = useState<DisplayTimes>(() => getDisplayTimes(createInitialState()));

  const stateRef = useRef(timerState);
  stateRef.current = timerState;
  const settingsRef = useRef(pomodoroSettings);
  settingsRef.current = pomodoroSettings;
  const appSettingsRef = useRef(appSettings);
  appSettingsRef.current = appSettings;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const finishingRef = useRef(false);

  const refreshSubjects = useCallback(async () => {
    const excludeId = stateRef.current.activeSessionId;
    const [subjectStats, sessions] = await Promise.all([getSubjectsWithStats(excludeId), getSessions()]);
    const key = getDateKey();
    const today = sessions.filter(s => s.id !== excludeId && getDateKey(s.startedAt) === key);
    setSubjects(subjectStats);
    setTodayKey(key);
    const summary = summarizeDay(key, today);
    setTodayMaxStored(summary.maxFocus);
    setTodayStartedStored(summary.startedAt);
    const flownKm = (list: typeof sessions) => list.reduce((acc, s) => acc + (s.flight?.legs.reduce((sum, leg) => sum + leg.distanceKm, 0) ?? 0), 0);
    setTodayKmStored(flownKm(today));
    setDataVersion(v => v + 1);
  }, []);

  const refreshTodos = useCallback(async () => {
    setTodos(await getTodos());
  }, []);

  const persistProgress = useCallback(() => {
    const state = stateRef.current;
    if (!state.activeSessionId || !state.flight) return Promise.resolve();
    const times = getDisplayTimes(state, settingsRef.current);
    const { kind, flightNo, todoId, legs } = state.flight;
    return updateSessionProgress(state.activeSessionId, {
      focusDuration: times.currentFocus,
      breakDuration: times.currentBreak,
      maxFocusStreak: times.maxFocusStreak,
      segments: currentSegments(state),
      flight: { kind, flightNo, todoId, legs },
    });
  }, []);

  // chime and optional desktop notification
  const announce = useCallback((title: string, body: string) => {
    const { sound, notifications } = appSettingsRef.current;
    if (sound) {
      audioRef.current ??= new Audio(CHIME_SRC);
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    if (notifications && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/icon-192.png', silent: true });
      } catch {
        // some browsers only allow notifications from a service worker
      }
    }
  }, []);

  // lands the plane, at the destination when arrived or at the nearest airport when the flight ends early
  const finishSession = useCallback(async (arrived: boolean) => {
    const state = stateRef.current;
    const flight = state.flight;
    if (finishingRef.current || state.mode === 'idle' || !flight || !state.activeSessionId) return;
    finishingRef.current = true;

    try {
      const times = getDisplayTimes(state, settingsRef.current);
      const legs = [...flight.legs];
      const onLayover = state.pomodoroPhase === 'shortBreak' || state.pomodoroPhase === 'longBreak';
      let landedAt = flight.from;

      if (!onLayover && (times.legFocus > 0 || legs.length === 0)) {
        const from = getAirport(flight.from);
        const to = getAirport(flight.to);
        const progress = arrived ? 1 : times.progress;
        const position = interpolate(from, to, progress);
        const landing = progress >= 1 ? to : nearestAirport(position);
        legs.push({ from: from.code, to: landing.code, focusSeconds: times.legFocus, distanceKm: distanceKm(from, position) });
        landedAt = landing.code;
      }

      const { kind, flightNo, todoId } = flight;
      await updateSessionProgress(
        state.activeSessionId,
        {
          focusDuration: times.currentFocus,
          breakDuration: times.currentBreak,
          maxFocusStreak: times.maxFocusStreak,
          segments: currentSegments(state),
          flight: { kind, flightNo, todoId, legs },
        },
        true
      );
      if (todoId && times.currentFocus > 0) await addTodoFocus(todoId, times.currentFocus);

      saveLocation(landedAt);
      setLocationState(landedAt);
      setArrival({
        subjectId: state.activeSubjectId!,
        kind,
        flightNo,
        todoId,
        from: legs[0]?.from ?? flight.from,
        to: landedAt,
        plannedTo: flight.to,
        arrived: arrived || landedAt === flight.to,
        mystery: flight.mystery,
        legs,
        focusSeconds: times.currentFocus,
        distanceKm: legs.reduce((acc, leg) => acc + leg.distanceKm, 0),
        maxFocus: times.maxFocusStreak,
      });

      dispatch({ type: 'STOP_SESSION' });
      stateRef.current = createInitialState();
      if (arrived) announce(`Landed in ${getAirport(landedAt).city}`, 'Your focus flight is complete.');
      await exitFullscreen();
      await Promise.all([refreshSubjects(), refreshTodos()]);
    } finally {
      finishingRef.current = false;
    }
  }, [announce, refreshSubjects, refreshTodos]);

  useEffect(() => {
    initializeStorage().then(() => Promise.all([refreshSubjects(), refreshTodos()]));
  }, [refreshSubjects, refreshTodos]);

  // drives the visible clock, pomodoro legs and arrivals
  useEffect(() => {
    if (timerState.mode === 'idle') {
      setDisplayTimes(getDisplayTimes(timerState, pomodoroSettings));
      return;
    }

    const tick = () => {
      const times = getDisplayTimes(timerState, pomodoroSettings);
      setDisplayTimes(prev => (sameTimes(prev, times) ? prev : times));
      const flight = timerState.flight;
      if (!flight || times.remaining === null || times.remaining > 0) return;

      if (flight.kind === 'fixed' && timerState.mode === 'focusing') {
        finishSession(true);
      } else if (flight.kind === 'pomodoro' && timerState.mode === 'focusing') {
        const longBreak = (timerState.pomodoroCount + 1) % (pomodoroSettings.longBreakInterval || 4) === 0;
        announce(`Landed in ${getAirport(flight.to).city}`, longBreak ? 'Long layover, stretch your legs.' : 'Short layover before the next leg.');
        dispatch({ type: 'POMODORO_FOCUS_COMPLETE', settings: pomodoroSettings });
        exitFullscreen();
      } else if (flight.kind === 'pomodoro' && timerState.pomodoroPhase !== 'focus') {
        announce('Boarding the next leg', 'Back to focus.');
        dispatch({ type: 'POMODORO_BREAK_COMPLETE', nextTo: randomDestination(flight.from, pomodoroSettings.focusDuration).code });
        enterFullscreen();
      }
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [timerState, pomodoroSettings, announce, finishSession]);

  // saves progress so a crash or closed tab loses at most a few seconds
  useEffect(() => {
    if (!timerState.activeSessionId) return;

    const id = setInterval(() => persistProgress(), PERSIST_MS);
    const onPageHide = () => persistProgress();
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearInterval(id);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [timerState.activeSessionId, persistProgress]);

  // picks up a new study day once the day start hour passes
  useEffect(() => {
    const id = setInterval(() => {
      if (getDateKey() !== todayKey) refreshSubjects();
    }, ROLLOVER_CHECK_MS);
    return () => clearInterval(id);
  }, [todayKey, refreshSubjects]);

  // leaving fullscreen or the tab counts as a break
  useEffect(() => {
    const onFullscreenChange = () => {
      dispatch({ type: document.fullscreenElement ? 'FULLSCREEN_ENTER' : 'FULLSCREEN_EXIT' });
    };
    const onVisibilityChange = () => {
      if (document.hidden) dispatch({ type: 'PAUSE_SESSION' });
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const addSubject = useCallback(async (name: string, color: string) => {
    await dbCreateSubject(name, color);
    await refreshSubjects();
  }, [refreshSubjects]);

  const updateSubject = useCallback(async (id: string, name: string, color: string) => {
    const existing = subjects.find(s => s.id === id);
    if (!existing) return;
    await saveSubject({ ...toSubject(existing), name, color });
    await refreshSubjects();
  }, [subjects, refreshSubjects]);

  const deleteSubject = useCallback(async (id: string) => {
    await dbDeleteSubject(id);
    await Promise.all([refreshSubjects(), refreshTodos()]);
  }, [refreshSubjects, refreshTodos]);

  const moveSubjects = useCallback(async (oldIndex: number, newIndex: number) => {
    const updated = [...subjects];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    setSubjects(updated);
    await reorderSubjects(updated.map(toSubject));
  }, [subjects]);

  const addTodo = useCallback(async (subjectId: string, title: string) => {
    await dbCreateTodo(subjectId, title);
    await refreshTodos();
  }, [refreshTodos]);

  const toggleTodo = useCallback(async (todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    await saveTodo({ ...todo, completed: !todo.completed });
    await refreshTodos();
  }, [todos, refreshTodos]);

  const deleteTodo = useCallback(async (todoId: string) => {
    await dbDeleteTodo(todoId);
    await refreshTodos();
  }, [refreshTodos]);

  const deleteSession = useCallback(async (id: string) => {
    await dbDeleteSession(id);
    await refreshSubjects();
  }, [refreshSubjects]);

  const reloadAll = useCallback(async () => {
    setPomodoroSettings(getPomodoroSettings());
    setAppSettings(loadAppSettings());
    setLocationState(getLocation() ?? getAppSettings().homeAirport);
    await Promise.all([refreshSubjects(), refreshTodos()]);
  }, [refreshSubjects, refreshTodos]);

  const setLocation = useCallback((code: string) => {
    saveLocation(code);
    setLocationState(code);
  }, []);

  const openBoarding = useCallback((subjectId: string) => {
    if (stateRef.current.mode !== 'idle') return;
    setArrival(null);
    setBoardingSubjectId(subjectId);
  }, []);

  const closeBoarding = useCallback(() => setBoardingSubjectId(null), []);

  const startSession = useCallback(async (subjectId: string, plan: BoardingPlan) => {
    if (stateRef.current.mode !== 'idle') return;
    // request fullscreen first while the click still counts as a user gesture
    const fullscreen = enterFullscreen();
    const session = await createSession(subjectId);
    setBoardingSubjectId(null);
    setArrival(null);
    setMuted(false);
    // the take off click is the user gesture browsers need before playing sound
    startAmbience(appSettingsRef.current.ambience, appSettingsRef.current.ambienceVolume);
    dispatch({ type: 'START_SESSION', subjectId, sessionId: session.id, from: location, plan });
    await fullscreen;
  }, [location]);

  const stopSession = useCallback(() => finishSession(false), [finishSession]);

  const pauseSession = useCallback(async () => {
    dispatch({ type: 'PAUSE_SESSION' });
    await exitFullscreen();
  }, []);

  // resuming from a layover boards the next leg instead of idling at the gate
  const resumeSession = useCallback(async () => {
    const state = stateRef.current;
    const onLayover = state.pomodoroPhase === 'shortBreak' || state.pomodoroPhase === 'longBreak';
    if (onLayover && state.flight) {
      dispatch({ type: 'POMODORO_BREAK_COMPLETE', nextTo: randomDestination(state.flight.from, settingsRef.current.focusDuration).code });
    } else {
      dispatch({ type: 'RESUME_SESSION' });
    }
    await enterFullscreen();
  }, []);

  const dismissArrival = useCallback(() => setArrival(null), []);

  const toggleMuted = useCallback(() => setMuted(m => !m), []);

  // full level while flying, quieter in a holding pattern or on a layover, silent on the ground
  const flying = timerState.mode !== 'idle';
  const holding = timerState.mode === 'break';
  useEffect(() => {
    if (!flying || appSettings.ambience === 'off') {
      stopAmbience();
      return;
    }
    if (muted) {
      setAmbienceLevel(0);
      return;
    }
    startAmbience(appSettings.ambience, appSettings.ambienceVolume);
    setAmbienceLevel(appSettings.ambienceVolume * (holding ? 0.4 : 1));
  }, [flying, holding, muted, appSettings.ambience, appSettings.ambienceVolume]);

  const updatePomodoroSettings = useCallback((updates: Partial<PomodoroSettings>) => {
    setPomodoroSettings(prev => {
      const next = { ...prev, ...updates };
      savePomodoroSettings(next);
      return next;
    });
  }, []);

  const updateAppSettings = useCallback((updates: Partial<AppSettings>) => {
    setAppSettings(prev => {
      const next = { ...prev, ...updates };
      saveAppSettings(next);
      setDayStartHour(next.dayStartHour);
      return next;
    });
  }, []);

  // a new day start hour moves sessions between days, so recount
  useEffect(() => {
    refreshSubjects();
  }, [appSettings.dayStartHour, refreshSubjects]);

  const todayTotalFocus = subjects.reduce((acc, s) => acc + s.todayTime, 0) + displayTimes.currentFocus;
  const todayMaxFocus = Math.max(todayMaxStored, displayTimes.maxFocusStreak);
  const todayStartedAt = todayStartedStored ?? timerState.sessionStartedAt;
  const liveKm = (timerState.flight?.legs.reduce((acc, leg) => acc + leg.distanceKm, 0) ?? 0) + liveLegKm(timerState, displayTimes.progress);
  const todayDistanceKm = todayKmStored + liveKm;


  const activeSubject = subjects.find(s => s.id === timerState.activeSubjectId) ?? null;

  const contextValue: TimerContextType = {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    moveSubjects,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    timerState,
    displayTimes,
    location,
    setLocation,
    boardingSubjectId,
    openBoarding,
    closeBoarding,
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    arrival,
    dismissArrival,
    muted,
    toggleMuted,
    todayTotalFocus,
    todayMaxFocus,
    todayStartedAt,
    todayDistanceKm,
    todayKey,
    deleteSession,
    reloadAll,
    dataVersion,
    appSettings,
    updateAppSettings,
    activeSubject,
    pomodoroSettings,
    updatePomodoroSettings,
  };

  return <TimerContext.Provider value={contextValue}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};
