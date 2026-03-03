import { useEffect } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Square, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enterFullscreen } from '@/lib/timerMachine';

const FocusMode = () => {
  const {
    timerState,
    displayTimes,
    activeSubject,
    stopSession,
    formatTime,
    pomodoroSettings,
  } = useTimer();

  useEffect(() => {
    if (timerState.mode !== 'idle') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [timerState.mode]);

  if (timerState.mode === 'idle') return null;
  if (!activeSubject) return null;

  const isFocusing = timerState.mode === 'focusing';
  const isOnBreak = timerState.mode === 'break';
  const isPomodoroActive = pomodoroSettings.enabled;
  const pomodoroCount = timerState.pomodoroCount;

  const formatPomodoroTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleResumeFullscreen = async () => {
    await enterFullscreen();
  };

  return (
    <div className="fixed inset-0 z-[60] h-screen w-screen overflow-hidden touch-none flex flex-col bg-[#050505]">


      {/* Center timer */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isOnBreak && (
          <div className="mb-10 px-6 py-4 bg-amber-500/8 border border-amber-500/20 rounded-2xl text-center animate-fade-in">
            <p className="text-amber-400/80 text-xs font-medium mb-3">
              Fullscreen exited. Break timer running
            </p>
            <button
              onClick={handleResumeFullscreen}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-xl hover:bg-amber-400 transition-colors active:scale-95"
            >
              <Maximize size={14} />
              Resume Fullscreen
            </button>
          </div>
        )}

        <div
          className={cn(
            'text-timer-hero font-mono tabular-nums tracking-tighter select-none transition-colors duration-500',
            isFocusing ? 'text-white' : 'text-amber-400'
          )}
          style={{ fontSize: 'clamp(5rem, 15vw, 12rem)' }}
        >
          {isPomodoroActive
            ? formatPomodoroTime(displayTimes.pomodoroRemaining)
            : formatTime(displayTimes.currentSegment)
          }
        </div>

        {isPomodoroActive && (
          <div className="text-white/25 text-sm mt-4 font-medium">
            {isFocusing ? 'Focus time remaining' : 'Break time remaining'}
          </div>
        )}

        {/* Stats row */}
        <div className="flex gap-12 mt-10">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-1">Focus</div>
            <div className="text-lg font-mono tabular-nums text-emerald-400/80">
              {formatTime(displayTimes.currentFocus)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25 font-semibold mb-1">Break</div>
            <div className="text-lg font-mono tabular-nums text-amber-400/80">
              {formatTime(displayTimes.currentBreak)}
            </div>
          </div>
        </div>
      </div>

      {/* Stop button */}
      <div className="flex justify-center pb-16">
        <button
          onClick={stopSession}
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all',
            'hover:scale-105 active:scale-95',
            isFocusing
              ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/20'
          )}
        >
          <Square size={22} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
