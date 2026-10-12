import { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Trash2, Edit2, X, GripVertical, Plus, Check } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { SubjectWithStats } from '@/lib/aggregations';
import { SUBJECT_COLORS, formatTime } from '@/lib/types';

interface SubjectItemProps {
  subject: SubjectWithStats;
}

const SubjectItem = ({ subject }: SubjectItemProps) => {
  const { id, name, color, todayTime } = subject;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const { startSession, deleteSubject, updateSubject, todos, addTodo, toggleTodo, deleteTodo } = useTimer();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(color);
  const [newTodo, setNewTodo] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const todoInputRef = useRef<HTMLInputElement>(null);

  const subjectTodos = todos.filter(todo => todo.subjectId === id);

  useEffect(() => {
    if (!showMenu) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showMenu]);

  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsEditing(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isEditing]);

  useEffect(() => {
    if (showAddTodo) todoInputRef.current?.focus();
  }, [showAddTodo]);

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
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          'group relative border-b border-[#1a1a1a] py-4 last:border-b-0',
          isDragging && 'z-10 bg-[#080808] opacity-80'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${name}`}
              className="cursor-grab touch-none text-neutral-600 hover:text-white active:cursor-grabbing"
            >
              <GripVertical size={18} />
            </button>

            <button
              type="button"
              onClick={() => startSession(id)}
              aria-label={`Start studying ${name}`}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white transition hover:brightness-110',
                color
              )}
            >
              <Play size={14} fill="currentColor" />
            </button>

            <h3 className="truncate text-sm font-medium text-white">{name}</h3>
          </div>

          <div ref={menuRef} className="relative flex items-center gap-2">
            <div className="rounded-full border border-[#1a1a1a] bg-black px-3 py-1 text-sm tabular-nums text-neutral-300">
              {formatTime(todayTime)}
            </div>

            <button
              type="button"
              onClick={() => setShowAddTodo(prev => !prev)}
              aria-label={showAddTodo ? 'Hide task input' : 'Add task'}
              aria-expanded={showAddTodo}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-neutral-500 hover:text-white"
            >
              <Plus size={15} className={cn('transition-transform', showAddTodo && 'rotate-45')} />
            </button>

            <button
              type="button"
              onClick={() => setShowMenu(prev => !prev)}
              aria-label="Subject options"
              aria-expanded={showMenu}
              className={cn(
                'rounded-full p-1 text-neutral-600 opacity-0 transition hover:text-white focus-visible:opacity-100 group-hover:opacity-100',
                showMenu && 'opacity-100'
              )}
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-20 rounded-2xl border border-[#1a1a1a] bg-[#0b0b0b] p-1">
                <button
                  type="button"
                  onClick={openEditor}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
                >
                  <Edit2 size={13} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {(subjectTodos.length > 0 || showAddTodo) && (
          <div className="ml-[94px] mt-3 space-y-2">
            {subjectTodos.map(todo => (
              <div key={todo.id} className="group/todo flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  aria-pressed={todo.completed}
                  className="flex min-w-0 items-center gap-2 text-left text-sm text-neutral-300"
                >
                  <span
                    className={
                      todo.completed
                        ? 'flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-black'
                        : 'h-4 w-4 shrink-0 rounded-full border border-white/20'
                    }
                  >
                    {todo.completed && <Check size={11} />}
                  </span>
                  <span className={cn('truncate', todo.completed && 'text-neutral-500 line-through')}>{todo.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete task ${todo.title}`}
                  className="text-neutral-600 opacity-0 transition hover:text-red-400 focus-visible:opacity-100 group-hover/todo:opacity-100"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {showAddTodo && (
              <form onSubmit={handleAddTodo} className="animate-fade-in">
                <input
                  ref={todoInputRef}
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && setShowAddTodo(false)}
                  placeholder="Add task..."
                  aria-label={`Add task to ${name}`}
                  className="ypt-input mt-2 text-sm"
                />
              </form>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onMouseDown={e => e.target === e.currentTarget && setIsEditing(false)}
        >
          <div role="dialog" aria-modal="true" aria-labelledby={`edit-${id}`} className="w-full max-w-sm rounded-3xl border border-[#1a1a1a] bg-[#0b0b0b] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 id={`edit-${id}`} className="text-lg font-medium text-white">
                Edit Subject
              </h3>
              <button type="button" onClick={() => setIsEditing(false)} aria-label="Close" className="text-neutral-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input value={editName} onChange={e => setEditName(e.target.value)} aria-label="Subject name" autoFocus className="ypt-input" />

              <div className="flex flex-wrap gap-3">
                {SUBJECT_COLORS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setEditColor(option.value)}
                    aria-pressed={editColor === option.value}
                    className={cn(
                      'rounded-full border-2 px-4 py-2 text-sm font-medium text-black',
                      option.value,
                      editColor === option.value ? 'border-white' : 'border-transparent'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button type="submit" className="ypt-btn-primary w-full py-3">
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectItem;
