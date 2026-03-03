import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TimerProvider } from '@/context/TimerContext';
import FocusMode from '../FocusMode';

const Layout = () => {
  return (
    <TimerProvider>
      <div className="min-h-screen bg-neutral-bg text-white font-sans">
        <Sidebar />
        <main className="ml-sidebar min-h-screen">
          <div className="max-w-[960px] mx-auto w-full px-8 py-8">
            <Outlet />
          </div>
        </main>
        <FocusMode />
      </div>
    </TimerProvider>
  );
};

export default Layout;
