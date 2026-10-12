import {
  Subject,
  Todo,
  Session,
  TimerState,
  PomodoroSettings,
  DEFAULT_POMODORO,
  DB_NAME,
  DB_VERSION,
  STORES,
  STORAGE_KEYS,
  generateId,
} from './types';

type StoreName = (typeof STORES)[keyof typeof STORES];

let dbInitPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.warn('indexeddb failed, falling back to localstorage');
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.SUBJECTS)) {
        db.createObjectStore(STORES.SUBJECTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.TODOS)) {
        const todoStore = db.createObjectStore(STORES.TODOS, { keyPath: 'id' });
        todoStore.createIndex('subjectId', 'subjectId', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
        sessionStore.createIndex('subjectId', 'subjectId', { unique: false });
        sessionStore.createIndex('startedAt', 'startedAt', { unique: false });
      }
    };
  });

  return dbInitPromise;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('failed to write to localstorage', error);
  }
}

function idbRequest<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  return getDB().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(storeName, mode).objectStore(storeName));
        request.onsuccess = () => resolve(request.result as T);
        request.onerror = () => reject(request.error);
      })
  );
}

async function idbGet<T extends { id: string }>(storeName: StoreName, key: string): Promise<T | undefined> {
  try {
    return await idbRequest<T | undefined>(storeName, 'readonly', store => store.get(key));
  } catch {
    return readJSON<T[]>(storeName, []).find(item => item.id === key);
  }
}

async function idbGetAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    return (await idbRequest<T[]>(storeName, 'readonly', store => store.getAll())) ?? [];
  } catch {
    return readJSON<T[]>(storeName, []);
  }
}

async function idbPut<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
  try {
    await idbRequest(storeName, 'readwrite', store => store.put(value));
  } catch {
    const arr = readJSON<T[]>(storeName, []);
    const index = arr.findIndex(item => item.id === value.id);
    if (index >= 0) arr[index] = value;
    else arr.push(value);
    writeJSON(storeName, arr);
  }
}

async function idbDelete<T extends { id: string }>(storeName: StoreName, key: string): Promise<void> {
  try {
    await idbRequest(storeName, 'readwrite', store => store.delete(key));
  } catch {
    writeJSON(storeName, readJSON<T[]>(storeName, []).filter(item => item.id !== key));
  }
}

export async function getSubjects(): Promise<Subject[]> {
  const subjects = await idbGetAll<Subject>(STORES.SUBJECTS);
  return subjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveSubject(subject: Subject): Promise<void> {
  await idbPut(STORES.SUBJECTS, subject);
}

export async function deleteSubject(id: string): Promise<void> {
  const todos = await getTodos();
  await Promise.all(todos.filter(t => t.subjectId === id).map(t => deleteTodo(t.id)));
  await idbDelete<Subject>(STORES.SUBJECTS, id);
}

export async function createSubject(name: string, color: string): Promise<Subject> {
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

export async function reorderSubjects(subjects: Subject[]): Promise<void> {
  await Promise.all(subjects.map((subject, i) => saveSubject({ ...subject, order: i })));
}

export async function getTodos(): Promise<Todo[]> {
  const todos = await idbGetAll<Todo>(STORES.TODOS);
  return todos.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveTodo(todo: Todo): Promise<void> {
  await idbPut(STORES.TODOS, todo);
}

export async function deleteTodo(id: string): Promise<void> {
  await idbDelete<Todo>(STORES.TODOS, id);
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

// writes progress for a running session, pass ended to close it
export async function updateSessionProgress(
  sessionId: string,
  focusDuration: number,
  breakDuration: number,
  ended = false
): Promise<void> {
  const session = await idbGet<Session>(STORES.SESSIONS, sessionId);
  if (!session) return;
  await saveSession({
    ...session,
    focusDuration,
    breakDuration,
    endedAt: ended ? Date.now() : session.endedAt,
  });
}

export function saveTimerState(state: TimerState): void {
  writeJSON(STORAGE_KEYS.ACTIVE_STATE, state);
}

export function getTimerState(): TimerState | null {
  return readJSON<TimerState | null>(STORAGE_KEYS.ACTIVE_STATE, null);
}

export function clearTimerState(): void {
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_STATE);
}

export function getPomodoroSettings(): PomodoroSettings {
  return { ...DEFAULT_POMODORO, ...readJSON<Partial<PomodoroSettings>>(STORAGE_KEYS.POMODORO_SETTINGS, {}) };
}

export function savePomodoroSettings(settings: PomodoroSettings): void {
  writeJSON(STORAGE_KEYS.POMODORO_SETTINGS, settings);
}

const DEFAULT_SUBJECTS = [
  { name: 'Math', color: 'bg-subject-math' },
  { name: 'Science', color: 'bg-subject-science' },
  { name: 'English', color: 'bg-subject-english' },
];

let initPromise: Promise<void> | null = null;

// memoized so strict mode running effects twice cannot seed the defaults twice
export function initializeStorage(): Promise<void> {
  initPromise ??= (async () => {
    const subjects = await getSubjects();
    if (subjects.length > 0) return;
    for (const subject of DEFAULT_SUBJECTS) {
      await createSubject(subject.name, subject.color);
    }
  })();
  return initPromise;
}
