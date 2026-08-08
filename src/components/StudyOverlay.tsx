import { useEffect } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Pause, Play, Square } from 'lucide-react';

const StudyOverlay = () => {
  const {
    timerState,
    displayTimes,
    activeSubject,
    formatTime,
    pomodoroSettings,
    stopSession,
    pauseSession,
    resumeSession,
  } = useTimer();

  useEffect(() => {
    const active = timerState.mode !== 'idle' && !!activeSubject;

    document.documentElement.style.overflowY = active ? 'hidden' : '';
    document.body.style.overflowY = active ? 'hidden' : '';

    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, [timerState.mode, activeSubject]);

  if (timerState.mode === 'idle' || !activeSubject) return null;

  const isStudying = timerState.mode === 'focusing';
  const currentTime = pomodoroSettings.enabled
    ? displayTimes.pomodoroRemaining
    : isStudying
      ? displayTimes.currentFocus
      : displayTimes.currentBreak;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black px-4 py-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_34%)]" />

      <div className="relative flex items-center justify-between text-sm text-neutral-500">
        <span className="truncate">{activeSubject.name}</span>
        <span>{isStudying ? 'Studying' : 'Break'}</span>
      </div>

      <div className="relative flex flex-1 items-center justify-center text-center">
        <div
          className={
            isStudying
              ? 'text-[clamp(5rem,20vw,12rem)] font-medium leading-none text-emerald-400'
              : 'text-[clamp(5rem,20vw,12rem)] font-medium leading-none text-rose-400'
          }
        >
          {formatTime(currentTime)}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center justify-center gap-3 pb-4 sm:pb-6">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition-colors hover:bg-white/10"
          onClick={isStudying ? pauseSession : resumeSession}
        >
          {isStudying ? <Pause size={14} /> : <Play size={14} />}
          {isStudying ? 'Pause' : 'Resume'}
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white text-black px-5 py-3 text-sm transition-colors hover:bg-neutral-200"
          onClick={stopSession}
        >
          <Square size={14} />
          Done
        </button>
      </div>
    </div>
  );
};

export default StudyOverlay;
