import { useEffect, useRef, useState } from 'react';
import { Check, GripVertical, MoreHorizontal, Pencil, Play, Plus, Trash2, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { useTimer } from '@/context/TimerContext';
import { SubjectWithStats } from '@/lib/aggregations';
import { SUBJECT_COLORS, formatDuration, formatTime } from '@/lib/types';

interface SubjectRowProps {
  subject: SubjectWithStats;
}

const SubjectRow = ({ subject }: SubjectRowProps) => {
  const { id, name, color, todayTime } = subject;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { openBoarding, deleteSubject, updateSubject, todos, addTodo, toggleTodo, deleteTodo } = useTimer();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(color);
  const [newTodo, setNewTodo] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // open tasks first, finished ones sink to the bottom
  const subjectTodos = todos.filter(t => t.subjectId === id).sort((a, b) => Number(a.completed) - Number(b.completed));

  useEffect(() => {
    if (!showMenu) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showMenu]);

  const openEditor = () => {
    setEditName(name);
    setEditColor(color);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    await updateSubject(id, trimmed, editColor);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    if (!window.confirm(`Delete "${name}" and its tasks? Study time already recorded is kept.`)) return;
    await deleteSubject(id);
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTodo.trim();
    if (!trimmed) return;
    await addTodo(id, trimmed);
    setNewTodo('');
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group relative rounded-xl transition-colors hover:bg-white/[0.03]', isDragging && 'z-10 bg-neutral-950 shadow-2xl')}
    >
      <div className="flex items-center gap-3 py-2.5 pl-1 pr-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${name}`}
          className="flex h-8 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-neutral-700 opacity-0 transition-opacity hover:text-neutral-300 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>

        <button
          type="button"
          onClick={() => openBoarding(id)}
          aria-label={`Board a flight for ${name}`}
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-black/75 transition hover:scale-105 hover:brightness-110', color)}
        >
          <Play size={13} fill="currentColor" className="ml-0.5" />
        </button>

        <span className="min-w-0 flex-1 truncate text-[15px] text-white">{name}</span>

        <div ref={menuRef} className="relative flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button type="button" onClick={() => setAddingTask(true)} aria-label={`Add task to ${name}`} title="Add task" className="icon-btn">
            <Plus size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowMenu(prev => !prev)}
            aria-label={`${name} options`}
            aria-expanded={showMenu}
            className="icon-btn"
          >
            <MoreHorizontal size={15} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-white/10 bg-black p-1 shadow-2xl animate-fade-in">
              <button type="button" onClick={openEditor} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-white/[0.06]">
                <Pencil size={13} />
                Edit
              </button>
              <button type="button" onClick={handleDelete} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>

        <span className={cn('w-[4.75rem] text-right text-sm tabular-nums', todayTime > 0 ? 'text-white' : 'text-neutral-600')}>{formatTime(todayTime)}</span>
      </div>

      {(subjectTodos.length > 0 || addingTask) && (
        <ul className="pb-2.5 pl-[4.25rem] pr-3">
          {subjectTodos.map(todo => (
            <li key={todo.id} className="group/todo flex items-center gap-2.5 py-1">
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-pressed={todo.completed}
                aria-label={todo.completed ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                  todo.completed ? 'border-transparent bg-white/80 text-black' : 'border-white/25 hover:border-white/60'
                )}
              >
                {todo.completed && <Check size={10} strokeWidth={3} />}
              </button>
              <span className={cn('min-w-0 flex-1 truncate text-[13px]', todo.completed ? 'text-neutral-600 line-through' : 'text-neutral-300')}>{todo.title}</span>
              {!!todo.focusSeconds && todo.focusSeconds >= 60 && <span className="text-[11px] tabular-nums text-neutral-600">{formatDuration(todo.focusSeconds)}</span>}
              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                aria-label={`Delete task ${todo.title}`}
                className="text-neutral-700 opacity-0 transition hover:text-rose-400 focus-visible:opacity-100 group-hover/todo:opacity-100"
              >
                <X size={13} />
              </button>
            </li>
          ))}

          {addingTask && (
            <li className="py-1">
              <form onSubmit={handleAddTodo}>
                <input
                  autoFocus
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onBlur={() => !newTodo.trim() && setAddingTask(false)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setNewTodo('');
                      setAddingTask(false);
                    }
                  }}
                  maxLength={120}
                  placeholder="New task"
                  aria-label={`New task for ${name}`}
                  className="w-full border-b border-white/10 bg-transparent py-1 text-[13px] text-white placeholder:text-neutral-600 focus:border-white/30 focus:outline-none focus-visible:ring-0"
                />
              </form>
            </li>
          )}
        </ul>
      )}

      {isEditing && (
        <Modal title="Edit subject" onClose={() => setIsEditing(false)}>
          <form onSubmit={handleUpdate} className="space-y-5">
            <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={40} aria-label="Subject name" autoFocus className="field" />

            <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2.5">
              {SUBJECT_COLORS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={editColor === option.value}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => setEditColor(option.value)}
                  className={cn(
                    'h-8 w-8 rounded-full ring-offset-2 ring-offset-black transition',
                    option.value,
                    editColor === option.value ? 'ring-2 ring-white' : 'hover:scale-110'
                  )}
                />
              ))}
            </div>

            <button type="submit" className="btn-primary w-full py-2.5">
              Save
            </button>
          </form>
        </Modal>
      )}
    </li>
  );
};

export default SubjectRow;
