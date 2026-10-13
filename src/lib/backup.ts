import { Session, Subject, Todo, STORAGE_KEYS } from './types';
import { getSessions, getSubjects, getTodos, saveSession, saveSubject, saveTodo } from './storage';

const BACKUP_VERSION = 1;

interface Backup {
  app: 'PassionIndicator';
  version: number;
  exportedAt: string;
  subjects: Subject[];
  todos: Todo[];
  sessions: Session[];
  settings: Record<string, unknown>;
}

export async function exportBackup(): Promise<void> {
  const [subjects, todos, sessions] = await Promise.all([getSubjects(), getTodos(), getSessions()]);
  const settings: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const raw = localStorage.getItem(key);
    if (raw) settings[key] = JSON.parse(raw);
  }

  const backup: Backup = { app: 'PassionIndicator', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), subjects, todos, sessions, settings };
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `passionindicator-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

const isArrayOf = (value: unknown, keys: string[]) =>
  Array.isArray(value) && value.every(item => item && typeof item === 'object' && keys.every(k => k in item));

// merges a backup into the current data, records with the same id are overwritten
export async function importBackup(file: File): Promise<{ subjects: number; sessions: number }> {
  const data = JSON.parse(await file.text()) as Partial<Backup>;
  if (data.app !== 'PassionIndicator') throw new Error('This file is not a PassionIndicator backup.');
  if (!isArrayOf(data.subjects, ['id', 'name']) || !isArrayOf(data.todos, ['id', 'subjectId']) || !isArrayOf(data.sessions, ['id', 'subjectId', 'startedAt'])) {
    throw new Error('The backup file is damaged.');
  }

  for (const subject of data.subjects!) await saveSubject(subject);
  for (const todo of data.todos!) await saveTodo(todo);
  for (const session of data.sessions!) await saveSession(session);

  const known = new Set<string>(Object.values(STORAGE_KEYS));
  for (const [key, value] of Object.entries(data.settings ?? {})) {
    if (known.has(key)) localStorage.setItem(key, JSON.stringify(value));
  }

  return { subjects: data.subjects!.length, sessions: data.sessions!.length };
}
