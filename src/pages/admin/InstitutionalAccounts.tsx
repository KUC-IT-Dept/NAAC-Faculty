/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/InstitutionalAccounts.tsx
//
// Admin page for the two dedicated institutional accounts (one Librarian,
// one MMTTC Director). Backed by /api/faculty/admin/institutional-accounts
// (admin/superadmin only). The role is chosen by the panel (URL segment),
// never by a form field. Uses the existing design-system classes.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { BookOpen, GraduationCap, Plus, Pencil, Power, KeyRound, X } from 'lucide-react';

type AccountType = 'librarian' | 'mmttc_director';

interface InstitutionalAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  isFirstLogin: boolean;
  createdAt?: string;
}

const PANELS: { type: AccountType; title: string; moduleLabel: string; icon: any }[] = [
  { type: 'librarian', title: 'Librarian Account', moduleLabel: 'Library', icon: BookOpen },
  { type: 'mmttc_director', title: 'MMTTC Director Account', moduleLabel: 'MMTTC', icon: GraduationCap },
];

const BASE = '/admin/institutional-accounts';

function AccountPanel({ type, title, moduleLabel, icon: Icon, account, onChanged }: {
  type: AccountType; title: string; moduleLabel: string; icon: any;
  account: InstitutionalAccount | null; onChanged: () => void;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  const openCreate = () => { setForm({ name: '', email: '', phone: '' }); setFormOpen(true); };
  const openEdit = () => {
    if (!account) return;
    setForm({ name: account.name, email: account.email, phone: account.phone || '' });
    setFormOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (account) {
        await api.patch(`${BASE}/${type}`, form);
        toast.success('Account updated.');
      } else {
        const { data } = await api.post(`${BASE}/${type}`, form);
        setSecret(data.temporaryPassword);
        toast.success('Account created.');
      }
      setFormOpen(false);
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save account.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    if (!account) return;
    const action = account.isActive ? 'deactivate' : 'reactivate';
    if (account.isActive && !window.confirm(`Deactivate ${account.name}? They will be unable to access the system.`)) return;
    try {
      await api.patch(`${BASE}/${type}/${action}`);
      toast.success(account.isActive ? 'Account deactivated.' : 'Account reactivated.');
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const resetPassword = async () => {
    if (!window.confirm('Generate a new temporary password? The current password will stop working.')) return;
    try {
      const { data } = await api.post(`${BASE}/${type}/reset-password`);
      setSecret(data.temporaryPassword);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={20} color="var(--primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{title}</h2>
            <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>Access limited to the {moduleLabel} module only.</p>
          </div>
        </div>
        {!account && (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Create Account</button>
        )}
      </div>

      <div className="card-body">
        {!account ? (
          <p className="text-muted" style={{ margin: 0 }}>No {title.toLowerCase()} has been created yet.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div><div className="text-muted text-sm">Name</div><div style={{ fontWeight: 600 }}>{account.name}</div></div>
              <div><div className="text-muted text-sm">Email</div><div>{account.email}</div></div>
              <div><div className="text-muted text-sm">Username</div><div>{account.username}</div></div>
              <div><div className="text-muted text-sm">Phone</div><div>{account.phone || '—'}</div></div>
              <div>
                <div className="text-muted text-sm">Status</div>
                <span className={`badge ${account.isActive ? 'badge-success' : 'badge-secondary'}`}>{account.isActive ? 'Active' : 'Deactivated'}</span>
                {account.isFirstLogin && <span className="badge badge-secondary" style={{ marginLeft: 6 }}>Never signed in</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-outline btn-sm" onClick={openEdit}><Pencil size={14} /> Edit</button>
              <button className="btn btn-outline btn-sm" onClick={resetPassword}><KeyRound size={14} /> Reset Password</button>
              <button className={`btn btn-sm ${account.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={toggleActive}>
                <Power size={14} /> {account.isActive ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => !saving && setFormOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{account ? `Edit ${title}` : `Create ${title}`}</h3>
              <button className="btn-icon" onClick={() => setFormOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (used to sign in)</label>
                <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone (10 digits, optional)</label>
                <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : account ? 'Save Changes' : 'Create Account'}</button>
            </div>
          </div>
        </div>
      )}

      {secret && (
        <div className="modal-overlay" onClick={() => setSecret(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Temporary Password</h3>
              <button className="btn-icon" onClick={() => setSecret(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-muted">Share this securely with the account holder. It is shown only once.</p>
              <code style={{ display: 'block', padding: 12, fontSize: '1.05rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, userSelect: 'all' }}>{secret}</code>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSecret(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstitutionalAccounts() {
  const [accounts, setAccounts] = useState<Record<AccountType, InstitutionalAccount | null>>({ librarian: null, mmttc_director: null });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get(BASE);
      setAccounts({ librarian: data.librarian || null, mmttc_director: data.mmttc_director || null });
    } catch {
      toast.error('Failed to load institutional accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AppLayout title="Institutional Accounts">
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" /></div>
      ) : (
        PANELS.map((p) => (
          <AccountPanel key={p.type} {...p} account={accounts[p.type]} onChanged={load} />
        ))
      )}
      <p className="text-sm text-muted">
        Faculty who were previously granted Library/MMTTC access keep it.{' '}
        <Link to="/admin/special-responsibilities">Manage legacy faculty grants</Link>.
      </p>
    </AppLayout>
  );
}
