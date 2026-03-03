import { NavLink } from 'react-router-dom';
import { Timer, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/context/TimerContext';

const NAV_ITEMS = [
  { to: '/', icon: Timer, label: 'Timer', end: true },
  { to: '/insights', icon: BarChart3, label: 'Statistics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const { todayTotalFocus, formatTime, subjects } = useTimer();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-sidebar bg-neutral-surface border-r border-neutral-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-neutral-border">
        <h1 className="text-base font-bold text-white tracking-tight">PassionIndicator</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'ypt-nav-item',
                isActive && 'ypt-nav-item-active'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Today's Summary */}
      <div className="px-4 pb-4">
        <div className="bg-neutral-bg rounded-xl p-4 border border-neutral-border">
          <div className="text-[11px] text-neutral-muted uppercase tracking-wider font-semibold mb-2">
            Today's Focus
          </div>
          <div className="text-2xl font-mono font-bold text-white tabular-nums tracking-tight">
            {formatTime(todayTotalFocus)}
          </div>
          <div className="mt-3 space-y-1.5">
            {subjects.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', s.color)} />
                  <span className="text-neutral-muted truncate max-w-[100px]">{s.name}</span>
                </div>
                <span className="font-mono text-white/70 tabular-nums">{formatTime(s.todayTime)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
