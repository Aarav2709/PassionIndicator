import { useEffect, useState } from 'react';
import { useTimer } from '@/context/TimerContext';
import { Pause, Menu } from 'lucide-react';

const FocusMode = () => {
    const { activeSubjectId, subjects, stopTimer, formatTime, todayTotalTime } = useTimer();
    const [sessionSeconds, setSessionSeconds] = useState(0);

    // Lock body scroll
    useEffect(() => {
        if (activeSubjectId) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [activeSubjectId]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (activeSubjectId) {
            setSessionSeconds(0);
            interval = setInterval(() => {
                setSessionSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeSubjectId]);

    if (!activeSubjectId) return null;

    const activeSubject = subjects.find(s => s.id === activeSubjectId);
    if (!activeSubject) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-[#1a1a1a] text-neutral-200 h-screen w-screen overflow-hidden touch-none flex flex-col md:flex-row">

            {/* Top Bar for Mobile / Top Left for Desktop */}
            <div className="absolute top-6 left-6 z-10">
                <Menu size={24} className="text-neutral-400" />
            </div>

            {/* Main Content Center */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">

                {/* Focusing Label */}
                <div className="mb-4 text-center">
                    <span className="text-neutral-300 text-lg font-normal tracking-wide">Focusing</span>
                </div>

                {/* Big Session Timer */}
                <div className="text-[15vw] md:text-8xl font-sans tabular-nums font-normal text-white mb-12 tracking-wide leading-none select-none">
                    {formatTime(sessionSeconds)}
                </div>

                {/* Grid Stats */}
                <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-center w-full max-w-md">
                     <span className="text-neutral-500 text-sm font-normal truncate">{activeSubject.name}</span>
                     <span className="text-neutral-500 text-sm font-normal">Today</span>

                     <span className="text-2xl md:text-3xl font-sans font-light text-neutral-300 tabular-nums">
                        {formatTime(activeSubject.totalTimeToday)}
                     </span>
                     <span className="text-2xl md:text-3xl font-sans font-light text-neutral-300 tabular-nums">
                         {formatTime(todayTotalTime)}
                     </span>
                </div>
            </div>

            {/* Pause Button - Floating Right Center on Desktop, Bottom Center on Mobile */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:translate-x-0 md:static md:flex md:items-center md:justify-center md:pr-24">
                 <button
                    onClick={stopTimer}
                    className="w-24 h-24 rounded-full bg-[#D6D6D6] hover:bg-white text-black flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-2xl cursor-pointer"
                >
                    <Pause size={40} fill="currentColor" className="ml-1" />
                </button>
            </div>

        </div>
    );
};

export default FocusMode;
