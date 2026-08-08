import {
  Subject,
  Todo,
  Session,
  DailyStats,
  TimerState,
  PomodoroSettings,
  DEFAULT_POMODORO,
  AppSettings,
  DEFAULT_APP_SETTINGS,
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

      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.TODOS)) {
        const todoStore = db.createObjectStore(STORES.TODOS, { keyPath: 'id' });
        todoStore.createIndex('subjectId', 'subjectId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, {
          keyPath: 'id',
        });
        sessionStore.createIndex('subjectId', 'subjectId', {
          unique: false,
        });
        sessionStore.createIndex('startedAt', 'startedAt', {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains(STORES.DAILY_STATS)) {
        db.createObjectStore(STORES.DAILY_STATS, {
          keyPath: 'date',
        });
      }
    };
  });

  return dbInitPromise;
}

async function idbGet<T>(
  storeName: string,
  key: string
): Promise<T | undefined> {
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

async function idbPut<T>(
  storeName: string,
  value: T
): Promise<void> {
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
    const existing = localStorage.getItem(storeName);
    const arr: T[] = existing ? JSON.parse(existing) : [];

    const index = arr.findIndex(
      (item: any) => item.id === (value as any).id
    );

    if (index >= 0) {
      arr[index] = value;
    } else {
      arr.push(value);
    }

    localStorage.setItem(storeName, JSON.stringify(arr));
  }
}

async function idbDelete(
  storeName: string,
  key: string
): Promise<void> {
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
      const arr = JSON.parse(existing).filter(
        (item: any) => item.id !== key
      );

      localStorage.setItem(storeName, JSON.stringify(arr));
    }
  }
}


export async function getSubjects(): Promise<Subject[]> {
  const subjects = await idbGetAll<Subject>(STORES.SUBJECTS);

  return subjects.sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
}


export async function getSubject(
  id: string
): Promise<Subject | undefined> {
  return idbGet<Subject>(STORES.SUBJECTS, id);
}


export async function saveSubject(
  subject: Subject
): Promise<void> {
  await idbPut(STORES.SUBJECTS, subject);
}


export async function deleteSubject(
  id: string
): Promise<void> {
  await idbDelete(STORES.SUBJECTS, id);
}


export async function createSubject(
  name: string,
  color: string
): Promise<Subject> {

  const existing = await getSubjects();

  const subject: Subject = {
    id: generateId(),
    name,
    color,
    order: existing.length,
    createdAt: Date.now(),
  };

  await saveSubject(subject);

  return subject;
}


export async function reorderSubjects(
  subjects: Subject[]
): Promise<void> {

  for (let i = 0; i < subjects.length; i++) {
    await saveSubject({
      ...subjects[i],
      order: i,
    });
  }
}


export async function getTodos(): Promise<Todo[]> {
  return idbGetAll<Todo>(STORES.TODOS);
}


export async function getTodosBySubject(
  subjectId: string
): Promise<Todo[]> {
  const todos = await getTodos();

  return todos.filter(
    todo => todo.subjectId === subjectId
  );
}


export async function saveTodo(
  todo: Todo
): Promise<void> {
  await idbPut(STORES.TODOS, todo);
}


export async function deleteTodo(
  id: string
): Promise<void> {
  await idbDelete(STORES.TODOS, id);
}


