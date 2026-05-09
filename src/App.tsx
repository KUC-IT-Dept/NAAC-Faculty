import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import { EditProfileLayout, AdminProfileSection } from './pages/admin/AdminProfileManagement';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProfileSetup from './pages/faculty/ProfileSetup';
import ProfileEdit from './pages/faculty/ProfileEdit';
import PublicProfile from './pages/PublicProfile';

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'faculty' }) {
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
  if (loading) return null;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/faculty/dashboard'} replace /> : <LoginPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/edit-profile" element={<ProtectedRoute role="admin"><EditProfileLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/edit-profile/personal-information" replace />} />
        <Route path=":sectionId" element={<AdminProfileSection />} />
      </Route>

      {/* Faculty */}
      <Route path="/faculty/setup" element={<ProtectedRoute role="faculty"><ProfileSetup /></ProtectedRoute>} />
      <Route path="/faculty/dashboard" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
      <Route path="/faculty/profile/edit" element={<Navigate to="/faculty/profile/edit/personal-information" replace />} />
      <Route path="/faculty/profile/edit/:sectionId" element={<ProtectedRoute role="faculty"><ProfileEdit /></ProtectedRoute>} />

      {/* Public — no auth */}
      <Route path="/profile/:username" element={<PublicProfile />} />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/faculty/dashboard') : '/login'} replace />}
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
