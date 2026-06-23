import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Plus, X, Building2, User, Search, ArrowUp, ArrowDown } from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  hod?: { username: string; email: string };
  createdAt: string;
}

export default function VCDashboard() {
  const { tabId } = useParams();
  const activeTab = tabId || 'hierarchy';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', hodEmail: '', hodFullName: '' });

  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptSortBy, setDeptSortBy] = useState<'name' | 'hod' | 'createdAt'>('name');
  const [deptSortOrder, setDeptSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'departments') {
      fetchDepartments();
    }
  }, [activeTab]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', form);
      toast.success(`Department ${form.name} created successfully!`);
      setShowModal(false);
      setForm({ name: '', hodEmail: '', hodFullName: '' });
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAndSortedDepartments = departments.filter(d => {
    const q = deptSearchQuery.toLowerCase();
    const name = (d.name || '').toLowerCase();
    const hodName = (d.hod?.username || '').toLowerCase();
    const hodEmail = (d.hod?.email || '').toLowerCase();
    return name.includes(q) || hodName.includes(q) || hodEmail.includes(q);
  }).sort((a, b) => {
    let valA: any = '';
    let valB: any = '';
    if (deptSortBy === 'name') {
      valA = (a.name || '').toLowerCase();
      valB = (b.name || '').toLowerCase();
    } else if (deptSortBy === 'hod') {
      valA = (a.hod?.username || '').toLowerCase();
      valB = (b.hod?.username || '').toLowerCase();
    } else if (deptSortBy === 'createdAt') {
      valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    }
    if (valA < valB) return deptSortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return deptSortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <AppLayout title="Vice Chancellor Dashboard">

      {activeTab === 'hierarchy' ? (
        <OrgHierarchy />
      ) : (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: '1rem' }}>University Departments</h2>
              <p className="text-muted text-sm">Manage academic departments and assign Heads of Department</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 380 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="text" 
                  placeholder="Search departments..." 
                  value={deptSearchQuery}
                  onChange={e => setDeptSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 30, height: 32, fontSize: '13px' }}
                />
              </div>
              <select
                value={deptSortBy}
                onChange={e => setDeptSortBy(e.target.value as any)}
                className="form-input"
                style={{ height: 32, fontSize: '13px', minWidth: 120, padding: '0 8px' }}
              >
                <option value="name">Sort: Name</option>
                <option value="hod">Sort: HOD Name</option>
                <option value="createdAt">Sort: Added On</option>
              </select>
              <button 
                className="btn"
                onClick={() => setDeptSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                style={{ height: 32, width: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', padding: 0, boxSizing: 'border-box', flexShrink: 0 }}
              >
                {deptSortOrder === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowModal(true)}
                style={{ height: 32, padding: '0 12px', fontSize: '0.8rem', lineHeight: 1, display: 'inline-flex', alignItems: 'center', gap: 6, boxSizing: 'border-box' }}
              >
                <Plus size={13} /> Add Department
              </button>
            </div>
          </div>
          
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>HOD Assigned</th>
                  <th>HOD Email</th>
                  <th>Added On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : departments.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No departments configured.</td></tr>
                ) : filteredAndSortedDepartments.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No departments match your search.</td></tr>
                ) : filteredAndSortedDepartments.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Building2 size={16} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{d.name}</span>
                      </div>
                    </td>
                    <td>
                      {d.hod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.6rem' }}>
                            {d.hod.username.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.hod.username}</span>
                        </div>
                      ) : (
                        <span className="badge badge-inactive">No HOD</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">{d.hod?.email || '—'}</td>
                    <td className="text-sm text-muted">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Create Department & Assign HOD</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateDept}>
              <div className="modal-body">
                <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
                  <span>Creating a department will automatically generate a new HOD account with a default password of <strong>password123</strong>.</span>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    required 
                    placeholder="e.g. Computer Science" 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                    autoFocus 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">HOD Email Address *</label>
                  <input 
                    className="form-input" 
                    type="email" 
                    required 
                    placeholder="hod@university.edu.in" 
                    value={form.hodEmail} 
                    onChange={e => setForm(f => ({ ...f, hodEmail: e.target.value }))} 
                  />
                  <p className="form-hint">This email will be used for the HOD to log in.</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Creating...</> : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
