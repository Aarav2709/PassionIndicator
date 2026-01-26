import { NavLink } from 'react-router-dom';
import { Timer, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-surface border-t border-neutral-border py-2 px-6 flex justify-around items-center z-40 lg:justify-center lg:gap-24">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            isActive ? "text-primary" : "text-neutral-muted hover:text-neutral-text"
          )
        }
      >
        <Timer size={24} />
        <span className="text-xs font-medium">Timer</span>
      </NavLink>

      <NavLink
        to="/insights"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
            isActive ? "text-primary" : "text-neutral-muted hover:text-neutral-text"
          )
        }
      >
        <BarChart2 size={24} />
        <span className="text-xs font-medium">Insights</span>
      </NavLink>
    </div>
  );
};

export default BottomNav;
