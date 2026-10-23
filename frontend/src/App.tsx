import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Layout
import { AdminLayout } from './layouts/AdminLayout';

// Public & Companion Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { ReportNeedPage } from './pages/community/ReportNeedPage';

// Admin Operational Pages
import { Overview } from './pages/admin/Overview';
import { NeedsReports } from './pages/admin/NeedsReports';
import { TasksAssignments } from './pages/admin/TasksAssignments';
import { Departments } from './pages/admin/Departments';
import { Volunteers } from './pages/admin/Volunteers';
import { Resources } from './pages/admin/Resources';
import { NeedsMap } from './pages/admin/NeedsMap';
import { Analytics } from './pages/admin/Analytics';
import { AuditLog } from './pages/admin/AuditLog';
import { Settings } from './pages/admin/Settings';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/report" element={<ReportNeedPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Volunteer Portal Route */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Command Workspace Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="needs-reports" element={<NeedsReports />} />
            <Route path="tasks" element={<TasksAssignments />} />
            <Route path="departments" element={<Departments />} />
            <Route path="volunteers" element={<Volunteers />} />
            <Route path="resources" element={<Resources />} />
            <Route path="map" element={<NeedsMap />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/admin/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
