import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';
import { Timer, ChevronDown, ChevronUp } from 'lucide-react';

const THEME_OPTIONS = [
  { key: 'coral', bg: 'bg-[#FF6B47]', label: 'Coral' },
  { key: 'blue', bg: 'bg-blue-500', label: 'Ocean' },
  { key: 'purple', bg: 'bg-purple-600', label: 'Violet' },
  { key: 'green', bg: 'bg-green-500', label: 'Mint' },
  { key: 'pink', bg: 'bg-pink-500', label: 'Rose' },
] as const;

const Settings = () => {
  const {
    appSettings,
    updateAppSettings,
    pomodoroSettings,
    updatePomodoroSettings,
  } = useTimer();

  const [isPomodoroExpanded, setIsPomodoroExpanded] = useState(false);

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      {/* D-Day Settings */}
      <div className="ypt-card p-6 mb-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-muted font-semibold mb-5">
          D-Day Target
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-muted mb-2">Event Name</label>
            <input
              type="text"
              value={appSettings.dDayLabel}
              onChange={(e) => updateAppSettings({ dDayLabel: e.target.value })}
              className="ypt-input text-sm py-2.5"
              placeholder="e.g. 수능, SAT, LSAT..."
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-muted mb-2">Target Date</label>
            <input
              type="date"
              value={appSettings.dDayDate || ''}
              onChange={(e) => updateAppSettings({ dDayDate: e.target.value || null })}
              className="ypt-input text-sm py-2.5"
            />
          </div>

          {appSettings.dDayDate && (
            <button
              onClick={() => updateAppSettings({ dDayDate: null, dDayLabel: 'D-Day' })}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Clear D-Day
            </button>
          )}
        </div>
      </div>

      {/* Daily Goal */}
      <div className="ypt-card p-6 mb-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-muted font-semibold mb-5">
          Daily Goal
        </h3>
        <div>
          <label className="block text-xs text-neutral-muted mb-2">Study Hours Per Day</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="16"
              value={Math.floor(appSettings.dailyGoalSeconds / 3600)}
              onChange={(e) =>
                updateAppSettings({ dailyGoalSeconds: parseInt(e.target.value) * 3600 })
              }
              className="flex-1 accent-primary"
            />
            <span className="text-sm font-mono font-bold text-white w-12 text-right">
              {Math.floor(appSettings.dailyGoalSeconds / 3600)}h
            </span>
          </div>
        </div>
      </div>

      {/* Accent Color */}
      <div className="ypt-card p-6 mb-4">
        <h3 className="text-xs uppercase tracking-wider text-neutral-muted font-semibold mb-5">
          Accent Color
        </h3>
        <div className="flex gap-3">
          {THEME_OPTIONS.map((t) => (
            <button
              key={t.key}
              onClick={() => updateAppSettings({ theme: t.key })}
              className={cn(
                'w-10 h-10 rounded-xl transition-all hover:scale-110',
                t.bg,
                appSettings.theme === t.key
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-neutral-surface scale-110'
                  : 'opacity-60 hover:opacity-100'
              )}
              title={t.label}
            />
          ))}
        </div>
      </div>

      {/* Pomodoro Settings */}
      <div className="ypt-card p-6 mb-4">
        <button
          onClick={() => setIsPomodoroExpanded(!isPomodoroExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Timer size={16} className="text-neutral-muted" />
            <h3 className="text-xs uppercase tracking-wider text-neutral-muted font-semibold">
              Pomodoro Mode
            </h3>
          </div>
          {isPomodoroExpanded ? (
            <ChevronUp size={16} className="text-neutral-muted" />
          ) : (
            <ChevronDown size={16} className="text-neutral-muted" />
          )}
        </button>

        {/* Enable toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-white">Enable Pomodoro</span>
          <button
            onClick={() =>
              updatePomodoroSettings({ enabled: !pomodoroSettings.enabled })
            }
            className={cn(
              'w-11 h-6 rounded-full transition-colors relative',
              pomodoroSettings.enabled ? 'bg-primary' : 'bg-neutral-border'
            )}
          >
            <div
              className={cn(
                'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                pomodoroSettings.enabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {isPomodoroExpanded && pomodoroSettings.enabled && (
          <div className="space-y-4 pt-2 border-t border-neutral-border animate-slide-up">
            <div>
              <label className="block text-xs text-neutral-muted mb-2">
                Focus Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={Math.floor(pomodoroSettings.focusDuration / 60)}
                onChange={(e) =>
                  updatePomodoroSettings({
                    focusDuration: parseInt(e.target.value) * 60,
                  })
                }
                className="ypt-input text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-muted mb-2">
                Short Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={Math.floor(pomodoroSettings.shortBreakDuration / 60)}
                onChange={(e) =>
                  updatePomodoroSettings({
                    shortBreakDuration: parseInt(e.target.value) * 60,
                  })
                }
                className="ypt-input text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-muted mb-2">
                Long Break (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={Math.floor(pomodoroSettings.longBreakDuration / 60)}
                onChange={(e) =>
                  updatePomodoroSettings({
                    longBreakDuration: parseInt(e.target.value) * 60,
                  })
                }
                className="ypt-input text-sm py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-muted mb-2">
                Long Break After (pomodoros)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={pomodoroSettings.longBreakInterval}
                onChange={(e) =>
                  updatePomodoroSettings({
                    longBreakInterval: parseInt(e.target.value),
                  })
                }
                className="ypt-input text-sm py-2"
              />
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default Settings;
