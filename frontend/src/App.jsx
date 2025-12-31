import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import NodeConfig from './pages/NodeConfig';
import HealthStatus from './pages/HealthStatus';
import SecuritySettings from './pages/SecuritySettings';
import ServerSettings from './pages/ServerSettings';
import Login from './pages/Login';
import GPIOPage from './pages/GPIOPage';

const queryClient = new QueryClient();

const App = () => {
  // Check if user has a valid token in localStorage
  const isAuthenticated = !!localStorage.getItem('opcua_token');

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}
          >
            <Route index element={<Dashboard />} />
            <Route path="gpio" element={<GPIOPage />} />
            <Route path="nodes" element={<NodeConfig />} />
            <Route path="health" element={<HealthStatus />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="settings" element={<ServerSettings />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
