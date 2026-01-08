import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RoutesPage from './pages/RoutesPage';
import TrucksPage from './pages/TrucksPage';
import ParcelsPage from './pages/ParcelsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AlertsPage from './pages/AlertsPage';
import VoiceAssistantPage from './pages/VoiceAssistantPage';
import WorkflowsPage from './pages/WorkflowsPage';
import OpsSummaryPage from './pages/OpsSummaryPage';
import { API_BASE_URL } from './api/config';
import './App.css';

function App() {
  const [health, setHealth] = useState('Checking backend...');

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
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '8px 12px',
        background: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        {health}
      </div>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="trucks" element={<TrucksPage />} />
          <Route path="parcels" element={<ParcelsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="assistant" element={<VoiceAssistantPage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="ops" element={<OpsSummaryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
