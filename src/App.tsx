import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TimerProvider } from '@/context/TimerContext';
import Dashboard from './pages/Dashboard';
import StudyOverlay from './components/StudyOverlay';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <TimerProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <StudyOverlay />
      </TimerProvider>
    </Router>
  );
}

export default App;
