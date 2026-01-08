import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RoutesPage from './pages/RoutesPage';
import TrucksPage from './pages/TrucksPage';
import ParcelsPage from './pages/ParcelsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AlertsPage from './pages/AlertsPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import WorkflowsPage from './pages/WorkflowsPage';
import OpsSummaryPage from './pages/OpsSummaryPage';
import OperationsPage from './pages/OperationsPage';
import SettingsPage from './pages/SettingsPage';
import OperationsMapPage from './pages/OperationsMapPage';
import SentinelPage from './pages/SentinelPage';
import TNOptimizer from './pages/TNOptimizer';
import { API_BASE_URL } from './api/config';
import './App.css';

// Protected Route wrapper
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [health, setHealth] = useState('Checking backend...');
  const [user, setUser] = useState(() => {
    // Check localStorage for existing session
    const saved = localStorage.getItem('tmmr_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Handle login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tmmr_user', JSON.stringify(userData));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tmmr_user');
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`);
        if (response.data) {
          setHealth(`Backend: ${response.data.status}`);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth('Backend: Disconnected');
      }
    };

    checkHealth();
  }, []);

  return (
    <BrowserRouter>
      {/* Health indicator (only show when logged in) */}
      {user && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          padding: '8px 12px',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999
        }}>
          {health}
        </div>
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
        } />

        {/* Sentinel Optimizer (public for now) */}
        <Route path="/sentinel-optimizer" element={<TNOptimizer />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="parcels" element={<ParcelsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="assistant" element={<VoiceAssistantPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="ops" element={<OpsSummaryPage />} />
          <Route path="map" element={<OperationsMapPage />} />
          <Route path="sentinel" element={<SentinelPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
