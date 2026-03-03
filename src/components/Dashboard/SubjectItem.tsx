import { useState, useRef, useEffect } from 'react';
import { Play, Check, Plus, MoreVertical, Trash2, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { SubjectWithStats } from '@/lib/aggregations';
import { Todo } from '@/lib/types';

const COLORS = [
  { bg: 'bg-subject-math', label: 'Orange' },
  { bg: 'bg-subject-science', label: 'Yellow' },
  { bg: 'bg-subject-history', label: 'Peach' },
  { bg: 'bg-subject-english', label: 'Periwinkle' },
  { bg: 'bg-emerald-500', label: 'Emerald' },
  { bg: 'bg-rose-500', label: 'Rose' },
  { bg: 'bg-blue-500', label: 'Blue' },
  { bg: 'bg-pink-500', label: 'Pink' },
];

interface SubjectItemProps {
  subject: SubjectWithStats;
}

const SubjectItem = ({ subject }: SubjectItemProps) => {
  const { id, name, color, todayTime } = subject;
  const {
    startSession,
    addTodo,
    toggleTodo,
    deleteSubject,
    updateSubject,
    formatTime,
    todos,
  } = useTimer();

  const [todoInput, setTodoInput] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(color);
  const menuRef = useRef<HTMLDivElement>(null);

  const subjectTodos = todos.filter((t: Todo) => t.subjectId === id);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (todoInput.trim()) {
      await addTodo(id, todoInput);
      setTodoInput('');
      setIsAddingTodo(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim()) {
      await updateSubject(id, editName, editColor);
      setIsEditing(false);
      setShowMenu(false);
    }
  };

  const handleStartSession = async () => {
    await startSession(id);
  };

  const handleDelete = async () => {
    await deleteSubject(id);
    setShowMenu(false);
  };

  return (
    <>
      <div className="group relative bg-neutral-surface hover:bg-neutral-surface/80 border border-neutral-border rounded-xl px-4 py-3 transition-all duration-200 hover:border-neutral-muted/50">
        <div className="flex items-center justify-between">
          {/* Left: Play + Name */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleStartSession}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0',
                color,
                'text-white hover:brightness-110 hover:scale-105 active:scale-95'
              )}
            >
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-white truncate">{name}</h3>
                <button
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className="p-0.5 rounded text-neutral-muted/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
                  title="Add Todo"
                >
                  <Plus size={12} />
                </button>
              </div>
              {subjectTodos.length > 0 && (
                <div className="text-[11px] text-neutral-muted mt-0.5">
                  {subjectTodos.filter(t => t.completed).length}/{subjectTodos.length} tasks
                </div>
              )}
            </div>
          </div>

          {/* Right: Time + Menu */}
          <div className="flex items-center gap-2 relative shrink-0">
            <div className="text-base font-mono font-semibold tabular-nums text-white/90 tracking-tight">
              {formatTime(todayTime)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-neutral-muted/40 hover:text-neutral-muted p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute top-8 right-0 z-20 bg-neutral-surface border border-neutral-border rounded-xl shadow-xl p-1 min-w-[120px] animate-scale-in flex flex-col gap-0.5"
              >
                <button
                  onClick={() => {
                    setEditName(name);
                    setEditColor(color);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={13} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Todo Input */}
        {isAddingTodo && (
          <form onSubmit={handleAddTodo} className="mt-3 ml-12 flex gap-2">
            <input
              autoFocus
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder="What to study?"
              className="ypt-input text-sm py-2"
              onBlur={() => {
                if (!todoInput.trim()) setIsAddingTodo(false);
              }}
            />
          </form>
        )}

        {/* Todo List */}
        {subjectTodos.length > 0 && (
          <div className="mt-2.5 ml-12 space-y-1.5">
            {subjectTodos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(id, todo.id)}
                className="flex items-center gap-2.5 text-sm text-neutral-muted hover:text-white transition-colors cursor-pointer group/todo"
              >
                <div
                  className={cn(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0',
                    todo.completed
                      ? 'bg-primary border-primary text-white'
                      : 'border-neutral-muted/40 group-hover/todo:border-primary/60'
                  )}
                >
                  {todo.completed && <Check size={10} strokeWidth={3} />}
                </div>
                <span className={cn('text-xs', todo.completed && 'line-through opacity-40')}>
                  {todo.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-neutral-surface border border-neutral-border p-6 rounded-2xl w-full max-w-sm animate-scale-in shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Edit Subject</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-neutral-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="ypt-input"
                  placeholder="e.g. Mathematics"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-3">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setEditColor(c.bg)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all hover:scale-110',
                        c.bg,
                        editColor === c.bg &&
                          'ring-2 ring-white ring-offset-2 ring-offset-neutral-surface scale-110'
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full ypt-btn-primary py-3 text-sm font-bold"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SubjectItem;
