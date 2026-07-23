import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

import LoginPage from '@/pages/Login/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import UsersPage from '@/pages/Users/UsersPage';
import MeetingsPage from '@/pages/Meetings/MeetingsPage';
import AdminsPage from '@/pages/Admins/AdminsPage';
import LogsPage from '@/pages/Logs/LogsPage';
import StatisticsPage from '@/pages/Statistics/StatisticsPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
