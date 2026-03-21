import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import FarmerDashboard    from './pages/farmer/FarmerDashboard';
import BuyerDashboard     from './pages/buyer/BuyerDashboard';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import AdminDashboard     from './pages/admin/AdminDashboard';

function ProtectedRoute({ role, children }) {
  const session = JSON.parse(localStorage.getItem('ks_session') || 'null');
  if (!session) return <Navigate to={`/login?role=${role}`} replace />;
  if (session.role !== role) return <Navigate to={`/dashboard/${session.role}`} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboards */}
        <Route path="/dashboard/farmer"
          element={<ProtectedRoute role="farmer"><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/buyer"
          element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/organizer"
          element={<ProtectedRoute role="organizer"><OrganizerDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/admin"
          element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
