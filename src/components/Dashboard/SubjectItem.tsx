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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      <div className="bg-neutral-surface rounded-2xl p-4 shadow-sm border border-neutral-border hover:border-neutral-muted transition-all duration-300 group relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartSession}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm',
                color,
                'text-white hover:brightness-110 hover:shadow-[0_0_15px_rgba(255,126,54,0.4)]'
              )}
            >
              <Play size={16} fill="currentColor" className="ml-0.5" />
            </button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-neutral-text">{name}</h3>
                <button
                  onClick={() => setIsAddingTodo(!isAddingTodo)}
                  className="p-1 rounded-md text-neutral-muted hover:bg-white/10 hover:text-primary transition-colors"
                  title="Add Todo"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            <div className="text-xl font-mono font-medium tabular-nums text-primary tracking-tight">
              {formatTime(todayTime)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="text-neutral-muted hover:bg-neutral-bg p-1.5 rounded-lg opacity-100 transition-opacity"
            >
              <MoreVertical size={18} />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute top-8 right-0 z-20 bg-[#2C2C2C] border border-neutral-border rounded-xl shadow-xl p-1 min-w-[120px] animate-in zoom-in-95 duration-100 flex flex-col gap-1"
              >
                <button
                  onClick={() => {
                    setEditName(name);
                    setEditColor(color);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-white/5 rounded-lg flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <div className="h-[1px] bg-white/5 mx-2" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {isAddingTodo && (
          <form onSubmit={handleAddTodo} className="mt-3 ml-[3.25rem] flex gap-2">
            <input
              autoFocus
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder="What to study?"
              className="bg-neutral-bg border border-neutral-border rounded text-sm px-2 py-1 flex-1 text-white focus:outline-none focus:border-primary"
            />
          </form>
        )}

        {subjectTodos.length > 0 && (
          <div className="mt-3 pl-[3.25rem] space-y-2">
            {subjectTodos.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodo(id, todo.id)}
                className="flex items-center gap-3 text-sm text-neutral-muted hover:text-neutral-text transition-colors cursor-pointer group/todo"
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border border-neutral-500 flex items-center justify-center transition-colors',
                    todo.completed
                      ? 'bg-primary border-primary text-white'
                      : 'group-hover/todo:border-primary'
                  )}
                >
                  {todo.completed && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={cn(todo.completed && 'line-through opacity-50')}>
                  {todo.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-surface border border-neutral-border p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Edit Subject</h3>
              <button onClick={() => setIsEditing(false)}>
                <X size={20} className="text-neutral-muted" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm text-neutral-muted mb-2">Subject Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-bg border border-neutral-border rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="e.g. Mathematics"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-muted mb-2">Color</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setEditColor(c.bg)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform hover:scale-110',
                        c.bg,
                        editColor === c.bg &&
                          'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]'
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
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
