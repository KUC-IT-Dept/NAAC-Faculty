/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/admin/SpecialResponsibilities.tsx
//
// Admin UI for assigning the Library / MMTTC "special responsibility" to
// individual faculty members. Backed by the existing
// auth/models/User.model.js `modulePermissions` field (the same field/
// mechanism already enforced by authorizeModule() on the Library/MMTTC
// backend routes) via the new
// GET/PUT /api/faculty/admin/special-responsibilities[/:userId] endpoints -
// no second permission system, reuses existing auth + design system.
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, BookOpen, GraduationCap, Save, Check } from 'lucide-react';

interface FacultyResponsibility {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  modulePermissions: string[];
}

export default function SpecialResponsibilities() {
  const [faculty, setFaculty] = useState<FacultyResponsibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ library: boolean; mmttc: boolean }>({ library: false, mmttc: false });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<FacultyResponsibility[]>('/admin/special-responsibilities');
      setFaculty(data);
    } catch {
      toast.error('Failed to load faculty list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faculty;
    return faculty.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q)
    );
  }, [faculty, search]);

  const selected = faculty.find(f => f.id === selectedId) || null;

  const selectFaculty = (f: FacultyResponsibility) => {
    setSelectedId(f.id);
    setDraft({
      library: f.modulePermissions.includes('library'),
      mmttc: f.modulePermissions.includes('mmttc'),
    });
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const wasLibrary = selected.modulePermissions.includes('library');
      const wasMmttc = selected.modulePermissions.includes('mmttc');

      const { data } = await api.put<{ modulePermissions: string[] }>(
        `/admin/special-responsibilities/${selected.id}`,
        draft
      );

      setFaculty(prev => prev.map(f => f.id === selected.id ? { ...f, modulePermissions: data.modulePermissions } : f));

      if (draft.library !== wasLibrary) {
        toast.success(`Library responsibility ${draft.library ? 'assigned to' : 'removed from'} ${selected.name}.`);
      }
      if (draft.mmttc !== wasMmttc) {
        toast.success(`MMTTC responsibility ${draft.mmttc ? 'assigned to' : 'removed from'} ${selected.name}.`);
      }
      if (draft.library === wasLibrary && draft.mmttc === wasMmttc) {
        toast('No changes to save.');
      }
    } catch {
      toast.error('Failed to update special responsibilities.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Special Faculty Responsibilities">
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Search Faculty</h2>
          <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>
            Select a faculty member to assign or remove Library / MMTTC management access.
          </p>
        </div>
        <div className="card-body">
          <div className="form-group" style={{ position: 'relative', maxWidth: 420 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selected && (
            <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600 }}>{selected.name}</div>
              <div className="text-sm text-muted">{selected.email}</div>
              <div className="text-sm text-muted">{selected.department || 'No department set'}{selected.designation ? ` · ${selected.designation}` : ''}</div>

              <div style={{ display: 'flex', gap: 24, margin: '16px 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.library}
                    onChange={(e) => setDraft(d => ({ ...d, library: e.target.checked }))}
                  />
                  <BookOpen size={16} /> Library
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={draft.mmttc}
                    onChange={(e) => setDraft(d => ({ ...d, mmttc: e.target.checked }))}
                  />
                  <GraduationCap size={16} /> MMTTC
                </label>
              </div>

              <button className="btn btn-primary btn-sm" disabled={saving} onClick={save}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Responsibilities'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Currently Assigned</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'center' }}>Library</th>
                  <th style={{ textAlign: 'center' }}>MMTTC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No faculty found.</td></tr>
                ) : filtered.map(f => (
                  <tr
                    key={f.id}
                    onClick={() => selectFaculty(f)}
                    style={{ cursor: 'pointer', background: f.id === selectedId ? 'var(--bg)' : undefined }}
                  >
                    <td style={{ fontWeight: 600 }}>{f.name}</td>
                    <td className="text-sm text-muted">{f.email}</td>
                    <td className="text-sm text-muted">{f.department || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{f.modulePermissions.includes('library') ? <Check size={16} color="var(--primary)" /> : '—'}</td>
                    <td style={{ textAlign: 'center' }}>{f.modulePermissions.includes('mmttc') ? <Check size={16} color="var(--primary)" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
