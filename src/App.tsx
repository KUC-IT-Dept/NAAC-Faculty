import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGeneral from './pages/admin/AdminGeneral';
import StudentRequest from './pages/admin/StudentRequest';
import { EditProfileLayout, AdminProfileSection } from './pages/admin/AdminProfileManagement';
import SpecialResponsibilities from './pages/admin/SpecialResponsibilities';
import InstitutionalAccounts from './pages/admin/InstitutionalAccounts';
import BenchmarkImport from './pages/admin/BenchmarkImport';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import ProfileSetup from './pages/faculty/ProfileSetup';
import ProfileEdit from './pages/faculty/ProfileEdit';
import PublicProfile from './pages/PublicProfile';
import VCDashboard from './pages/vc/VCDashboard';
import DepartmentDetails from './pages/vc/DepartmentDetails';
import HODDashboard from './pages/hod/HODDashboard';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import LibraryPage from './pages/institutional/LibraryPage';
import MMTTCPage from './pages/institutional/MMTTCPage';
import InstitutionalRedirect from './pages/institutional/InstitutionalRedirect';
import { useAppBootstrap } from './lib/useAppBootstrap';
import InitialLoadingScreen from './components/InitialLoadingScreen';

type Role = 'admin' | 'faculty' | 'vc' | 'hod' | 'staff' | 'librarian' | 'mmttc_director';

// role now accepts a single role (unchanged existing behavior) OR an array
// of roles (Phase 5 addition - Library/MMTTC pages are reachable by both
// 'admin' (superadmin/iqac_director) and 'staff'). This is a
// backward-compatible generalization of the existing mechanism, not a new
// permission model - a plain string still behaves exactly as before.
function ProtectedRoute({ children, role }: { children: ReactElement; role?: Role | Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <InitialLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role) {
    const allowed = Array.isArray(role) ? role.includes(user.role) : user.role === role;
    if (!allowed) return <Navigate to="/login" replace />;
  }
  return children;
}

function homeForRole(user: { role: Role } | null) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin/accounts';
  if (user.role === 'vc') return '/vc/hierarchy';
  if (user.role === 'hod') return '/hod/hierarchy';
  if (user.role === 'staff') return '/institutional';
  if (user.role === 'librarian') return '/institutional/library';
  if (user.role === 'mmttc_director') return '/institutional/mmttc';
  return '/faculty/dashboard';
}

function AppRoutes() {
  const { user, loading } = useAuth();
  // Real startup work only (session restore, /health, dropdown options).
  // Bounded by timeouts in the hook so the loader can never hang forever.
  const { status, error, progress, retry } = useAppBootstrap(!loading);

  // The loader is an overlay: once ready, the routes mount immediately and
  // the overlay fades out on top of them (no added wait).
  const loader = (
    <InitialLoadingScreen
      error={status === 'error' ? error : undefined}
      onRetry={retry}
      progress={progress}
      ready={status === 'ready'}
    />
  );

  return (
    <>
    {/* Routes mount only once startup is ready; the loader element keeps the
        same position in the tree so it fades out instead of remounting. */}
    {status === 'ready' && (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={homeForRole(user)} replace /> : <LoginPage />}
      />

      {/* Admin */}
      <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />
      <Route path="/admin/student-request" element={<ProtectedRoute role="admin"><StudentRequest /></ProtectedRoute>} />
      <Route path="/admin/:tabId" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/general" element={<ProtectedRoute role="admin"><AdminGeneral /></ProtectedRoute>} />
      <Route path="/admin/benchmark-import" element={<ProtectedRoute role="admin"><BenchmarkImport /></ProtectedRoute>} />
      <Route path="/admin/institutional-accounts" element={<ProtectedRoute role="admin"><InstitutionalAccounts /></ProtectedRoute>} />
      {/* Legacy faculty module grants stay manageable here, but the page is no longer in the sidebar. */}
      <Route path="/admin/special-responsibilities" element={<ProtectedRoute role="admin"><SpecialResponsibilities /></ProtectedRoute>} />
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
      {/* Special responsibility pages: reuse the existing LibraryPage/
          MMTTCPage components as-is (same backend, same forms) - they
          already self-check user.modulePermissions and render an "Access
          Denied" card if the specific faculty member wasn't granted the
          responsibility, on top of the 403 the backend itself returns. */}
      <Route path="/faculty/library" element={<ProtectedRoute role="faculty"><LibraryPage /></ProtectedRoute>} />
      <Route path="/faculty/mmttc" element={<ProtectedRoute role="faculty"><MMTTCPage /></ProtectedRoute>} />

      {/* VC */}
      <Route path="/vc" element={<Navigate to="/vc/hierarchy" replace />} />
      <Route path="/vc/:tabId" element={<ProtectedRoute role="vc"><VCDashboard /></ProtectedRoute>} />
      <Route path="/vc/department/:name" element={<ProtectedRoute role="vc"><DepartmentDetails /></ProtectedRoute>} />

      {/* HOD */}
      <Route path="/hod" element={<Navigate to="/hod/hierarchy" replace />} />
      <Route path="/hod/:tabId" element={<ProtectedRoute role="hod"><HODDashboard /></ProtectedRoute>} />

      {/* Analytics — accessible by hod, vc, admin */}
      <Route path="/hod/analytics"   element={<ProtectedRoute role="hod"><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/vc/analytics"    element={<ProtectedRoute role="vc"><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AnalyticsDashboard /></ProtectedRoute>} />

      {/* Institutional / NAAC (Phase 5) — reachable by admin (superadmin/
          iqac_director, via the existing role coercion) and by staff (whose
          modulePermissions determine which of these two pages actually
          shows usable data - see LibraryPage/MMTTCPage for the client-side
          permission check, backed by the server's own 403 either way). */}
      <Route path="/institutional" element={<ProtectedRoute role={['admin', 'staff', 'librarian', 'mmttc_director']}><InstitutionalRedirect /></ProtectedRoute>} />
      <Route path="/institutional/library" element={<ProtectedRoute role={['admin', 'staff', 'librarian']}><LibraryPage /></ProtectedRoute>} />
      <Route path="/institutional/mmttc" element={<ProtectedRoute role={['admin', 'staff', 'mmttc_director']}><MMTTCPage /></ProtectedRoute>} />

      {/* Public — no auth */}
      <Route path="/profile/:username" element={<PublicProfile />} />

      {/* Default redirect */}
      <Route
        path="/"
        element={<Navigate to={user ? homeForRole(user) : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    )}
    {loader}
    </>
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
