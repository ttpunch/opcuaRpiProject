import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="gpio" element={<GPIOPage />} />
              <Route path="nodes" element={<NodeConfig />} />
              <Route path="health" element={<HealthStatus />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="settings" element={<ServerSettings />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

const ProtectedRoute = () => {
  const isAuthenticated = !!localStorage.getItem('opcua_token');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default App;
