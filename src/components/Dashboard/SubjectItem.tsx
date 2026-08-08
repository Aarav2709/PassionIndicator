import { useState, useRef, useEffect } from 'react';
import { Play, MoreVertical, Trash2, Edit2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { SubjectWithStats } from '@/lib/aggregations';

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
  const { id, name, todayTime } = subject;
  const {
    startSession,
    deleteSubject,
    updateSubject,
    formatTime,
  } = useTimer();

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editColor, setEditColor] = useState(subject.color);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div className="group relative border-b border-[#1a1a1a] py-4 last:border-b-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={handleStartSession}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white transition-colors hover:brightness-110 active:scale-[0.98]',
                subject.color
              )}
            >
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </button>

            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-white">{name}</h3>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <div className="rounded-full border border-[#1a1a1a] bg-black px-3 py-1 text-sm text-neutral-300">
              {formatTime(todayTime)}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded-full p-1 text-neutral-600 opacity-0 transition-colors hover:text-white group-hover:opacity-100"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <div
                ref={menuRef}
                className="absolute right-0 top-10 z-20 min-w-[120px] rounded-2xl border border-[#1a1a1a] bg-[#0b0b0b] p-1"
              >
                <button
                  onClick={() => {
                    setEditName(name);
                    setEditColor(subject.color);
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Edit2 size={13} />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#1a1a1a] bg-[#0b0b0b] p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Edit Subject</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-full p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="mb-2 block text-[11px] uppercase tracking-[0.24em] text-neutral-500">Subject name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="ypt-input"
                  placeholder="Subject name"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-3 block text-[11px] uppercase tracking-[0.24em] text-neutral-500">Color</label>
                <div className="flex flex-wrap gap-3">
                  {SUBJECT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setEditColor(color.value)}
                      className={cn(
                        'h-10 rounded-full border px-4 text-sm transition-all',
                        color.value,
                        editColor === color.value
                          ? 'border-white text-white scale-[1.02]'
                          : 'border-white/10 text-white/80 opacity-80 hover:opacity-100'
                      )}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full ypt-btn-primary py-3 text-sm font-medium"
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
