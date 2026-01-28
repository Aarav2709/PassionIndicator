import {
  Subject,
  Todo,
  Session,
  DailyStats,
  TimerState,
  PomodoroSettings,
  DEFAULT_POMODORO,
  DB_NAME,
  DB_VERSION,
  STORES,
  STORAGE_KEYS,
  generateId,
} from './types';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('IndexedDB failed, falling back to LocalStorage');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Subjects store
      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' });
      }

      // Todos store
      if (!db.objectStoreNames.contains(STORES.TODOS)) {
        const todoStore = db.createObjectStore(STORES.TODOS, { keyPath: 'id' });
        todoStore.createIndex('subjectId', 'subjectId', { unique: false });
      }

      // Sessions store
      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('subjectId', 'subjectId', { unique: false });
        sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      }

      // Daily stats store
      if (!db.objectStoreNames.contains(STORES.DAILY_STATS)) {
        db.createObjectStore(STORES.DAILY_STATS, { keyPath: 'date' });
      }
    };
  });

  return dbInitPromise;
}

// --- Generic IndexedDB helpers ---
async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback to LocalStorage
    const data = localStorage.getItem(`${storeName}_${key}`);
    return data ? JSON.parse(data) : undefined;
  }
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    const data = localStorage.getItem(storeName);
    return data ? JSON.parse(data) : [];
  }
}

async function idbPut<T>(storeName: string, value: T, key?: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(value);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Fallback: update LocalStorage array
    const existing = localStorage.getItem(storeName);
    const arr: T[] = existing ? JSON.parse(existing) : [];
    const keyField = key || 'id';
    const idx = arr.findIndex((item: any) => item[keyField] === (value as any)[keyField]);
    if (idx >= 0) {
      arr[idx] = value;
    } else {
      arr.push(value);
    }
    localStorage.setItem(storeName, JSON.stringify(arr));
  }
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    const existing = localStorage.getItem(storeName);
    if (existing) {
      const arr = JSON.parse(existing).filter((item: any) => item.id !== key);
      localStorage.setItem(storeName, JSON.stringify(arr));
    }
  }
}

export async function getSubjects(): Promise<Subject[]> {
  return idbGetAll<Subject>(STORES.SUBJECTS);
}

export async function getSubject(id: string): Promise<Subject | undefined> {
  return idbGet<Subject>(STORES.SUBJECTS, id);
}

export async function saveSubject(subject: Subject): Promise<void> {
  await idbPut(STORES.SUBJECTS, subject);
}

export async function deleteSubject(id: string): Promise<void> {
  await idbDelete(STORES.SUBJECTS, id);
}

export async function createSubject(name: string, color: string): Promise<Subject> {
  const subject: Subject = {
    id: generateId(),
    name,
    color,
    createdAt: Date.now(),
  };
  await saveSubject(subject);
  return subject;
}

export async function getTodos(): Promise<Todo[]> {
  return idbGetAll<Todo>(STORES.TODOS);
}

export async function getTodosBySubject(subjectId: string): Promise<Todo[]> {
  const all = await getTodos();
  return all.filter(t => t.subjectId === subjectId);
}

export async function saveTodo(todo: Todo): Promise<void> {
  await idbPut(STORES.TODOS, todo);
}

export async function deleteTodo(id: string): Promise<void> {
  await idbDelete(STORES.TODOS, id);
}

export async function createTodo(subjectId: string, title: string): Promise<Todo> {
  const todo: Todo = {
    id: generateId(),
    subjectId,
    title,
    completed: false,
    createdAt: Date.now(),
  };
  await saveTodo(todo);
  return todo;
}

export async function getSessions(): Promise<Session[]> {
  return idbGetAll<Session>(STORES.SESSIONS);
}

export async function getSession(id: string): Promise<Session | undefined> {
  return idbGet<Session>(STORES.SESSIONS, id);
}

export async function saveSession(session: Session): Promise<void> {
  await idbPut(STORES.SESSIONS, session);
}

