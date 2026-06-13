import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGeneral from './pages/admin/AdminGeneral';
import { EditProfileLayout, AdminProfileSection } from './pages/admin/AdminProfileManagement';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProfileSetup from './pages/faculty/ProfileSetup';
import ProfileEdit from './pages/faculty/ProfileEdit';
import PublicProfile from './pages/PublicProfile';
import VCDashboard from './pages/vc/VCDashboard';
import HODDashboard from './pages/hod/HODDashboard';
import { loadDropdownOptionsFromServer } from './shared/dropdownOptions';
import { useEffect } from 'react';

function ProtectedRoute({ children, role }: { children: ReactElement; role?: 'admin' | 'faculty' | 'vc' | 'hod' }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    loadDropdownOptionsFromServer();
  }, []);

  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'admin' ? '/admin/accounts' : user.role === 'vc' ? '/vc/hierarchy' : user.role === 'hod' ? '/hod/hierarchy' : '/faculty/dashboard'} replace /> : <LoginPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />
      <Route path="/admin/:tabId" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/general" element={<ProtectedRoute role="admin"><AdminGeneral /></ProtectedRoute>} />
      <Route path="/admin/edit-profile" element={<ProtectedRoute role="admin"><EditProfileLayout /></ProtectedRoute>}>
        <Route index element={
          <div style={{ padding: '48px 24px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Select one of the profile sections from the sidebar to begin editing.
          </div>
        } />
        <Route path=":sectionId" element={<AdminProfileSection />} />
      </Route>

      {/* Faculty */}
      <Route path="/faculty/setup" element={<ProtectedRoute role="faculty"><ProfileSetup /></ProtectedRoute>} />
      <Route path="/faculty/dashboard" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/profile/edit" element={<ProtectedRoute role="faculty"><ProfileEdit /></ProtectedRoute>} />
      <Route path="/faculty/profile/edit/:sectionId" element={<ProtectedRoute role="faculty"><ProfileEdit /></ProtectedRoute>} />

      {/* VC */}
      <Route path="/vc" element={<Navigate to="/vc/hierarchy" replace />} />
      <Route path="/vc/:tabId" element={<ProtectedRoute role="vc"><VCDashboard /></ProtectedRoute>} />

      {/* HOD */}
      <Route path="/hod" element={<Navigate to="/hod/hierarchy" replace />} />
      <Route path="/hod/:tabId" element={<ProtectedRoute role="hod"><HODDashboard /></ProtectedRoute>} />

      {/* Public — no auth */}
      <Route path="/profile/:username" element={<PublicProfile />} />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? (user.role === 'admin' ? '/admin/accounts' : user.role === 'vc' ? '/vc/hierarchy' : user.role === 'hod' ? '/hod/hierarchy' : '/faculty/dashboard') : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
