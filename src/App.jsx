import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import TeamDashboard from './pages/TeamDashboard';
import AdminRoute from './pages/AdminRoute';
import FullscreenToggle from './components/FullscreenToggle';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <HashRouter>
          <FullscreenToggle />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/team/:teamId" element={<TeamDashboard />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
