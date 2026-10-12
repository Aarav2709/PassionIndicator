import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DndContext, DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SubjectItem from '@/components/Dashboard/SubjectItem';
import { useTimer } from '@/context/TimerContext';
import { SUBJECT_COLORS, formatTime } from '@/lib/types';

const pickRandomColor = () => SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)].value;

const Dashboard = () => {
  const { subjects, todayTotalFocus, pomodoroSettings, updatePomodoroSettings, addSubject, moveSubjects } = useTimer();

  const [newSubject, setNewSubject] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSubject.trim();
    if (!name) return;
    addSubject(name, pickRandomColor());
    setNewSubject('');
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = subjects.findIndex(s => s.id === active.id);
    const newIndex = subjects.findIndex(s => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) moveSubjects(oldIndex, newIndex);
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-[#1a1a1a] bg-[#080808] px-6 py-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:px-10 sm:py-10">
        <h2 className="text-sm text-neutral-500">{todayLabel}</h2>

        <div className="mt-8 text-[clamp(4rem,12vw,7.5rem)] font-medium leading-none tabular-nums text-white">
          {formatTime(todayTotalFocus)}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <span className="mr-3 text-xs uppercase tracking-[0.22em] text-neutral-500">Pomodoro</span>

          <button
            type="button"
            role="switch"
            onClick={() => updatePomodoroSettings({ enabled: !pomodoroSettings.enabled })}
            aria-checked={pomodoroSettings.enabled}
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
        {subjects.length > 0 ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {subjects.map(subject => (
                <SubjectItem key={subject.id} subject={subject} />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="mt-4 rounded-2xl border border-[#1a1a1a] p-6 text-sm text-neutral-500">No subjects yet.</div>
        )}

        <form onSubmit={handleCreate} className="mt-6 grid gap-3 pb-4 sm:grid-cols-[1fr_auto]">
          <input
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            maxLength={40}
            className="ypt-input"
            placeholder="Add subject"
            aria-label="Add subject"
          />

          <button
            type="submit"
            disabled={!newSubject.trim()}
            className="ypt-btn-primary inline-flex items-center justify-center gap-2 px-5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
            Add
          </button>
        </form>
      </section>
    </main>
  );
};

export default Dashboard;
