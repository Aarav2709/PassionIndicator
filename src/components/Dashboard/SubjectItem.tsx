import { useState, useRef, useEffect } from 'react';
import {
  Play,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  GripVertical,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { SubjectWithStats } from '@/lib/aggregations';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SubjectItemProps {
  subject: SubjectWithStats;
}

const SubjectItem = ({ subject }: SubjectItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: subject.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const { id, name, todayTime } = subject;

  const {
    startSession,
    deleteSubject,
    updateSubject,
    formatTime,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useTimer();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);

  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(subject.color);
  const [newTodo, setNewTodo] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  const subjectTodos = todos.filter(
    (todo) => todo.subjectId === id
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) return;

    await updateSubject(
      id,
      editName,
      editColor
    );

    setIsEditing(false);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await deleteSubject(id);
    setShowMenu(false);
  };

  const handleAddTodo = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!newTodo.trim()) return;

    await addTodo(
      id,
      newTodo.trim()
    );

    setNewTodo('');
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="group relative border-b border-[#1a1a1a] py-4 last:border-b-0"
      >
        <div className="flex items-center justify-between gap-3">

          <div className="flex items-center gap-3 min-w-0">

            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-neutral-600 hover:text-white"
            >
              <GripVertical size={18} />
            </button>

            <button
              onClick={() => startSession(id)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white transition hover:brightness-110',
                subject.color
              )}
            >
              <Play
                size={14}
                fill="currentColor"
              />
            </button>

            <h3 className="truncate text-sm font-medium text-white">
              {name}
            </h3>

          </div>

          <div className="relative flex items-center gap-2">

            <div className="rounded-full border border-[#1a1a1a] bg-black px-3 py-1 text-sm text-neutral-300">
              {formatTime(todayTime)}
            </div>

            <button
              onClick={() =>
                setShowAddTodo((prev) => !prev)
              }
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-neutral-500 hover:text-white"
            >
              <Plus
                size={15}
                className={cn(
                  'transition-transform',
                  showAddTodo && 'rotate-45'
                )}
              />
            </button>

            <button
              onClick={() =>
                setShowMenu((prev) => !prev)
              }
              className="rounded-full p-1 text-neutral-600 opacity-0 transition group-hover:opacity-100 hover:text-white"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-10 z-20 rounded-2xl border border-[#1a1a1a] bg-[#0b0b0b] p-1"
              >
                <button
                  onClick={() => {
                    setEditName(name);
                    setEditColor(subject.color);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-neutral-300 hover:bg-white/5"
                >
                  <Edit2 size={13} />
                  Edit
                </button>

                <button
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

        <div className="ml-[94px] mt-3 space-y-2">

          {subjectTodos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center justify-between"
            >

              <button
                onClick={() =>
                  toggleTodo(id, todo.id)
                }
                className="flex items-center gap-2 text-sm text-neutral-300"
              >

                <div
                  className={
                    todo.completed
                      ? 'flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-black'
                      : 'h-4 w-4 rounded-full border border-white/20'
                  }
                >
                  {todo.completed && (
                    <Check size={11} />
                  )}
                </div>

                <span
                  className={
                    todo.completed
                      ? 'line-through text-neutral-500'
                      : ''
                  }
                >
                  {todo.title}
                </span>

              </button>

              <button
                onClick={() =>
                  deleteTodo(todo.id)
                }
                className="opacity-0 text-neutral-600 transition group-hover:opacity-100 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>

            </div>
          ))}

          <div
            className={cn(
              'grid overflow-hidden transition-all duration-300 ease-out',
              showAddTodo
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <form
              onSubmit={handleAddTodo}
              className="min-h-0"
            >
              <input
                value={newTodo}
                onChange={(e) =>
                  setNewTodo(e.target.value)
                }
                placeholder="Add task..."
                className="ypt-input mt-2 text-sm"
              />
            </form>
          </div>

        </div>

      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

          <div className="w-full max-w-sm rounded-3xl border border-[#1a1a1a] bg-[#0b0b0b] p-6">

            <div className="mb-6 flex items-center justify-between">

              <h3 className="text-lg font-medium text-white">
                Edit Subject
              </h3>

              <button
                onClick={() =>
                  setIsEditing(false)
                }
                className="text-neutral-500 hover:text-white"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleUpdate}
              className="space-y-4"
            >

              <input
                value={editName}
                onChange={(e) =>
                  setEditName(e.target.value)
                }
                className="ypt-input"
              />

              <div className="flex flex-wrap gap-3">

                {SUBJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      setEditColor(color.value)
                    }
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm',
                      color.value,
                      editColor === color.value
                        ? 'border-white'
                        : 'border-white/10'
                    )}
                  >
                    {color.label}
                  </button>
                ))}

              </div>

              <button
                type="submit"
                className="w-full ypt-btn-primary py-3"
              >
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
