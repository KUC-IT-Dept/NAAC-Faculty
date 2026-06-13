/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Users, BookOpen, Plus, Eye, Check, XCircle, Search, X } from 'lucide-react';

const dropdownKeyToFormMap: Record<string, string> = {
  genderOptions: '01 - Personal Information',
  departmentOptions: '04 - Employment Details',
  designationOptions: '04 - Employment Details',
  // Note: Copied a subset for brevity, add full map if needed or export it
  publicationTypeOptions: '05 - Research & Publications',
  fundingAgencyOptions: '07 - Research Projects',
};

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  isFirstLogin: boolean;
  profile?: {
    personalInfo?: { fullName?: string; designation?: string; department?: string; photoUrl?: string };
    employmentDetails?: { designation?: string; department?: string };
    profileComplete?: boolean;
    completionPercentage?: number;
  };
}

export default function HODDashboard() {
  const { tabId } = useParams();
  const activeTab = tabId || 'hierarchy';
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'approve' | 'reject'; requestId: string; message: string }>({ isOpen: false, type: 'approve', requestId: '', message: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes] = await Promise.all([
        api.get('/hod/faculty'),
        api.get('/hod/option-requests')
      ]);
      setFaculty(fRes.data);
      setRequests(rRes.data);
    } catch (err) {
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/hod/faculty', form);
      toast.success(`Account created for ${form.email}`);
      setShowModal(false);
      setForm({ email: '', fullName: '' });
      fetchData();
    } catch (e: any) { 
      toast.error(e.response?.data?.message || 'Creation failed'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleRequestAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { requestId, type, message } = actionModal;

    setSubmitting(true);
    try {
      await api.patch(`/hod/option-requests/${requestId}/${type}`, { adminMessage: message });
      toast.success(`Request ${type}d successfully`);
      fetchData();
      setActionModal({ ...actionModal, isOpen: false });
    } catch (err) {
      toast.error(`Failed to ${type} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (r.status !== 'PENDING') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.user?.username?.toLowerCase() || '';
    const email = r.user?.email?.toLowerCase() || '';
    const val = r.requestedValue?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || val.includes(q);
  });

  return (
    <AppLayout title="Head of Department Dashboard">

      {activeTab === 'hierarchy' ? (
        <OrgHierarchy />
      ) : activeTab === 'faculty' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Department Faculty</h2>
              <p className="text-muted text-sm">Manage faculty members in your department</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : faculty.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No faculty accounts yet. Add one above.</td></tr>
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
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" title="View public profile" onClick={() => window.open(`/profile/${f.username}`, '_blank')} style={{ padding: '6px' }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'requests' || activeTab === 'notifications' ? (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>Pending Requests</h2>
              <p className="text-muted text-sm">Review dropdown option requests from your faculty</p>
            </div>
            <div style={{ position: 'relative', width: 250 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input 
                type="text" 
                placeholder="Search requests..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
              />
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pending requests.</td></tr>
                ) : filteredRequests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.user?.username}</div>
                      <div className="text-xs text-muted">{r.user?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4, fontSize: '0.85rem' }}>
                        {dropdownKeyToFormMap[r.dropdownKey] || 'Dropdown Form'}
                      </div>
                      <span className="badge badge-secondary">{r.dropdownKey}</span>
                    </td>
                    <td><strong style={{ color: 'var(--primary)' }}>{r.requestedValue}</strong></td>
                    <td className="text-sm text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

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
                  <span>Faculty will be added to your department and receive a default password of <strong>password123</strong>.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input className="form-input" type="email" required placeholder="faculty@university.edu.in" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} autoFocus />
                  <p className="form-hint">Username will be auto-generated from the email address.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name (Optional)</label>
                  <input className="form-input" type="text" placeholder="e.g. Dr. Jane Smith" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
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
