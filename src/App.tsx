import { TimerProvider } from '@/context/TimerContext';
import Dashboard from '@/pages/Dashboard';
import StudyOverlay from '@/components/StudyOverlay';

function App() {
  return (
    <TimerProvider>
      <Dashboard />
      <StudyOverlay />
    </TimerProvider>
  );
}

export default App;
