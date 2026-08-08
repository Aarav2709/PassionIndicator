import { useState } from 'react';
import SubjectItem from '../components/Dashboard/SubjectItem';
import { useTimer } from '@/context/TimerContext';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const SUBJECT_COLORS = [
  { value: 'bg-subject-math', label: 'Orange' },
  { value: 'bg-subject-science', label: 'Gold' },
  { value: 'bg-subject-history', label: 'Sand' },
  { value: 'bg-subject-english', label: 'Blue' },
  { value: 'bg-emerald-500', label: 'Green' },
  { value: 'bg-rose-500', label: 'Rose' },
  { value: 'bg-violet-500', label: 'Violet' },
  { value: 'bg-cyan-500', label: 'Cyan' },
] as const;

const Dashboard = () => {
  const {
    subjects,
    todayTotalFocus,
    pomodoroSettings,
    updatePomodoroSettings,
    formatTime,
    addSubject,
    moveSubjects,
  } = useTimer();

  const [newSubject, setNewSubject] = useState('');

  const pickRandomColor = () =>
    SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)].value;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (newSubject.trim()) {
      addSubject(newSubject.trim(), pickRandomColor());
      setNewSubject('');
    }
  };

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">

      <section className="rounded-[2rem] border border-[#1a1a1a] bg-[#080808] px-6 py-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:px-10 sm:py-10">
        <h2 className="text-sm text-neutral-500">
          {todayLabel}
        </h2>

        <div className="mt-8 text-[clamp(4rem,12vw,7.5rem)] font-medium leading-none text-white">
          {formatTime(todayTotalFocus)}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <span className="mr-3 text-xs uppercase tracking-[0.22em] text-neutral-500">
            Pomodoro
          </span>

          <button
            type="button"
            onClick={() =>
              updatePomodoroSettings({
                enabled: !pomodoroSettings.enabled,
              })
            }
            aria-pressed={pomodoroSettings.enabled}
            aria-label="Pomodoro mode"
            className={
              pomodoroSettings.enabled
                ? 'relative h-8 w-14 rounded-full border border-emerald-400/20 bg-emerald-400/15 transition-all duration-300 ease-out'
                : 'relative h-8 w-14 rounded-full border border-[#1a1a1a] bg-white/5 transition-all duration-300 ease-out'
            }
          >
            <span
              className={
                pomodoroSettings.enabled
                  ? 'absolute left-7 top-1 h-6 w-6 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.28)] transition-all duration-300 ease-out'
                  : 'absolute left-1 top-1 h-6 w-6 rounded-full bg-neutral-400 transition-all duration-300 ease-out'
              }
            />
          </button>
        </div>
      </section>


      <section className="rounded-[2rem] border border-[#1a1a1a] bg-[#080808] px-4 py-2 sm:px-6">

        <div className="space-y-0">

          {subjects.length > 0 && (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;

                if (!over || active.id === over.id) return;

                const oldIndex = subjects.findIndex(
                  (s) => s.id === active.id
                );

                const newIndex = subjects.findIndex(
                  (s) => s.id === over.id
                );

                if (oldIndex !== -1 && newIndex !== -1) {
                  moveSubjects(oldIndex, newIndex);
                }
              }}
            >
              <SortableContext
                items={subjects.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {subjects.map((subject) => (
                  <SubjectItem
                    key={subject.id}
                    subject={subject}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}


          {subjects.length === 0 && (
            <div className="rounded-2xl border border-[#1a1a1a] p-6 text-sm text-neutral-500">
              No subjects yet.
            </div>
          )}

        </div>


        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-col gap-4 pb-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">

            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="ypt-input"
              placeholder="Add subject"
              aria-label="Add subject"
            />

            <button
              type="submit"
              className="ypt-btn-primary inline-flex items-center justify-center gap-2 px-5"
            >
              <Plus size={14} />
              Add
            </button>

          </div>
        </form>

      </section>

    </div>
  );
};

export default Dashboard;
