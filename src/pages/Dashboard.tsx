import { useState } from 'react';
import { cn } from '@/lib/utils';
import SubjectItem from '../components/Dashboard/SubjectItem';
import { useTimer } from '@/context/TimerContext';
import { Plus, X } from 'lucide-react';
import { SubjectWithStats } from '@/lib/aggregations';

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

const Dashboard = () => {
  const {
    subjects,
    todayTotalFocus,
    formatTime,
    addSubject,
    dDayCount,
    appSettings,
  } = useTimer();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-subject-math');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubName.trim()) {
      addSubject(newSubName.trim(), `${selectedColor} text-white`);
      setNewSubName('');
      setIsModalOpen(false);
    }
  };

  // Goal progress
  const goalProgress = Math.min(1, todayTotalFocus / appSettings.dailyGoalSeconds);
  const goalHours = Math.floor(appSettings.dailyGoalSeconds / 3600);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-sm font-medium text-neutral-muted">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
        </div>
        {dDayCount !== null && (
          <div className={cn(
            'px-4 py-1.5 rounded-full text-sm font-bold',
            dDayCount > 0
              ? 'bg-primary/15 text-primary border border-primary/20'
              : dDayCount === 0
              ? 'bg-red-500/15 text-red-400 border border-red-500/20'
              : 'bg-neutral-muted/15 text-neutral-muted border border-neutral-border'
          )}>
            {dDayCount > 0 ? `D-${dDayCount}` : dDayCount === 0 ? 'D-Day!' : `D+${Math.abs(dDayCount)}`}
          </div>
        )}
      </div>

      {/* Hero Timer */}
      <div className="ypt-card p-8 mb-8 text-center relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="text-[11px] uppercase tracking-[0.2em] text-neutral-muted font-semibold mb-6">
            Total Study Time
          </div>

          <h1 className="text-timer-hero font-mono tabular-nums text-white select-none mb-6 drop-shadow-sm">
            {formatTime(todayTotalFocus)}
          </h1>

          {/* Goal Progress */}
          <div className="max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs text-neutral-muted mb-2">
              <span>Daily Goal</span>
              <span className="font-mono tabular-nums">
                {Math.floor(goalProgress * 100)}% · {goalHours}h target
              </span>
            </div>
            <div className="w-full h-1.5 bg-neutral-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${goalProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subject List Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-muted uppercase tracking-wider">
          Subjects
        </h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus size={14} />
          Add Subject
        </button>
      </div>

      {/* Subject List */}
      <div className="space-y-2">
        {subjects.map((subject: SubjectWithStats) => (
          <SubjectItem key={subject.id} subject={subject} />
        ))}

        {subjects.length === 0 && (
          <div className="ypt-card p-12 text-center">
            <div className="text-neutral-muted text-sm">No subjects yet</div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-primary text-sm font-medium hover:underline"
            >
              Create your first subject
            </button>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-surface border border-neutral-border p-6 rounded-2xl w-full max-w-sm animate-scale-in shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Add Subject</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-neutral-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-2">
                  Subject Name
                </label>
                <input
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="ypt-input"
                  placeholder="e.g. Mathematics"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-muted uppercase tracking-wider mb-3">
                  Color
                </label>
                <div className="flex gap-3 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.bg}
                      onClick={() => setSelectedColor(c.bg)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all hover:scale-110',
                        c.bg,
                        selectedColor === c.bg &&
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
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
