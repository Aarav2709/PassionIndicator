import { useState } from 'react';
import { cn } from '@/lib/utils';
import SubjectItem from '../components/Dashboard/SubjectItem';
import { useTimer } from '@/context/TimerContext';
import { Plus, X, Settings2, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { SubjectWithStats } from '@/lib/aggregations';

const Dashboard = () => {
  const { subjects, todayTotalFocus, formatTime, addSubject, pomodoroSettings, updatePomodoroSettings } = useTimer();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPomodoroExpanded, setIsPomodoroExpanded] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [selectedColor, setSelectedColor] = useState("bg-subject-math");

  const colors = [
    { bg: 'bg-subject-math', label: 'Orange' },
    { bg: 'bg-subject-science', label: 'Yellow' },
    { bg: 'bg-subject-history', label: 'Peach' },
    { bg: 'bg-subject-english', label: 'Periwinkle' },
    { bg: 'bg-emerald-500', label: 'Emerald' },
    { bg: 'bg-rose-500', label: 'Rose' },
  ];

  const themeColors = [
    { rgb: '245 124 0', bg: 'bg-orange-600', label: 'Passion' },
    { rgb: '59 130 246', bg: 'bg-blue-500', label: 'Relax' },
    { rgb: '147 51 234', bg: 'bg-purple-600', label: 'Creative' },
    { rgb: '34 197 94', bg: 'bg-green-500', label: 'Fresh' },
    { rgb: '236 72 153', bg: 'bg-pink-500', label: 'Love' },
  ];

  const changeTheme = (rgb: string) => {
    document.documentElement.style.setProperty('--primary', rgb);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubName) {
      addSubject(newSubName, `${selectedColor} text-white`);
      setNewSubName("");
      setIsModalOpen(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-4">
      <div className="flex justify-end mb-4 px-2">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full hover:bg-neutral-surface text-neutral-muted hover:text-white transition-colors"
        >
          <Settings2 size={24} />
        </button>
      </div>

      <div className="bg-primary rounded-3xl p-8 mb-8 text-white text-center shadow-lg relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <header className="flex justify-between items-center relative z-10 mb-8 opacity-90">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">D-DAY</span>
        </header>
        <div className="relative z-10 py-8">
          <h1 className="text-[15vw] md:text-[6rem] leading-none font-bold tracking-tighter tabular-nums font-mono drop-shadow-sm select-none">
            {formatTime(todayTotalFocus)}
          </h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-xl font-bold text-neutral-text">Today's Focus</h2>
      </div>

      <div className="grid gap-4">
        {subjects.map((subject: SubjectWithStats) => (
          <SubjectItem key={subject.id} subject={subject} />
        ))}
      </div>

      <div className="fixed bottom-24 right-8 z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white w-14 h-14 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-surface border border-neutral-border p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Add Subject</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-neutral-muted" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-muted mb-2">Subject Name</label>
                <input
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="w-full bg-neutral-bg border border-neutral-border rounded-xl p-3 text-white focus:outline-none focus:border-primary"
                  placeholder="e.g. Quantum Physics"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-muted mb-2">Color Tag</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button
                      type="button"
                      key={c.bg}
                      onClick={() => setSelectedColor(c.bg)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform hover:scale-110",
                        c.bg,
                        selectedColor === c.bg && "ring-2 ring-white ring-offset-2 ring-offset-[#1E1E1E]"
                      )}
                    />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:brightness-110 transition-all">
                Create Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-surface border border-neutral-border p-6 rounded-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">App Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)}><X size={20} className="text-neutral-muted" /></button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-muted mb-3">Accent Color</label>
              <div className="flex gap-4">
                {themeColors.map(t => (
                  <button
                    key={t.label}
                    onClick={() => changeTheme(t.rgb)}
                    className={cn(
                      "w-10 h-10 rounded-full transition-transform hover:scale-110 border-2 border-transparent hover:border-white",
                      t.bg
                    )}
                    title={t.label}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-border pt-6">
              <button
                onClick={() => setIsPomodoroExpanded(!isPomodoroExpanded)}
                className="w-full flex items-center justify-between text-sm font-medium text-neutral-muted mb-3"
              >
                <div className="flex items-center gap-2">
                  <Timer size={16} />
                  <span>Pomodoro Mode</span>
                </div>
                {isPomodoroExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-neutral-text">Enable Pomodoro</span>
                <button
                  onClick={() => updatePomodoroSettings({ enabled: !pomodoroSettings.enabled })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    pomodoroSettings.enabled ? "bg-primary" : "bg-neutral-border"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      pomodoroSettings.enabled ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {isPomodoroExpanded && pomodoroSettings.enabled && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-xs text-neutral-muted mb-2">Focus Duration (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={Math.floor(pomodoroSettings.focusDuration / 60)}
                      onChange={(e) => updatePomodoroSettings({ focusDuration: parseInt(e.target.value) * 60 })}
                      className="w-full bg-neutral-bg border border-neutral-border rounded-lg p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-muted mb-2">Short Break (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={Math.floor(pomodoroSettings.shortBreakDuration / 60)}
                      onChange={(e) => updatePomodoroSettings({ shortBreakDuration: parseInt(e.target.value) * 60 })}
                      className="w-full bg-neutral-bg border border-neutral-border rounded-lg p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-muted mb-2">Long Break (minutes)</label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={Math.floor(pomodoroSettings.longBreakDuration / 60)}
                      onChange={(e) => updatePomodoroSettings({ longBreakDuration: parseInt(e.target.value) * 60 })}
                      className="w-full bg-neutral-bg border border-neutral-border rounded-lg p-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-muted mb-2">Long Break After (pomodoros)</label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={pomodoroSettings.longBreakInterval}
                      onChange={(e) => updatePomodoroSettings({ longBreakInterval: parseInt(e.target.value) })}
                      className="w-full bg-neutral-bg border border-neutral-border rounded-lg p-2 text-white text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
