import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// --- Types ---
export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type Subject = {
  id: string;
  name: string;
  color: string;
  totalTimeToday: number; // in seconds
  todos: Todo[];
};

interface TimerContextType {
  subjects: Subject[];
  activeSubjectId: string | null;
  todayTotalTime: number; // in seconds
  startTimer: (subjectId: string) => void;
  stopTimer: () => void;
  addSubject: (name: string, color: string) => void;
  updateSubject: (id: string, name: string, color: string) => void;
  deleteSubject: (id: string) => void;
  addTodo: (subjectId: string, title: string) => void;
  toggleTodo: (subjectId: string, todoId: string) => void;
  formatTime: (seconds: number) => string;
}

// --- Utils ---


// --- Mock Initial Data ---
const INITIAL_SUBJECTS: Subject[] = [
  { id: '1', name: 'Math', color: 'bg-subject-math text-white', totalTimeToday: 3600, todos: [] },
  { id: '2', name: 'Science', color: 'bg-subject-science text-white', totalTimeToday: 1800, todos: [] },
  { id: '3', name: 'History', color: 'bg-subject-history text-neutral-surface', totalTimeToday: 0, todos: [] },
];

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Create a ref to track the start time of the current session
  const lastTickRef = useRef<number | null>(null);

  // Computed total
  const todayTotalTime = subjects.reduce((acc, sub) => acc + sub.totalTimeToday, 0);

  // Timer Ticker
  useEffect(() => {
    let interval: any;

    if (activeSubjectId) {
      lastTickRef.current = Date.now();

      interval = setInterval(() => {
        const now = Date.now();
        const deltaSeconds = Math.floor((now - (lastTickRef.current || now)) / 1000);

        if (deltaSeconds >= 1) {
             setSubjects(prev => prev.map(sub => {
                if (sub.id === activeSubjectId) {
                    return { ...sub, totalTimeToday: sub.totalTimeToday + deltaSeconds }; // Simple add for now
                }
                return sub;
             }));
             lastTickRef.current = now;
        }
      }, 1000);
    } else {
        lastTickRef.current = null;
    }

    return () => clearInterval(interval);
  }, [activeSubjectId]);


  const startTimer = (subjectId: string) => {
    // If another subject is running, stop it first (though UI might prevent this)
    if (activeSubjectId && activeSubjectId !== subjectId) {
        stopTimer();
    }
    setActiveSubjectId(subjectId);
  };

  const stopTimer = () => {
    setActiveSubjectId(null);
  };

  const addSubject = (name: string, color: string) => {
    const newSubject: Subject = {
        id: crypto.randomUUID(),
        name,
        color, // expected class string e.g. "bg-blue-500 text-white"
        totalTimeToday: 0,
        todos: []
    };
    setSubjects([...subjects, newSubject]);
  };

  const updateSubject = (id: string, name: string, color: string) => {
      setSubjects(prev => prev.map(s => s.id === id ? { ...s, name, color } : s));
  };

  const deleteSubject = (id: string) => {
      setSubjects(prev => prev.filter(s => s.id !== id));
  };

  const addTodo = (subjectId: string, title: string) => {
      setSubjects(prev => prev.map(sub => {
          if (sub.id === subjectId) {
              return {
                  ...sub,
                  todos: [...sub.todos, { id: crypto.randomUUID(), title, completed: false }]
              };
          }
          return sub;
      }));
  };

  const toggleTodo = (subjectId: string, todoId: string) => {
      setSubjects(prev => prev.map(sub => {
          if (sub.id === subjectId) {
              return {
                  ...sub,
                  todos: sub.todos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t)
              };
          }
          return sub;
      }));
  };

  const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{
        subjects,
        activeSubjectId,
        deleteSubject,
        todayTotalTime,
        startTimer,
        stopTimer,
        addSubject,
        updateSubject,
        addTodo,
        toggleTodo,
        formatTime
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (!context) throw new Error("useTimer must be used within TimerProvider");
    return context;
};
