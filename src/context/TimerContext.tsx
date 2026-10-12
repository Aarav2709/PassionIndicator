import React, { createContext, useContext, useState, useEffect, useReducer, useCallback, useRef } from 'react';

import { Todo, TimerState, PomodoroSettings } from '@/lib/types';
import {
  createSubject as dbCreateSubject,
  saveSubject,
  deleteSubject as dbDeleteSubject,
  reorderSubjects,
  getTodos,
  createTodo as dbCreateTodo,
  saveTodo,
  deleteTodo as dbDeleteTodo,
  createSession,
  updateSessionProgress,
  initializeStorage,
  getPomodoroSettings,
  savePomodoroSettings,
} from '@/lib/storage';
import { createInitialState, timerReducer, getDisplayTimes, enterFullscreen, exitFullscreen, DisplayTimes } from '@/lib/timerMachine';
import { getSubjectsWithStats, SubjectWithStats, toSubject } from '@/lib/aggregations';

const TICK_MS = 250;
const PERSIST_MS = 15_000;
const CHIME_SRC =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQwLTq3a6KpZBwd/2smmUAwFcNvJnE8FAnPizplPBAFv59SfUAQBcfLgqFkGAnj/9bVlCQJ5AP/HdQ0DeAH/0H8PA3oC/9aGEAR8A//aiRIEfgP/3YsTBH8E/9+OFASAAv/gjxQEgAL/4I8UBIAC/9+OFAR/BP/djBMEfgP/2okSBHwD/9aGEAN6Av/QfxADeQH/x3UNAnj/9bRkCQJy8+CnWQYBb+fUnlAEAXPiyppQBQJw28mcTwUGf9rIpVIMB0+t2uipWQ0LTKja6KxfEAtAot3fsG0SDjOY4d25dxUQLJXk57+BGBUlj+bswokZFiGJ6O/IjxgXH4Xq8suSGBcdhuvzzZQYFxyE7PTPlBgXHYXr88yTGBcehurzy5IYFx+F6vHJkBgXIYfp78eLGBYjiunswoYYFSSR5ui9fxYTK5bj4bVzFA4ynuHZrWYQCUCj3c+dVgsIS67e0ppLBgRf0cmXSwQCX9nTmU4DAl/h2p1SAwJn7+GmXAUDcf3ytnAJBHkGAMh9DgV7CADU';

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
  startSession: (subjectId: string) => Promise<void>;
  stopSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  todayTotalFocus: number;
  activeSubject: SubjectWithStats | null;
  pomodoroSettings: PomodoroSettings;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

function sameTimes(a: DisplayTimes, b: DisplayTimes): boolean {
  return a.currentFocus === b.currentFocus && a.currentBreak === b.currentBreak && a.pomodoroRemaining === b.pomodoroRemaining;
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [timerState, dispatch] = useReducer(timerReducer, undefined, createInitialState);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>(getPomodoroSettings);
  const [displayTimes, setDisplayTimes] = useState<DisplayTimes>(() => getDisplayTimes(createInitialState(), getPomodoroSettings()));

  const stateRef = useRef(timerState);
  stateRef.current = timerState;
  const settingsRef = useRef(pomodoroSettings);
  settingsRef.current = pomodoroSettings;
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const refreshSubjects = useCallback(async () => {
    setSubjects(await getSubjectsWithStats(stateRef.current.activeSessionId));
  }, []);

  const refreshTodos = useCallback(async () => {
    setTodos(await getTodos());
  }, []);

  const persistProgress = useCallback((ended = false) => {
    const state = stateRef.current;
    if (!state.activeSessionId) return Promise.resolve();
    const times = getDisplayTimes(state, settingsRef.current);
    return updateSessionProgress(state.activeSessionId, times.currentFocus, times.currentBreak, ended);
  }, []);

  const playChime = useCallback(() => {
    audioRef.current ??= new Audio(CHIME_SRC);
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  useEffect(() => {
    initializeStorage().then(() => Promise.all([refreshSubjects(), refreshTodos()]));
  }, [refreshSubjects, refreshTodos]);

  // drives the visible clock and pomodoro transitions
  useEffect(() => {
    if (timerState.mode === 'idle') {
      setDisplayTimes(getDisplayTimes(timerState, pomodoroSettings));
      return;
    }

    const tick = () => {
      const times = getDisplayTimes(timerState, pomodoroSettings);
      setDisplayTimes(prev => (sameTimes(prev, times) ? prev : times));

      if (!pomodoroSettings.enabled || times.pomodoroRemaining > 0) return;

      if (timerState.mode === 'focusing') {
        playChime();
        dispatch({ type: 'POMODORO_FOCUS_COMPLETE', settings: pomodoroSettings });
        exitFullscreen();
      } else if (timerState.pomodoroPhase !== 'focus') {
        playChime();
        dispatch({ type: 'POMODORO_BREAK_COMPLETE' });
        enterFullscreen();
      }
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [timerState, pomodoroSettings, playChime]);

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

  const startSession = useCallback(async (subjectId: string) => {
    if (stateRef.current.mode !== 'idle') return;
    // request fullscreen first while the click still counts as a user gesture
    const fullscreen = enterFullscreen();
    const session = await createSession(subjectId);
    dispatch({ type: 'START_SESSION', subjectId, sessionId: session.id });
    await fullscreen;
  }, []);

  const stopSession = useCallback(async () => {
    await persistProgress(true);
    dispatch({ type: 'STOP_SESSION' });
    stateRef.current = createInitialState();
    await exitFullscreen();
    await refreshSubjects();
  }, [persistProgress, refreshSubjects]);

  const pauseSession = useCallback(async () => {
    dispatch({ type: 'PAUSE_SESSION' });
    await exitFullscreen();
  }, []);

  const resumeSession = useCallback(async () => {
    dispatch({ type: 'RESUME_SESSION' });
    await enterFullscreen();
  }, []);

  const updatePomodoroSettings = useCallback((updates: Partial<PomodoroSettings>) => {
    setPomodoroSettings(prev => {
      const next = { ...prev, ...updates };
      savePomodoroSettings(next);
      return next;
    });
  }, []);

  const todayTotalFocus = subjects.reduce((acc, s) => acc + s.todayTime, 0) + displayTimes.currentFocus;

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
    startSession,
    stopSession,
    pauseSession,
    resumeSession,
    todayTotalFocus,
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
