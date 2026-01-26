import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from 'react';

import { Todo, TimerState, formatTime, getDateKey } from '@/lib/types';
import {
  createSubject as dbCreateSubject,
  saveSubject,
  deleteSubject as dbDeleteSubject,
  getTodos,
  createTodo as dbCreateTodo,
  saveTodo,
  createSession,
  endSession,
  saveTimerState,
  getTimerState,
  clearTimerState,
  initializeStorage,
  recomputeDailyStats,
} from '@/lib/storage';
import {
  createInitialState,
  timerReducer,
  getDisplayTimes,
  enterFullscreen,
  exitFullscreen,
  isCurrentlyFullscreen,
  getFullscreenChangeEvent,
  DisplayTimes,
} from '@/lib/timerMachine';
import { getSubjectsWithStats, SubjectWithStats } from '@/lib/aggregations';

interface TimerContextType {
  subjects: SubjectWithStats[];
  refreshSubjects: () => Promise<void>;
  addSubject: (name: string, color: string) => Promise<void>;
  updateSubject: (id: string, name: string, color: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  todos: Todo[];
  addTodo: (subjectId: string, title: string) => Promise<void>;
  toggleTodo: (subjectId: string, todoId: string) => Promise<void>;
  timerState: TimerState;
  displayTimes: DisplayTimes;
  isFullscreen: boolean;
  startSession: (subjectId: string) => Promise<void>;
  stopSession: () => Promise<void>;
  switchSubject: (subjectId: string) => void;
  todayTotalFocus: number;
  activeSubject: SubjectWithStats | null;
  formatTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<SubjectWithStats[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timerState, dispatch] = useReducer(timerReducer, createInitialState());
  const [displayTimes, setDisplayTimes] = useState<DisplayTimes>({
    sessionDuration: 0,
    currentFocus: 0,
    currentBreak: 0,
    currentSegment: 0,
  });
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSessionRef = useRef<{ id: string; subjectId: string } | null>(null);

  useEffect(() => {
    async function init() {
      await initializeStorage();
      await refreshSubjects();
      await refreshTodos();
      const savedState = getTimerState();
      if (savedState && savedState.mode !== 'idle') {
        clearTimerState();
      }
      setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (timerState.mode !== 'idle') {
      tickIntervalRef.current = setInterval(() => {
        setDisplayTimes(getDisplayTimes(timerState));
      }, 100);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      setDisplayTimes({
        sessionDuration: 0,
        currentFocus: 0,
        currentBreak: 0,
        currentSegment: 0,
      });
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [timerState.mode, timerState.focusStartedAt, timerState.breakStartedAt]);

  useEffect(() => {
    if (timerState.mode !== 'idle') {
      saveTimerState(timerState);
    }
  }, [timerState]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = isCurrentlyFullscreen();
      if (isFs) {
        dispatch({ type: 'FULLSCREEN_ENTER' });
      } else {
        dispatch({ type: 'FULLSCREEN_EXIT' });
      }
    };

    const eventName = getFullscreenChangeEvent();
    document.addEventListener(eventName, handleFullscreenChange);

    return () => {
      document.removeEventListener(eventName, handleFullscreenChange);
    };
  }, []);

  const refreshSubjects = useCallback(async () => {
    const data = await getSubjectsWithStats();
    setSubjects(data);
  }, []);

  const refreshTodos = useCallback(async () => {
    const data = await getTodos();
    setTodos(data);
  }, []);

  const addSubject = useCallback(async (name: string, color: string) => {
    await dbCreateSubject(name, color);
    await refreshSubjects();
  }, [refreshSubjects]);

  const updateSubject = useCallback(async (id: string, name: string, color: string) => {
    const existing = subjects.find(s => s.id === id);
    if (existing) {
      await saveSubject({ ...existing, name, color });
      await refreshSubjects();
    }
  }, [subjects, refreshSubjects]);

  const deleteSubject = useCallback(async (id: string) => {
    await dbDeleteSubject(id);
    await refreshSubjects();
  }, [refreshSubjects]);

  const addTodo = useCallback(async (subjectId: string, title: string) => {
    await dbCreateTodo(subjectId, title);
    await refreshTodos();
  }, [refreshTodos]);

  const toggleTodo = useCallback(async (_subjectId: string, todoId: string) => {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
      await saveTodo({ ...todo, completed: !todo.completed });
      await refreshTodos();
    }
  }, [todos, refreshTodos]);

  const startSession = useCallback(async (subjectId: string) => {
    const session = await createSession(subjectId);
    pendingSessionRef.current = { id: session.id, subjectId };
    await enterFullscreen();
    dispatch({ type: 'START_SESSION', subjectId });
  }, []);

  const stopSession = useCallback(async () => {
    const finalTimes = getDisplayTimes(timerState);
    dispatch({ type: 'STOP_SESSION' });

    if (pendingSessionRef.current) {
      await endSession(
        pendingSessionRef.current.id,
        finalTimes.currentFocus,
        finalTimes.currentBreak
      );
      await recomputeDailyStats(getDateKey());
      pendingSessionRef.current = null;
    }

    clearTimerState();
    await exitFullscreen();
    await refreshSubjects();
  }, [timerState, refreshSubjects]);

  const switchSubject = useCallback((subjectId: string) => {
    if (pendingSessionRef.current) {
      pendingSessionRef.current.subjectId = subjectId;
    }
    dispatch({ type: 'SWITCH_SUBJECT', subjectId });
  }, []);

  const todayTotalFocus = subjects.reduce((acc, s) => acc + s.todayTime, 0);

  const activeSubject = timerState.activeSubjectId
    ? subjects.find(s => s.id === timerState.activeSubjectId) || null
    : null;

  const contextValue: TimerContextType = {
    subjects,
    refreshSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    todos,
    addTodo,
    toggleTodo,
    timerState,
    displayTimes,
    isFullscreen: timerState.isFullscreen,
    startSession,
    stopSession,
    switchSubject,
    todayTotalFocus,
    activeSubject,
    formatTime,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-bg flex items-center justify-center">
        <div className="text-neutral-muted">Loading...</div>
      </div>
    );
  }

  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
};