export async function createSession(subjectId: string): Promise<Session> {
  const session: Session = {
    id: generateId(),
    subjectId,
    startedAt: Date.now(),
    endedAt: null,
    focusDuration: 0,
    breakDuration: 0,
  };
  await saveSession(session);
  return session;
}

export async function endSession(
  sessionId: string,
  focusDuration: number,
  breakDuration: number
): Promise<Session | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  session.endedAt = Date.now();
  session.focusDuration = focusDuration;
  session.breakDuration = breakDuration;
  await saveSession(session);
  return session;
}

export async function getSessionsByDate(date: string): Promise<Session[]> {
  const all = await getSessions();
  const dayStart = new Date(date).setHours(0, 0, 0, 0);
  const dayEnd = new Date(date).setHours(23, 59, 59, 999);
  return all.filter(s => s.startedAt >= dayStart && s.startedAt <= dayEnd);
}

export async function getSessionsInRange(startDate: string, endDate: string): Promise<Session[]> {
  const all = await getSessions();
  const start = new Date(startDate).setHours(0, 0, 0, 0);
  const end = new Date(endDate).setHours(23, 59, 59, 999);
  return all.filter(s => s.startedAt >= start && s.startedAt <= end);
}

export async function getDailyStats(date: string): Promise<DailyStats | undefined> {
  return idbGet<DailyStats>(STORES.DAILY_STATS, date);
}

export async function saveDailyStats(stats: DailyStats): Promise<void> {
  await idbPut(STORES.DAILY_STATS, stats, 'date');
}

export async function getAllDailyStats(): Promise<DailyStats[]> {
  return idbGetAll<DailyStats>(STORES.DAILY_STATS);
}

// Recompute daily stats from sessions
export async function recomputeDailyStats(date: string): Promise<DailyStats> {
  const sessions = await getSessionsByDate(date);

  let totalFocusTime = 0;
  let totalBreakTime = 0;
  let maxFocusStreak = 0;
  let firstSessionAt: number | null = null;
  let lastSessionAt: number | null = null;
  const subjectBreakdown: Record<string, number> = {};

  for (const session of sessions) {
    totalFocusTime += session.focusDuration;
    totalBreakTime += session.breakDuration;

    if (session.focusDuration > maxFocusStreak) {
      maxFocusStreak = session.focusDuration;
    }

    if (!firstSessionAt || session.startedAt < firstSessionAt) {
      firstSessionAt = session.startedAt;
    }
    if (!lastSessionAt || (session.endedAt && session.endedAt > lastSessionAt)) {
      lastSessionAt = session.endedAt || session.startedAt;
    }

    subjectBreakdown[session.subjectId] =
      (subjectBreakdown[session.subjectId] || 0) + session.focusDuration;
  }

  const stats: DailyStats = {
    date,
    totalFocusTime,
    totalBreakTime,
    sessionCount: sessions.length,
    maxFocusStreak,
    subjectBreakdown,
    firstSessionAt,
    lastSessionAt,
  };

  await saveDailyStats(stats);
  return stats;
}

export function saveTimerState(state: TimerState): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_STATE, JSON.stringify(state));
}

export function getTimerState(): TimerState | null {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_STATE);
  return data ? JSON.parse(data) : null;
}

export function clearTimerState(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STATE);
}

export function getPomodoroSettings(): PomodoroSettings {
  const data = localStorage.getItem(STORAGE_KEYS.POMODORO_SETTINGS);
  return data ? { ...DEFAULT_POMODORO, ...JSON.parse(data) } : DEFAULT_POMODORO;
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  localStorage.setItem(STORAGE_KEYS.POMODORO_SETTINGS, JSON.stringify(settings));
}

const DEFAULT_SUBJECTS: Omit<Subject, 'id' | 'createdAt'>[] = [
  { name: 'Math', color: 'bg-subject-math' },
  { name: 'Science', color: 'bg-subject-science' },
  { name: 'History', color: 'bg-subject-history' },
];

export async function initializeStorage(): Promise<void> {
  const subjects = await getSubjects();
  if (subjects.length === 0) {
    for (const sub of DEFAULT_SUBJECTS) {
      await createSubject(sub.name, sub.color);
    }
  }
}
