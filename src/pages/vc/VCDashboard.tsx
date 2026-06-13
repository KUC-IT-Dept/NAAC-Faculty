import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import OrgHierarchy from '../../components/admin/OrgHierarchy';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { Plus, X, Building2, User } from 'lucide-react';

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
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Department
            </button>
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
                ) : departments.map(d => (
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