export async function createTodo(
  subjectId: string,
  title: string
): Promise<Todo> {

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


export async function getSession(
  id: string
): Promise<Session | undefined> {
  return idbGet<Session>(STORES.SESSIONS, id);
}


export async function saveSession(
  session: Session
): Promise<void> {
  await idbPut(STORES.SESSIONS, session);
}


export async function createSession(
  subjectId: string
): Promise<Session> {

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


export async function getSessionsByDate(
  date: string
): Promise<Session[]> {

  const all = await getSessions();

  const start = new Date(date).setHours(0, 0, 0, 0);
  const end = new Date(date).setHours(23, 59, 59, 999);

  return all.filter(
    s => s.startedAt >= start && s.startedAt <= end
  );
}


export async function getSessionsInRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {

  const all = await getSessions();

  const start = new Date(startDate).setHours(0,0,0,0);
  const end = new Date(endDate).setHours(23,59,59,999);

  return all.filter(
    s => s.startedAt >= start && s.startedAt <= end
  );
}


export async function getDailyStats(
  date: string
): Promise<DailyStats | undefined> {
  return idbGet<DailyStats>(
    STORES.DAILY_STATS,
    date
  );
}


export async function saveDailyStats(
  stats: DailyStats
): Promise<void> {
  await idbPut(
    STORES.DAILY_STATS,
    stats
  );
}


export async function getAllDailyStats(): Promise<DailyStats[]> {
  return idbGetAll<DailyStats>(
    STORES.DAILY_STATS
  );
}


export async function recomputeDailyStats(
  date: string
): Promise<DailyStats> {

  const sessions = await getSessionsByDate(date);

  let totalFocusTime = 0;
  let totalBreakTime = 0;
  let maxFocusStreak = 0;

  const subjectBreakdown: Record<string, number> = {};

  let firstSessionAt: number | null = null;
  let lastSessionAt: number | null = null;


  for (const session of sessions) {

    totalFocusTime += session.focusDuration;
    totalBreakTime += session.breakDuration;

    maxFocusStreak = Math.max(
      maxFocusStreak,
      session.focusDuration
    );

    firstSessionAt =
      firstSessionAt === null
        ? session.startedAt
        : Math.min(firstSessionAt, session.startedAt);


    lastSessionAt =
      session.endedAt ?? session.startedAt;


    subjectBreakdown[session.subjectId] =
      (subjectBreakdown[session.subjectId] || 0)
      + session.focusDuration;
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


export function saveTimerState(
  state: TimerState
): void {
  localStorage.setItem(
    STORAGE_KEYS.ACTIVE_STATE,
    JSON.stringify(state)
  );
}


export function getTimerState(): TimerState | null {
  const data = localStorage.getItem(
    STORAGE_KEYS.ACTIVE_STATE
  );

  return data ? JSON.parse(data) : null;
}


export function clearTimerState(): void {
  localStorage.removeItem(
    STORAGE_KEYS.ACTIVE_STATE
  );
}


export function getPomodoroSettings(): PomodoroSettings {

  const data = localStorage.getItem(
    STORAGE_KEYS.POMODORO_SETTINGS
  );

  return data
    ? { ...DEFAULT_POMODORO, ...JSON.parse(data) }
    : DEFAULT_POMODORO;
}


export function savePomodoroSettings(
  settings: PomodoroSettings
): void {
  localStorage.setItem(
    STORAGE_KEYS.POMODORO_SETTINGS,
    JSON.stringify(settings)
  );
}


export function getAppSettings(): AppSettings {

  const data = localStorage.getItem(
    STORAGE_KEYS.APP_SETTINGS
  );

  return data
    ? { ...DEFAULT_APP_SETTINGS, ...JSON.parse(data) }
    : DEFAULT_APP_SETTINGS;
}


export function saveAppSettings(
  settings: AppSettings
): void {
  localStorage.setItem(
    STORAGE_KEYS.APP_SETTINGS,
    JSON.stringify(settings)
  );
}


const DEFAULT_SUBJECTS = [
  {
    name: 'Math',
    color: 'bg-subject-math',
  },
  {
    name: 'Science',
    color: 'bg-subject-science',
  },
  {
    name: 'English',
    color: 'bg-subject-english',
  },
];


export async function initializeStorage(): Promise<void> {

  const subjects = await getSubjects();

  if (subjects.length === 0) {

    for (const subject of DEFAULT_SUBJECTS) {
      await createSubject(
        subject.name,
        subject.color
      );
    }

  }
}
