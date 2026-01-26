import { useEffect } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Pause, Coffee, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { enterFullscreen } from '@/lib/timerMachine';

const FocusMode = () => {
  const {
    timerState,
    displayTimes,
    activeSubject,
    stopSession,
    formatTime,
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

  const handleResumeFullscreen = async () => {
    await enterFullscreen();
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] h-screen w-screen overflow-hidden touch-none flex flex-col transition-colors duration-500 bg-[#1a1a1a]'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isFocusing ? (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium">Focusing</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-400">
              <Coffee size={14} />
              <span className="text-xs font-medium">On Break</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <span className="font-medium">{activeSubject.name}</span>
          <div className={cn('w-2 h-2 rounded-full', activeSubject.color)} />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isOnBreak && (
          <div className="mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="text-amber-400 text-xs font-medium mb-2">
              Fullscreen exited - Break timer running
            </p>
            <button
              onClick={handleResumeFullscreen}
              className="flex items-center gap-2 mx-auto px-3 py-1.5 bg-amber-500 text-black text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              <Maximize size={14} />
              Resume Fullscreen
            </button>
          </div>
        )}

        <div
          className={cn(
            'text-[12vw] md:text-7xl font-sans tabular-nums font-normal mb-6 tracking-wide leading-none select-none transition-colors',
            isFocusing ? 'text-white' : 'text-amber-400'
          )}
        >
          {formatTime(displayTimes.currentSegment)}
        </div>

        <div className="flex gap-8 text-center mb-8">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider">Focus</span>
            <span className="text-lg font-sans font-light text-green-400 tabular-nums">
              {formatTime(displayTimes.currentFocus)}
            </span>
          </div>

          <div className="flex flex-col gap-1 items-center">
            <span className="text-neutral-500 text-[10px] uppercase tracking-wider">Break</span>
            <span className="text-lg font-sans font-light text-amber-400 tabular-nums">
              {formatTime(displayTimes.currentBreak)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-12">
        <button
          onClick={stopSession}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl cursor-pointer',
            isFocusing
              ? 'bg-[#D6D6D6] hover:bg-white text-black'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          )}
        >
          <Pause size={28} fill="currentColor" className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default FocusMode;
