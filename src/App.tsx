import { useEffect, useState } from 'react';
import { TimerProvider, useTimer } from '@/context/TimerContext';
import Nav, { Page } from '@/components/ui/Nav';
import Home from '@/pages/Home';
import Logbook from '@/pages/Logbook';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';
import BoardingSheet from '@/components/flight/BoardingSheet';
import InFlight from '@/components/flight/InFlight';
import Arrival from '@/components/flight/Arrival';

const PAGES: Record<string, Page> = { '#/logbook': 'logbook', '#/stats': 'stats', '#/settings': 'settings' };

// hash routing keeps vercel and file previews happy without a router dependency
const pageFromHash = (): Page => PAGES[window.location.hash] ?? 'timer';

const Layers = () => {
  const { boardingSubjectId } = useTimer();
  return (
    <>
      {boardingSubjectId && <BoardingSheet key={boardingSubjectId} />}
      <InFlight />
      <Arrival />
    </>
  );
};

function App() {
  const [page, setPage] = useState<Page>(pageFromHash);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <TimerProvider>
      <div className="flex h-full">
        <Nav page={page} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          {page === 'logbook' ? <Logbook /> : page === 'stats' ? <Stats /> : page === 'settings' ? <Settings /> : <Home />}
        </main>
      </div>
      <Layers />
    </TimerProvider>
  );
}

export default App;
