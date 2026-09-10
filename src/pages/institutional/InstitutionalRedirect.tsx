// src/pages/institutional/InstitutionalRedirect.tsx
//
// Landing point for the 'staff' role (and a safe fallback for 'admin' if
// they ever navigate to the bare /institutional path). Admin
// (superadmin/iqac_director) has both modules by role bypass, so it just
// sends them to Library by default. Staff is routed to whichever module
// their modulePermissions actually include; if they have neither, a plain
// message is shown rather than silently redirecting into a page they will
// only see a 403 on - the backend remains authoritative either way, this
// is purely to avoid a confusing bounce.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/AppLayout';

export default function InstitutionalRedirect() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/institutional/library" replace />;
  }

  const perms = user?.modulePermissions || [];
  if (perms.includes('library')) {
    return <Navigate to="/institutional/library" replace />;
  }
  if (perms.includes('mmttc')) {
    return <Navigate to="/institutional/mmttc" replace />;
  }

  return (
    <AppLayout title="Institutional">
      <div className="card">
        <div className="card-body" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          You do not currently have access to any institutional module. Contact an administrator if you believe this is incorrect.
        </div>
      </div>
    </AppLayout>
  );
}
