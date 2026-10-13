import { Subject } from '@/lib/types';

export interface SubjectInfo {
  name: string;
  color: string;
}

const DELETED: SubjectInfo = { name: 'Deleted subject', color: 'bg-neutral-600' };

export function makeSubjectLookup(subjects: Subject[]) {
  const map = new Map(subjects.map(s => [s.id, { name: s.name, color: s.color }]));
  const order = new Map(subjects.map((s, i) => [s.id, i]));
  return {
    get: (id: string): SubjectInfo => map.get(id) ?? DELETED,
    // keeps stacks in the same order as the home list so colors never shuffle
    order: (id: string) => order.get(id) ?? Number.MAX_SAFE_INTEGER,
  };
}

export type SubjectLookup = ReturnType<typeof makeSubjectLookup>;
