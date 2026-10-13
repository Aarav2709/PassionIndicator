import { BarChart3, BookOpen, Plane, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

export type Page = 'timer' | 'logbook' | 'stats' | 'settings';

const ITEMS = [
  { page: 'timer', label: 'Fly', href: '#/', icon: Plane },
  { page: 'logbook', label: 'Logbook', href: '#/logbook', icon: BookOpen },
  { page: 'stats', label: 'Stats', href: '#/stats', icon: BarChart3 },
  { page: 'settings', label: 'Settings', href: '#/settings', icon: Settings },
] as const;

const NavLink = ({ item, active, compact }: { item: (typeof ITEMS)[number]; active: boolean; compact?: boolean }) => {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl text-[10px] font-medium transition-colors',
        compact ? 'flex-1 py-2' : 'w-14 py-2.5',
        active ? 'text-white' : 'text-neutral-600 hover:text-neutral-300'
      )}
    >
      <span className={cn('flex h-8 w-10 items-center justify-center rounded-lg', active && !compact && 'bg-white/[0.08]')}>
        <Icon size={18} strokeWidth={active ? 2 : 1.75} />
      </span>
      {item.label}
    </a>
  );
};

// a side rail on desktop and a bottom tab bar on narrow windows, like the yeolpumta tab bar
const Nav = ({ page }: { page: Page }) => (
  <>
    <nav aria-label="Main" className="hairline hidden w-[76px] shrink-0 flex-col items-center border-r py-5 md:flex">
      <a href="#/" aria-label="PassionIndicator home" className="mb-8">
        <Logo />
      </a>
      <div className="flex flex-col gap-2">
        {ITEMS.slice(0, 3).map(item => (
          <NavLink key={item.page} item={item} active={page === item.page} />
        ))}
      </div>
      <div className="mt-auto">
        <NavLink item={ITEMS[3]} active={page === 'settings'} />
      </div>
    </nav>

    <nav aria-label="Main" className="hairline fixed inset-x-0 bottom-0 z-40 flex border-t bg-black/95 backdrop-blur md:hidden">
      {ITEMS.map(item => (
        <NavLink key={item.page} item={item} active={page === item.page} compact />
      ))}
    </nav>
  </>
);

export default Nav;
