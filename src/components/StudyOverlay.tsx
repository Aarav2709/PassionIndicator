import { useEffect } from 'react';
import { useTimer } from '@/context/TimerContext';
import { formatTime } from '@/lib/types';
import { Pause, Play, Square } from 'lucide-react';

const DEFAULT_TITLE = document.title;

const StudyOverlay = () => {
  const {
    timerState,
    displayTimes,
    activeSubject,
    todayTotalFocus,
    pomodoroSettings,
    stopSession,
    pauseSession,
    resumeSession,
  } = useTimer();

  const active = timerState.mode !== 'idle' && !!activeSubject;
  const isStudying = timerState.mode === 'focusing';
  const isPomodoroBreak = timerState.pomodoroPhase === 'shortBreak' || timerState.pomodoroPhase === 'longBreak';
  const showCountdown = pomodoroSettings.enabled && (isStudying || isPomodoroBreak);

  const currentTime = showCountdown
    ? displayTimes.pomodoroRemaining
    : isStudying
      ? displayTimes.currentFocus
      : displayTimes.currentBreak;

  useEffect(() => {
    document.documentElement.style.overflowY = active ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflowY = '';
    };
  }, [active]);

  useEffect(() => {
    document.title = active ? `${formatTime(currentTime)} ${isStudying ? 'studying' : 'break'}` : DEFAULT_TITLE;
  }, [active, currentTime, isStudying]);

  useEffect(() => () => void (document.title = DEFAULT_TITLE), []);

  // space toggles pause and resume
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();
      if (isStudying) pauseSession();
      else resumeSession();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, isStudying, pauseSession, resumeSession]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black px-4 py-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(239,68,68,0.08),transparent_34%)]" />

      <div className="relative flex items-center justify-between gap-4 text-sm text-neutral-500">
        <span className="truncate">{activeSubject.name}</span>
        <span className="tabular-nums">Today {formatTime(todayTotalFocus)}</span>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="text-xs uppercase tracking-[0.22em] text-neutral-500">
          {isStudying ? 'Studying' : isPomodoroBreak ? 'Pomodoro break' : 'Break'}
        </span>
        <div
          className={
            isStudying
              ? 'text-[clamp(5rem,20vw,12rem)] font-medium leading-none tabular-nums text-emerald-400'
              : 'text-[clamp(5rem,20vw,12rem)] font-medium leading-none tabular-nums text-rose-400'
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
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-5 py-3 text-sm text-black transition-colors hover:bg-neutral-200"
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
