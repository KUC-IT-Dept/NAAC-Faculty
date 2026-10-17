/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/LibraryPage.tsx
//
// CRUD UI for the Library institutional module (modules/library on the
// backend). Reuses the existing design system classes (card, btn, badge,
// table-wrap, modal, form-*) rather than introducing new styles, and the
// existing useConfirmDelete hook for the delete confirmation, matching
// AdminGeneral.tsx / AdminDashboard.tsx conventions elsewhere in this app.
//
// No file upload UI here - the backend stores upload URLs as plain string
// fields (LibraryRecord.uploads, staffing.orientationPrograms.photoUploads)
// but wiring an actual upload endpoint was explicitly deferred to a later
// phase (see the Phase 3 report), so this form does not attempt it either.
import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import { useAuth } from '../../context/AuthContext';
import { libraryApi, LibraryRecord } from '../../lib/institutionalApi';
import LibraryWizard from './LibraryWizard';
import RecordFields from './RecordViewer';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import { useConfirmDelete } from '../../components/useConfirmDelete';

export default function LibraryPage() {
  const { user } = useAuth();
  const canAccess = user?.role === 'admin' || user?.role === 'librarian' || (user?.modulePermissions || []).includes('library');

  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<LibraryRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<LibraryRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirmDelete, ConfirmDialog } = useConfirmDelete();

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await libraryApi.list();
      setRecords(data);
    } catch (err: any) {
      setLoadError(err.response?.status === 403 ? 'You do not have permission to view Library records.' : 'Failed to load Library records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) load();
    else setLoading(false);
  }, [canAccess]);

  const openCreate = () => { setEditingRecord(null); setFormOpen(true); };
  const openEdit = (r: LibraryRecord) => { setEditingRecord(r); setFormOpen(true); };

  const handleSave = async (payload: any, editingYear: string | null) => {
    setSaving(true);
    try {
      if (editingYear) {
        await libraryApi.update(editingYear, payload);
        toast.success('Library record updated.');
      } else {
        await libraryApi.create(payload);
        toast.success('Library record created.');
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save Library record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (r: LibraryRecord) => {
    confirmDelete(async () => {
      try {
        await libraryApi.remove(r.academicYear);
        toast.success('Library record deleted.');
        load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete Library record.');
      }
    }, `This will permanently delete the Library record for ${r.academicYear}.`, 'Delete Library Record');
  };

  if (!canAccess) {
    return (
      <AppLayout title="Library">
        <div className="card">
          <div className="card-body" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            You do not have permission to access the Library module.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Library">
      {!formOpen && <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Library Records</h2>
              <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>One record per academic year (NAAC criterion 0.9)</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate} title="Create a new annual Library record">
            <Plus size={14} /> Add Record
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Librarian</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></td></tr>
                ) : loadError ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--danger, #dc2626)' }}>{loadError}</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No Library records yet.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.academicYear}</td>
                    <td>{r.librarian?.name || '—'}</td>
                    <td className="text-sm text-muted">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setViewing(r)}><Eye size={14} /></button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}><Pencil size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Library — {viewing.academicYear}</h3>
              <button className="btn-icon" onClick={() => setViewing(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <RecordFields data={viewing} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewing(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <LibraryWizard
          record={editingRecord}
          saving={saving}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <ConfirmDialog />
    </AppLayout>
  );
}
