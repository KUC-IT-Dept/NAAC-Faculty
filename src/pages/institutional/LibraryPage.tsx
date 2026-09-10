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
import { getPath, setPath } from './formUtils';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Eye, Pencil, Trash2, X } from 'lucide-react';
import { useConfirmDelete } from '../../components/useConfirmDelete';

function emptyRecord(academicYear = ''): Partial<LibraryRecord> & { academicYear: string } {
  return {
    academicYear,
    librarian: { name: '', qualifications: '', yearsOfService: 0 },
    infrastructure: {
      totalFloorAreaSqFt: 0,
      seatingCapacity: { readingRooms: 0, studyCarrels: 0, digitalLabs: 0 },
      accessibility: { ramps: 0, lifts: 0, wheelchairs: 0 },
      safetyMeasures: { fireAlarms: 0, cctv: 0, emergencyExits: 0 },
      discussionRooms: 0,
      computers: 0,
      timing: { daysPerWeek: 0, fromTime: '', toTime: '', closedOnSaturday: false, closedOnSunday: false }
    },
    collections: {
      totalBooks: { subject: '', number: 0 },
      journalsAndPeriodicals: { print: 0, electronic: 0, national: 0, international: 0 },
      digitalResources: { databases: 0, ebooks: 0, institutionalRepository: 0 },
      specialCollections: { rareBooks: 0, theses: 0, manuscripts: 0 },
      annualAdditions: { newTitlesPurchased: 0, subscribed: 0 },
      contributionsByStudents: 0,
      donations: { byAlumni: 0, byStaff: 0, byOthers: 0 }
    },
    technology: {
      libraryManagementSoftware: '',
      opacAvailable: false,
      institutionalRepositoryAccess: false,
      remoteAccessFacilities: '',
      digitalLiteracyPrograms: {}
    },
    staffing: {
      supportStaffCount: 0,
      qualificationsAndTraining: '',
      userServices: '',
      orientationPrograms: { photoUploads: [] },
      workshopsAndSeminars: [],
      plagiarismChecks: []
    },
    usage: {
      footfall: { daily: 0, annual: 0 },
      circulation: { booksIssued: 0, booksReturned: 0, source: 'manual' },
      digitalResourceUsage: { totalDownloadsOrLogins: 0 },
      feedbackMechanisms: ''
    },
    compliance: {
      copyrightCompliance: false,
      dataPrivacyCompliance: false,
      disasterPreparedness: { fireSafety: '', digitalBackup: false },
      preservationMeasures: []
    },
    financial: { annualBudgetAllocation: 0, subscriptionsAndMemberships: '' },
    bestPractices: { practices: '', innovations: '', details: '' },
    uploads: []
  };
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="number" value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type="text" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function CheckField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row' }}>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <label className="form-label" style={{ margin: 0 }}>{label}</label>
    </div>
  );
}

