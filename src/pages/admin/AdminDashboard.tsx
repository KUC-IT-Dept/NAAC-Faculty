/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Users, UserCheck, UserX, BookOpen, Plus, Trash2, ToggleLeft, ToggleRight, X, Eye, Check, XCircle, MessageSquare, RefreshCw, Search, Clock3 } from 'lucide-react';
import OrgHierarchy from '../../components/admin/OrgHierarchy';

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt: string;
  profile?: {
    personalInfo?: { fullName?: string; designation?: string; department?: string; photoUrl?: string };
    employmentDetails?: { designation?: string; department?: string };
    profileComplete?: boolean;
    completionPercentage?: number;
  };
}

interface Stats { total: number; active: number; inactive: number; profilesComplete: number; }

export default function AdminDashboard() {
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, inactive: 0, profilesComplete: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'accounts' | 'hierarchy' | 'requests'>('accounts');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  // For action modals
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'approve' | 'reject'; requestId: string; message: string }>({ isOpen: false, type: 'approve', requestId: '', message: '' });

  const fetchData = async () => {
    try {
      const [fRes, sRes, rRes] = await Promise.all([api.get('/admin/faculty'), api.get('/admin/stats'), api.get('/admin/option-requests')]);
      setFaculty(fRes.data);
      setStats(sRes.data);
      setRequests(rRes.data);
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

  const handleRequestAction = async (e?: React.FormEvent, overrideId?: string, overrideType?: 'undo') => {
    if (e) e.preventDefault();
    const requestId = overrideId || actionModal.requestId;
    const type = overrideType || actionModal.type;
    const message = actionModal.message;

    setSubmitting(true);
    try {
      if (overrideType === 'undo') {
        await api.patch(`/admin/option-requests/${requestId}/undo`);
      } else {
        await api.patch(`/admin/option-requests/${requestId}/${type}`, { adminMessage: message });
      }
      toast.success(`Request ${type === 'undo' ? 'undone' : type + 'd'} successfully`);
      fetchData();
      if (!overrideType) setActionModal({ ...actionModal, isOpen: false });
      
      // Inform users to refresh if they want the new options immediately
      if (type === 'approve' || type === 'undo') {
        window.dispatchEvent(new CustomEvent('dropdownOptionsUpdated')); 
      }
    } catch (err) {
      toast.error(`Failed to ${type} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const statCards = [
    { label: 'Total Faculty', value: stats.total, icon: <Users size={20} />, color: 'var(--primary)', bg: 'rgba(15,76,117,0.1)' },
    { label: 'Active', value: stats.active, icon: <UserCheck size={20} />, color: 'var(--success)', bg: 'rgba(5,150,105,0.1)' },
    { label: 'Inactive', value: stats.inactive, icon: <UserX size={20} />, color: 'var(--danger)', bg: 'rgba(229,62,62,0.1)' },
    { label: 'Profiles Complete', value: stats.profilesComplete, icon: <BookOpen size={20} />, color: 'var(--accent)', bg: 'rgba(232,160,32,0.12)' },
  ];

  const filteredRequests = requests.filter(r => {
    const matchesStatus = showHistory ? (r.status !== 'PENDING') : (r.status === 'PENDING');
    if (!matchesStatus) return false;
    
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.user?.username?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const category = r.dropdownKey?.toLowerCase() || '';
    const val = r.requestedValue?.toLowerCase() || '';
    const date = new Date(r.createdAt).toLocaleDateString().toLowerCase();
    
    return name.includes(q) || email.includes(q) || category.includes(q) || val.includes(q) || date.includes(q);
  });

  return (
    <AppLayout title={activeTab === 'accounts' ? 'Admin Dashboard' : 'Org Hierarchy'}>
      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#e2e8f0', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'accounts' ? '#ffffff' : 'transparent',
            color: activeTab === 'accounts' ? '#0f172a' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: activeTab === 'accounts' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Faculty Accounts
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'hierarchy' ? '#ffffff' : 'transparent',
            color: activeTab === 'hierarchy' ? '#0f172a' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: activeTab === 'hierarchy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Org Hierarchy
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeTab === 'requests' ? '#ffffff' : 'transparent',
            color: activeTab === 'requests' ? '#0f172a' : '#64748b',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: activeTab === 'requests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          Notifications
          {requests.filter(r => r.status === 'PENDING').length > 0 && (
            <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 10, padding: '2px 6px', fontSize: 10 }}>
              {requests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'accounts' ? (
        <>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
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
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: '1rem' }}>Faculty Accounts</h2>
                <p className="text-muted text-sm">Manage all registered faculty members</p>
              </div>
              <button id="add-faculty-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={14} /> Add Faculty
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
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                  ) : faculty.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No faculty accounts yet. Add one above.</td></tr>
                  ) : faculty.map(f => (
                    <tr key={f._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="avatar">
                            {((f.profile?.personalInfo?.fullName || f.username || '').slice(0, 2)).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{f.profile?.personalInfo?.fullName || '—'}</div>
                            <div className="text-xs text-muted">
                              {f.profile?.employmentDetails?.designation || f.profile?.personalInfo?.designation || 'Profile Incomplete'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>{f.username}</code></td>
                      <td className="text-sm text-muted" style={{ fontSize: '0.8rem' }}>{f.email}</td>
                      <td>
                        <span className={`badge ${f.profile?.profileComplete ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {f.profile?.profileComplete ? 'Complete' : f.isFirstLogin ? 'First Login' : 'Incomplete'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 80 }}>
                          <div className="progress-bar-wrap" style={{ flex: 1 }}>
                            <div className="progress-bar" style={{ width: `${f.profile?.completionPercentage || 0}%` }} />
                          </div>
                          <span className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>{f.profile?.completionPercentage || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${f.isActive ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                          {f.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="View public profile" onClick={() => window.open(`/profile/${f.username}`, '_blank')} style={{ padding: '6px' }}>
                            <Eye size={12} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            title={f.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleStatus(f._id)}
                            style={{ padding: '6px' }}
                          >
                            {f.isActive ? <ToggleRight size={14} color="var(--success)" /> : <ToggleLeft size={14} />}
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Delete" onClick={() => deleteFaculty(f._id, f.username)} style={{ padding: '6px' }}>
                            <Trash2 size={12} color="var(--danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'requests' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>{showHistory ? 'Request History' : 'Notifications (Pending Requests)'}</h2>
              <p className="text-muted text-sm">{showHistory ? 'View processed requests (Approved / Rejected)' : 'Review requests from faculty to add new custom dropdown options'}</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 250 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Search name, category, date..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
                />
              </div>
              <button 
                className="btn btn-sm"
                onClick={() => setShowHistory(!showHistory)}
                style={{ 
                  background: showHistory ? '#e2e8f0' : 'transparent', 
                  border: '1px solid #cbd5e1',
                  color: '#334155'
                }}
              >
                <Clock3 size={14} /> {showHistory ? 'View Pending' : 'History'}
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Category (Dropdown)</th>
                  <th>Requested Option</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No requests found.</td></tr>
                ) : filteredRequests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.user?.username}</div>
                      <div className="text-xs text-muted">{r.user?.email}</div>
                    </td>
                    <td><span className="badge badge-secondary">{r.dropdownKey}</span></td>
                    <td><strong style={{ color: 'var(--primary)' }}>{r.requestedValue}</strong></td>
                    <td className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      {r.status === 'PENDING' && <span className="badge badge-pending">Pending</span>}
                      {r.status === 'APPROVED' && <span className="badge badge-active">Approved</span>}
                      {r.status === 'REJECTED' && <span className="badge badge-inactive">Rejected</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {r.status === 'PENDING' ? (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                              onClick={() => setActionModal({ isOpen: true, type: 'approve', requestId: r._id, message: '' })}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                              onClick={() => setActionModal({ isOpen: true, type: 'reject', requestId: r._id, message: '' })}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleRequestAction(undefined, r._id, 'undo')}
                            title="Undo this action"
                          >
                            <RefreshCw size={14} /> Undo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <OrgHierarchy />
      )}

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
      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setActionModal({ ...actionModal, isOpen: false })}>
          <div className="modal">
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? 'Approve Request' : 'Reject Request'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActionModal({ ...actionModal, isOpen: false })}><X size={18} /></button>
            </div>
            <form onSubmit={handleRequestAction}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Message to Faculty {actionModal.type === 'reject' ? '*' : '(Optional)'}</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    required={actionModal.type === 'reject'}
                    placeholder={actionModal.type === 'reject' ? "Please provide a reason for rejection..." : "E.g. Added to the list."}
                    value={actionModal.message} 
                    onChange={e => setActionModal({ ...actionModal, message: e.target.value })} 
                    autoFocus 
                  />
                  {actionModal.type === 'reject' && (
                    <p className="form-hint" style={{ color: 'var(--danger)' }}>This message will be shown to the faculty member.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setActionModal({ ...actionModal, isOpen: false })}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn" 
                  style={actionModal.type === 'approve' ? { background: '#059669', color: 'white' } : { background: '#dc2626', color: 'white' }}
                  disabled={submitting}
                >
                  {submitting ? <><span className="spinner" /> Processing...</> : actionModal.type === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
