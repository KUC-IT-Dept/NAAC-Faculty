import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Users, UserCheck, UserX, BookOpen, Plus, Trash2, ToggleLeft, ToggleRight, X, Eye } from 'lucide-react';

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  profile?: {
    personalInfo?: { fullName?: string; designation?: string; department?: string };
    profileComplete?: boolean;
    completionPercentage?: number;
  };
}

interface Stats { total: number; active: number; inactive: number; profilesComplete: number; }

export default function AdminDashboard() {
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, profilesComplete: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [fRes, sRes] = await Promise.all([api.get('/admin/faculty'), api.get('/admin/stats')]);
      setFaculty(fRes.data);
      setStats(sRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStatus = async (id: string) => {
    try {
      const { data } = await api.patch(`/admin/faculty/${id}/status`);
      toast.success(data.message);
      fetchData();
    } catch { toast.error('Action failed'); }
  };

  const deleteFaculty = async (id: string, username: string) => {
    if (!confirm(`Delete account for ${username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast.success('Faculty account deleted');
      fetchData();
    } catch { toast.error('Delete failed'); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/faculty', form);
      toast.success(`Account created for ${form.email}`);
      setShowModal(false);
      setForm({ email: '', fullName: '' });
      fetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Creation failed'); }
    finally { setSubmitting(false); }
  };

  const statCards = [
    { label: 'Total Faculty', value: stats.total, icon: <Users size={20} />, color: 'var(--primary)', bg: 'rgba(15,76,117,0.1)' },
    { label: 'Active', value: stats.active, icon: <UserCheck size={20} />, color: 'var(--success)', bg: 'rgba(5,150,105,0.1)' },
    { label: 'Inactive', value: stats.inactive, icon: <UserX size={20} />, color: 'var(--danger)', bg: 'rgba(229,62,62,0.1)' },
    { label: 'Profiles Complete', value: stats.profilesComplete, icon: <BookOpen size={20} />, color: 'var(--accent)', bg: 'rgba(232,160,32,0.12)' },
  ];

  return (
    <AppLayout title="Admin Dashboard">
      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Faculty Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.1rem' }}>Faculty Accounts</h2>
            <p className="text-muted text-sm">Manage all registered faculty members</p>
          </div>
          <button id="add-faculty-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Faculty
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Faculty</th>
                <th>Username</th>
                <th>Email</th>
                <th>Profile Status</th>
                <th>Completion</th>
                <th>Account</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" /></td></tr>
              ) : faculty.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No faculty accounts yet. Add one above.</td></tr>
              ) : faculty.map(f => (
                <tr key={f._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">
                        {(f.profile?.personalInfo?.fullName || f.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.profile?.personalInfo?.fullName || '—'}</div>
                        <div className="text-xs text-muted">{f.profile?.personalInfo?.designation || 'Profile Incomplete'}</div>
                      </div>
                    </div>
                  </td>
                  <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>{f.username}</code></td>
                  <td className="text-sm text-muted">{f.email}</td>
                  <td>
                    <span className={`badge ${f.profile?.profileComplete ? 'badge-active' : 'badge-pending'}`}>
                      {f.profile?.profileComplete ? 'Complete' : f.isFirstLogin ? 'First Login' : 'Incomplete'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                      <div className="progress-bar-wrap" style={{ flex: 1 }}>
                        <div className="progress-bar" style={{ width: `${f.profile?.completionPercentage || 0}%` }} />
                      </div>
                      <span className="text-xs text-muted">{f.profile?.completionPercentage || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${f.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" title="View public profile" onClick={() => window.open(`/profile/${f.username}`, '_blank')}>
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        title={f.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStatus(f._id)}
                      >
                        {f.isActive ? <ToggleRight size={16} color="var(--success)" /> : <ToggleLeft size={16} />}
                      </button>
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => deleteFaculty(f._id, f.username)}>
                        <Trash2 size={14} color="var(--danger)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Faculty Account</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                  <span>Faculty will receive a default password of <strong>password123</strong>. They'll be prompted to change it on first login.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required placeholder="faculty@university.edu.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoFocus />
                  <p className="form-hint">Username will be auto-generated from the email address.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name (Optional)</label>
                  <input className="form-input" placeholder="Dr. First Last" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