export default function LibraryPage() {
  const { user } = useAuth();
  const canAccess = user?.role === 'admin' || (user?.modulePermissions || []).includes('library');

  const [records, setRecords] = useState<LibraryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<LibraryRecord | null>(null);
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LibraryRecord> & { academicYear: string }>(emptyRecord());
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

  const openCreate = () => {
    setEditingYear(null);
    setForm(emptyRecord());
    setFormOpen(true);
  };
  const openEdit = (r: LibraryRecord) => {
    setEditingYear(r.academicYear);
    setForm(r);
    setFormOpen(true);
  };
  const set = (path: string, value: any) => setForm((prev) => setPath(prev, path, value));

  const handleSave = async () => {
    if (!form.academicYear.trim()) {
      toast.error('Academic year is required.');
      return;
    }
    setSaving(true);
    try {
      if (editingYear) {
        await libraryApi.update(editingYear, form);
        toast.success('Library record updated.');
      } else {
        await libraryApi.create(form);
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
      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} color="var(--primary)" />
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Library Records</h2>
              <p className="text-muted text-sm" style={{ margin: '4px 0 0' }}>One record per academic year (NAAC criterion 0.9)</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={14} /> Add Year
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
      </div>

      {viewing && (
        <div className="modal-overlay" onClick={() => setViewing(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Library — {viewing.academicYear}</h3>
              <button className="btn-icon" onClick={() => setViewing(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                {JSON.stringify(viewing, null, 2)}
              </pre>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewing(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { openEdit(viewing); setViewing(null); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="modal-overlay" onClick={() => !saving && setFormOpen(false)}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{editingYear ? `Edit ${editingYear}` : 'Add Library Record'}</h3>
              <button className="btn-icon" onClick={() => setFormOpen(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="form-section">
                <h4>General</h4>
                <div className="form-row-2">
                  <TextField label="Academic Year (e.g. 2025-2026)" value={form.academicYear} onChange={(v) => set('academicYear', v)} />
                  <TextField label="Librarian Name" value={getPath(form, 'librarian.name')} onChange={(v) => set('librarian.name', v)} />
                </div>
                <div className="form-row-2">
                  <TextField label="Librarian Qualifications" value={getPath(form, 'librarian.qualifications')} onChange={(v) => set('librarian.qualifications', v)} />
                  <NumField label="Years of Service" value={getPath(form, 'librarian.yearsOfService')} onChange={(v) => set('librarian.yearsOfService', v)} />
                </div>
              </div>

              <div className="form-section">
                <h4>Infrastructure</h4>
                <div className="form-row-3">
                  <NumField label="Total Floor Area (sq ft)" value={getPath(form, 'infrastructure.totalFloorAreaSqFt')} onChange={(v) => set('infrastructure.totalFloorAreaSqFt', v)} />
                  <NumField label="Discussion Rooms" value={getPath(form, 'infrastructure.discussionRooms')} onChange={(v) => set('infrastructure.discussionRooms', v)} />
                  <NumField label="Computers" value={getPath(form, 'infrastructure.computers')} onChange={(v) => set('infrastructure.computers', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Reading Room Seats" value={getPath(form, 'infrastructure.seatingCapacity.readingRooms')} onChange={(v) => set('infrastructure.seatingCapacity.readingRooms', v)} />
                  <NumField label="Study Carrels" value={getPath(form, 'infrastructure.seatingCapacity.studyCarrels')} onChange={(v) => set('infrastructure.seatingCapacity.studyCarrels', v)} />
                  <NumField label="Digital Lab Seats" value={getPath(form, 'infrastructure.seatingCapacity.digitalLabs')} onChange={(v) => set('infrastructure.seatingCapacity.digitalLabs', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Ramps" value={getPath(form, 'infrastructure.accessibility.ramps')} onChange={(v) => set('infrastructure.accessibility.ramps', v)} />
                  <NumField label="Lifts" value={getPath(form, 'infrastructure.accessibility.lifts')} onChange={(v) => set('infrastructure.accessibility.lifts', v)} />
                  <NumField label="Wheelchairs" value={getPath(form, 'infrastructure.accessibility.wheelchairs')} onChange={(v) => set('infrastructure.accessibility.wheelchairs', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Fire Alarms" value={getPath(form, 'infrastructure.safetyMeasures.fireAlarms')} onChange={(v) => set('infrastructure.safetyMeasures.fireAlarms', v)} />
                  <NumField label="CCTV" value={getPath(form, 'infrastructure.safetyMeasures.cctv')} onChange={(v) => set('infrastructure.safetyMeasures.cctv', v)} />
                  <NumField label="Emergency Exits" value={getPath(form, 'infrastructure.safetyMeasures.emergencyExits')} onChange={(v) => set('infrastructure.safetyMeasures.emergencyExits', v)} />
                </div>
                <div className="form-row-4">
                  <NumField label="Days/Week Open" value={getPath(form, 'infrastructure.timing.daysPerWeek')} onChange={(v) => set('infrastructure.timing.daysPerWeek', v)} />
                  <TextField label="From (e.g. 09:00)" value={getPath(form, 'infrastructure.timing.fromTime')} onChange={(v) => set('infrastructure.timing.fromTime', v)} />
                  <TextField label="To (e.g. 18:00)" value={getPath(form, 'infrastructure.timing.toTime')} onChange={(v) => set('infrastructure.timing.toTime', v)} />
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <CheckField label="Closed Sat" value={getPath(form, 'infrastructure.timing.closedOnSaturday')} onChange={(v) => set('infrastructure.timing.closedOnSaturday', v)} />
                    <CheckField label="Closed Sun" value={getPath(form, 'infrastructure.timing.closedOnSunday')} onChange={(v) => set('infrastructure.timing.closedOnSunday', v)} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>Collections</h4>
                <div className="form-row-2">
                  <TextField label="Total Books — Subject" value={getPath(form, 'collections.totalBooks.subject')} onChange={(v) => set('collections.totalBooks.subject', v)} />
                  <NumField label="Total Books — Number" value={getPath(form, 'collections.totalBooks.number')} onChange={(v) => set('collections.totalBooks.number', v)} />
                </div>
                <div className="form-row-4">
                  <NumField label="Journals: Print" value={getPath(form, 'collections.journalsAndPeriodicals.print')} onChange={(v) => set('collections.journalsAndPeriodicals.print', v)} />
                  <NumField label="Journals: Electronic" value={getPath(form, 'collections.journalsAndPeriodicals.electronic')} onChange={(v) => set('collections.journalsAndPeriodicals.electronic', v)} />
                  <NumField label="Journals: National" value={getPath(form, 'collections.journalsAndPeriodicals.national')} onChange={(v) => set('collections.journalsAndPeriodicals.national', v)} />
                  <NumField label="Journals: International" value={getPath(form, 'collections.journalsAndPeriodicals.international')} onChange={(v) => set('collections.journalsAndPeriodicals.international', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Databases" value={getPath(form, 'collections.digitalResources.databases')} onChange={(v) => set('collections.digitalResources.databases', v)} />
                  <NumField label="E-books" value={getPath(form, 'collections.digitalResources.ebooks')} onChange={(v) => set('collections.digitalResources.ebooks', v)} />
                  <NumField label="Institutional Repository" value={getPath(form, 'collections.digitalResources.institutionalRepository')} onChange={(v) => set('collections.digitalResources.institutionalRepository', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Rare Books" value={getPath(form, 'collections.specialCollections.rareBooks')} onChange={(v) => set('collections.specialCollections.rareBooks', v)} />
                  <NumField label="Theses" value={getPath(form, 'collections.specialCollections.theses')} onChange={(v) => set('collections.specialCollections.theses', v)} />
                  <NumField label="Manuscripts" value={getPath(form, 'collections.specialCollections.manuscripts')} onChange={(v) => set('collections.specialCollections.manuscripts', v)} />
                </div>
                <div className="form-row-2">
                  <NumField label="New Titles Purchased" value={getPath(form, 'collections.annualAdditions.newTitlesPurchased')} onChange={(v) => set('collections.annualAdditions.newTitlesPurchased', v)} />
                  <NumField label="Subscribed" value={getPath(form, 'collections.annualAdditions.subscribed')} onChange={(v) => set('collections.annualAdditions.subscribed', v)} />
                </div>
                <div className="form-row-4">
                  <NumField label="Contributions by Students" value={getPath(form, 'collections.contributionsByStudents')} onChange={(v) => set('collections.contributionsByStudents', v)} />
                  <NumField label="Donated by Alumni" value={getPath(form, 'collections.donations.byAlumni')} onChange={(v) => set('collections.donations.byAlumni', v)} />
                  <NumField label="Donated by Staff" value={getPath(form, 'collections.donations.byStaff')} onChange={(v) => set('collections.donations.byStaff', v)} />
                  <NumField label="Donated by Others" value={getPath(form, 'collections.donations.byOthers')} onChange={(v) => set('collections.donations.byOthers', v)} />
                </div>
              </div>

              <div className="form-section">
                <h4>Technology & Digital Access</h4>
                <div className="form-row-2">
                  <TextField label="Library Management Software" value={getPath(form, 'technology.libraryManagementSoftware')} onChange={(v) => set('technology.libraryManagementSoftware', v)} />
                  <TextField label="Remote Access Facilities" value={getPath(form, 'technology.remoteAccessFacilities')} onChange={(v) => set('technology.remoteAccessFacilities', v)} />
                </div>
                <div style={{ display: 'flex', gap: 24 }}>
                  <CheckField label="OPAC Available" value={getPath(form, 'technology.opacAvailable')} onChange={(v) => set('technology.opacAvailable', v)} />
                  <CheckField label="Institutional Repository Access" value={getPath(form, 'technology.institutionalRepositoryAccess')} onChange={(v) => set('technology.institutionalRepositoryAccess', v)} />
                </div>
              </div>

              <div className="form-section">
                <h4>Staffing & Services</h4>
                <div className="form-row-2">
                  <NumField label="Support Staff Count" value={getPath(form, 'staffing.supportStaffCount')} onChange={(v) => set('staffing.supportStaffCount', v)} />
                  <TextField label="Qualifications & Training" value={getPath(form, 'staffing.qualificationsAndTraining')} onChange={(v) => set('staffing.qualificationsAndTraining', v)} />
                </div>
                <TextField label="User Services (reference desk, ILL, etc.)" value={getPath(form, 'staffing.userServices')} onChange={(v) => set('staffing.userServices', v)} />
              </div>

              <div className="form-section">
                <h4>Usage & Engagement</h4>
                <div className="form-row-2">
                  <NumField label="Daily Footfall" value={getPath(form, 'usage.footfall.daily')} onChange={(v) => set('usage.footfall.daily', v)} />
                  <NumField label="Annual Footfall" value={getPath(form, 'usage.footfall.annual')} onChange={(v) => set('usage.footfall.annual', v)} />
                </div>
                <div className="form-row-3">
                  <NumField label="Books Issued" value={getPath(form, 'usage.circulation.booksIssued')} onChange={(v) => set('usage.circulation.booksIssued', v)} />
                  <NumField label="Books Returned" value={getPath(form, 'usage.circulation.booksReturned')} onChange={(v) => set('usage.circulation.booksReturned', v)} />
                  <div className="form-group">
                    <label className="form-label">Circulation Source</label>
                    <select className="form-select" value={getPath(form, 'usage.circulation.source')} onChange={(e) => set('usage.circulation.source', e.target.value)}>
                      <option value="manual">Manual</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
                <TextField label="Feedback Mechanisms" value={getPath(form, 'usage.feedbackMechanisms')} onChange={(v) => set('usage.feedbackMechanisms', v)} />
              </div>

              <div className="form-section">
                <h4>Compliance & Precautions</h4>
                <div style={{ display: 'flex', gap: 24 }}>
                  <CheckField label="Copyright Compliance" value={getPath(form, 'compliance.copyrightCompliance')} onChange={(v) => set('compliance.copyrightCompliance', v)} />
                  <CheckField label="Data Privacy Compliance" value={getPath(form, 'compliance.dataPrivacyCompliance')} onChange={(v) => set('compliance.dataPrivacyCompliance', v)} />
                  <CheckField label="Digital Backup" value={getPath(form, 'compliance.disasterPreparedness.digitalBackup')} onChange={(v) => set('compliance.disasterPreparedness.digitalBackup', v)} />
                </div>
                <TextField label="Fire Safety Measures" value={getPath(form, 'compliance.disasterPreparedness.fireSafety')} onChange={(v) => set('compliance.disasterPreparedness.fireSafety', v)} />
              </div>

              <div className="form-section">
                <h4>Financial Status</h4>
                <div className="form-row-2">
                  <NumField label="Annual Budget Allocation" value={getPath(form, 'financial.annualBudgetAllocation')} onChange={(v) => set('financial.annualBudgetAllocation', v)} />
                  <TextField label="Subscriptions/Memberships (e.g. INFLIBNET, DELNET)" value={getPath(form, 'financial.subscriptionsAndMemberships')} onChange={(v) => set('financial.subscriptionsAndMemberships', v)} />
                </div>
              </div>

              <div className="form-section">
                <h4>Best Practices / Innovations</h4>
                <TextField label="Best Practices" value={getPath(form, 'bestPractices.practices')} onChange={(v) => set('bestPractices.practices', v)} />
                <TextField label="Innovations" value={getPath(form, 'bestPractices.innovations')} onChange={(v) => set('bestPractices.innovations', v)} />
                <div className="form-group">
                  <label className="form-label">Details</label>
                  <textarea className="form-textarea" value={getPath(form, 'bestPractices.details') || ''} onChange={(e) => set('bestPractices.details', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </AppLayout>
  );
}
