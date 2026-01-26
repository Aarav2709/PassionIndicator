import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { TimerProvider } from '@/context/TimerContext';
import FocusMode from '../FocusMode';

const Layout = () => {
  return (
    <TimerProvider>
      <div className="min-h-screen bg-neutral-bg text-neutral-text font-sans pb-20">
        <main className="max-w-[1200px] mx-auto w-full p-4 md:p-8">
          <Outlet />
        </main>
        <BottomNav />
        <FocusMode />
      </div>
    </TimerProvider>
  );
};

export default Layout;
