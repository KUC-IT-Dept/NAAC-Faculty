/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../../components/AppLayout';
import toast from 'react-hot-toast';
import {
  CalendarDays, Plus, Building2, Users, ClipboardList, Archive,
  CheckCircle2, Clock, AlertTriangle, FileCheck2, MapPin, X,
} from 'lucide-react';
import {
  Venue, Booking, EventReport,
  listVenues, createVenue, updateVenue, addMaintenancePeriod,
  listBookings, createBooking, confirmBooking, cancelBooking, updateAssignments,
  listPendingReports, approveReport, requestCorrections, rejectReport, getReportDetail,
  searchRegister, exportRegisterUrl,
} from '../../../lib/eventsApi';
import api from '../../../lib/api';
import { useReasonModal } from '../../../components/ReasonModal';

type Section = 'calendar' | 'create' | 'venues' | 'assignments' | 'pending' | 'register';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'calendar', label: 'Booking Calendar', icon: <CalendarDays size={15} /> },
  { id: 'create', label: 'Create Event Booking', icon: <Plus size={15} /> },
  { id: 'venues', label: 'Venue Management', icon: <Building2 size={15} /> },
  { id: 'assignments', label: 'Faculty Assignments', icon: <Users size={15} /> },
  { id: 'pending', label: 'Pending Reports', icon: <ClipboardList size={15} /> },
  { id: 'register', label: 'Current Activities Register', icon: <Archive size={15} /> },
];

export default function EventsHub() {
  const [section, setSection] = useState<Section>('calendar');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pending, setPending] = useState<EventReport[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadOverview = () => {
    setStatsLoading(true);
    Promise.all([listBookings(), listPendingReports()])
      .then(([b, p]) => { setBookings(b); setPending(p); })
      .catch(() => toast.error('Failed to load Campus Events overview'))
      .finally(() => setStatsLoading(false));
  };
  useEffect(() => { loadOverview(); }, []);

  const now = new Date();
  const stats = useMemo(() => ({
    total: bookings.filter((b) => b.status !== 'cancelled').length,
    upcoming: bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) > now).length,
    reportsPending: bookings.filter((b) => ['report_pending', 'correction_required'].includes(b.eventStatus)).length,
    overdue: bookings.filter((b) => b.eventStatus === 'overdue').length,
    approved: bookings.filter((b) => b.eventStatus === 'published').length,
  }), [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: <CalendarDays size={18} />, bg: 'var(--accent-pale)', color: 'var(--primary)' },
    { label: 'Upcoming Events', value: stats.upcoming, icon: <Clock size={18} />, bg: '#dbeafe', color: '#1d4ed8' },
    { label: 'Reports Pending', value: stats.reportsPending, icon: <ClipboardList size={18} />, bg: '#fef3c7', color: '#92400e' },
    { label: 'Overdue Submissions', value: stats.overdue, icon: <AlertTriangle size={18} />, bg: '#fee2e2', color: '#991b1b' },
    { label: 'Approved Activities', value: stats.approved, icon: <CheckCircle2 size={18} />, bg: '#d1fae5', color: '#065f46' },
  ];

  const refreshAll = () => loadOverview();

  return (
    <AppLayout title="Campus Events & Evidence Management">
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{statsLoading ? '—' : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`btn btn-sm ${section === s.id ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSection(s.id)}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'calendar' && <CalendarSection bookings={bookings} loading={statsLoading} onChanged={refreshAll} />}
      {section === 'create' && <CreateBookingSection onCreated={() => { setSection('calendar'); refreshAll(); }} />}
      {section === 'venues' && <VenuesSection />}
      {section === 'assignments' && <AssignmentsSection bookings={bookings} loading={statsLoading} onChanged={refreshAll} />}
      {section === 'pending' && <PendingReportsSection reports={pending} onChanged={refreshAll} />}
      {section === 'register' && <RegisterSection />}
    </AppLayout>
  );
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'badge-pending', booked: 'badge-pending', confirmed: 'badge-active', assigned: 'badge-primary',
    event_completed: 'badge-pending', report_pending: 'badge-pending', submitted: 'badge-primary',
    under_review: 'badge-primary', correction_required: 'badge-pending', approved: 'badge-active',
    published: 'badge-active', overdue: 'badge-inactive', cancelled: 'badge-inactive', rescheduled: 'badge-pending',
  };
  return `badge ${map[status] || 'badge-primary'}`;
}

// ── Booking Calendar (Part: day/week/month views) ───────────────────────────
function CalendarSection({ bookings, loading, onChanged }: { bookings: Booking[]; loading: boolean; onChanged: () => void }) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [venueFilter, setVenueFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [detail, setDetail] = useState<Booking | null>(null);
  const { ask, ReasonDialog } = useReasonModal();

  useEffect(() => { listVenues().then(setVenues).catch(() => {}); }, []);

  const departments = useMemo(() => Array.from(new Set(bookings.map((b) => b.conductingDepartment))), [bookings]);

  const filtered = useMemo(() => bookings.filter((b) => {
    const venueId = typeof b.venue === 'string' ? b.venue : b.venue._id;
    if (venueFilter && venueId !== venueFilter) return false;
    if (deptFilter && b.conductingDepartment !== deptFilter) return false;
    return b.status !== 'cancelled';
  }), [bookings, venueFilter, deptFilter]);

  const rangeDays = useMemo(() => {
    if (view === 'day') return [new Date(anchor)];
    if (view === 'week') {
      const start = new Date(anchor);
      start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    // month
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first); start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [view, anchor]);

  const bookingsForDay = (day: Date) => filtered.filter((b) => new Date(b.date).toDateString() === day.toDateString());

  const shift = (deltaDays: number) => setAnchor((a) => { const d = new Date(a); d.setDate(d.getDate() + deltaDays); return d; });

  const handleConfirm = async (id: string) => {
    try { await confirmBooking(id); toast.success('Booking confirmed'); onChanged(); setDetail(null); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not confirm — venue may already be booked for that time (conflict)'); }
  };
  const handleCancel = (b: Booking) => {
    ask({
      title: 'Cancel booking', confirmLabel: 'Cancel Booking', confirmTone: 'danger',
      description: `Cancel "${b.programName}"? This cannot be undone.`,
      onConfirm: async (reason) => { await cancelBooking(b._id, reason); toast.success('Booking cancelled'); onChanged(); setDetail(null); },
    });
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarDays size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Booking Calendar</h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['day', 'week', 'month'] as const).map((v) => (
            <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <button className="btn btn-sm btn-outline" onClick={() => shift(view === 'month' ? -30 : view === 'week' ? -7 : -1)}>← Prev</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAnchor(new Date())}>Today</button>
          <button className="btn btn-sm btn-outline" onClick={() => shift(view === 'month' ? 30 : view === 'week' ? 7 : 1)}>Next →</button>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>
            {view === 'month' ? anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : anchor.toDateString()}
          </span>
          <div style={{ flex: 1 }} />
          <select className="form-select" style={{ width: 180 }} value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
            <option value="">All venues</option>
            {venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
          <select className="form-select" style={{ width: 180 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-muted">Loading bookings…</p>
        ) : view === 'month' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-muted text-sm" style={{ fontWeight: 700, textAlign: 'center', padding: '4px 0' }}>{d}</div>
            ))}
            {rangeDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              const inMonth = day.getMonth() === anchor.getMonth();
              return (
                <button
                  key={i}
                  onClick={() => { setAnchor(day); setView('day'); }}
                  style={{
                    minHeight: 70, textAlign: 'left', borderRadius: 10, border: '1px solid var(--border)',
                    background: inMonth ? 'var(--card)' : 'var(--bg)', padding: 8, cursor: 'pointer',
                  }}
                >
                  <div className="text-sm" style={{ color: inMonth ? 'var(--text)' : 'var(--text-light)', fontWeight: 600 }}>{day.getDate()}</div>
                  {dayBookings.length > 0 && (
                    <span className="badge badge-primary" style={{ marginTop: 4 }}>{dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: view === 'week' ? 'repeat(auto-fit, minmax(220px, 1fr))' : '1fr' }}>
            {rangeDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              return (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: 'var(--bg)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{day.toDateString()}</div>
                  {dayBookings.length === 0 && <p className="text-muted text-sm">No bookings.</p>}
                  {dayBookings.map((b) => {
                    const venueName = typeof b.venue === 'string' ? b.venue : b.venue.name;
                    return (
                      <button
                        key={b._id} onClick={() => setDetail(b)}
                        style={{ width: '100%', textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, marginBottom: 8, cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <strong style={{ fontSize: '0.85rem' }}>{b.programName}</strong>
                          <span className={statusBadge(b.status === 'confirmed' ? b.eventStatus : b.status)}>{(b.status === 'confirmed' ? b.eventStatus : b.status).replace('_', ' ')}</span>
                        </div>
                        <div className="text-muted text-sm" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={12} /> {venueName} · {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}–{new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{detail.programName}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
              <DetailRow label="Department" value={detail.conductingDepartment} />
              <DetailRow label="Venue" value={typeof detail.venue === 'string' ? detail.venue : detail.venue.name} />
              <DetailRow label="When" value={`${new Date(detail.startTime).toLocaleString()} – ${new Date(detail.endTime).toLocaleTimeString()}`} />
              <DetailRow label="Lead faculty" value={typeof detail.leadFaculty === 'string' ? detail.leadFaculty : detail.leadFaculty.name} />
              <DetailRow label="Status" value={<><span className={statusBadge(detail.status)}>{detail.status}</span> <span className={statusBadge(detail.eventStatus)}>{detail.eventStatus.replace('_', ' ')}</span></>} />
            </div>
            <div className="modal-footer">
              {detail.status === 'draft' && <button className="btn btn-primary" onClick={() => handleConfirm(detail._id)}>Confirm Booking</button>}
              {detail.status !== 'cancelled' && <button className="btn btn-danger" onClick={() => handleCancel(detail)}>Cancel Booking</button>}
            </div>
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="form-label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.9rem' }}>{value}</div>
    </div>
  );
}

// ── Create Event Booking (Part 4.3) ──────────────────────────────────────────
function CreateBookingSection({ onCreated }: { onCreated: () => void }) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [facultyOptions, setFacultyOptions] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    programName: '', venue: '', date: '', slotType: 'standard' as 'standard' | 'custom',
    standardSlotNumber: 1, startTime: '', endTime: '',
    targetGroups: '', expectedStrength: '', objectives: '', resourcePerson: '',
    leadFaculty: '', supportingFaculty: [] as string[], bookingNotes: '', confirm: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listVenues().then(setVenues).catch(() => {});
    api.get('/hod/faculty').then((r) => setFacultyOptions(r.data.map((u: any) => ({ _id: u._id, name: u.profile?.personalInfo?.fullName || u.username })))).catch(() => {});
  }, []);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.programName || !form.venue || !form.date || !form.leadFaculty) {
      return toast.error('Programme name, venue, date and lead faculty are required');
    }
    setSubmitting(true);
    try {
      await createBooking({
        ...form,
        targetGroups: form.targetGroups.split(',').map((s) => s.trim()).filter(Boolean),
        expectedStrength: form.expectedStrength ? Number(form.expectedStrength) : null,
        standardSlotNumber: form.slotType === 'standard' ? Number(form.standardSlotNumber) : undefined,
      });
      toast.success('Booking created');
      onCreated();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Plus size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Create Event Booking</h2>
      </div>
      <div className="card-body" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label className="form-label">Event / Programme name<span className="required-star">*</span></label>
          <input className="form-input" value={form.programName} onChange={(e) => set('programName', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Venue<span className="required-star">*</span></label>
          <select className="form-select" value={form.venue} onChange={(e) => set('venue', e.target.value)}>
            <option value="">Select venue</option>
            {venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date<span className="required-star">*</span></label>
          <input type="date" className="form-input" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Slot type</label>
          <select className="form-select" value={form.slotType} onChange={(e) => set('slotType', e.target.value)}>
            <option value="standard">Standard slot</option>
            <option value="custom">Custom time (authorized exception)</option>
          </select>
        </div>
        {form.slotType === 'standard' ? (
          <div className="form-group">
            <label className="form-label">Standard slot</label>
            <select className="form-select" value={form.standardSlotNumber} onChange={(e) => set('standardSlotNumber', e.target.value)}>
              <option value={1}>Slot 1 — Morning</option>
              <option value={2}>Slot 2 — Afternoon</option>
              <option value={3}>Slot 3 — Evening</option>
            </select>
          </div>
        ) : (
          <>
            <div className="form-group"><label className="form-label">Start time</label><input type="datetime-local" className="form-input" value={form.startTime} onChange={(e) => set('startTime', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">End time</label><input type="datetime-local" className="form-input" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} /></div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">Target groups &amp; beneficiaries</label>
          <input className="form-input" placeholder="UG, PG, Public (comma separated)" value={form.targetGroups} onChange={(e) => set('targetGroups', e.target.value)} />
        </div>
        <div className="form-group"><label className="form-label">Expected participant strength</label><input type="number" className="form-input" value={form.expectedStrength} onChange={(e) => set('expectedStrength', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Objectives</label><textarea className="form-textarea" value={form.objectives} onChange={(e) => set('objectives', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Resource person</label><input className="form-input" value={form.resourcePerson} onChange={(e) => set('resourcePerson', e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Lead faculty member<span className="required-star">*</span></label>
          <select className="form-select" value={form.leadFaculty} onChange={(e) => set('leadFaculty', e.target.value)}>
            <option value="">Select lead faculty</option>
            {facultyOptions.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Supporting faculty members</label>
          <select multiple className="form-select" style={{ height: 110 }} value={form.supportingFaculty} onChange={(e) => set('supportingFaculty', Array.from(e.target.selectedOptions, (o) => o.value))}>
            {facultyOptions.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
          <p className="form-hint">Hold Ctrl/Cmd to select multiple.</p>
        </div>
        <div className="form-group"><label className="form-label">Additional booking notes</label><textarea className="form-textarea" value={form.bookingNotes} onChange={(e) => set('bookingNotes', e.target.value)} /></div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginBottom: 16 }}>
          <input type="checkbox" checked={form.confirm} onChange={(e) => set('confirm', e.target.checked)} />
          Confirm this booking immediately (uncheck to save as a draft)
        </label>
        <button className="btn btn-primary" disabled={submitting} onClick={submit}>
          {submitting ? 'Saving…' : form.confirm ? 'Save & Confirm' : 'Save Draft'}
        </button>
      </div>
    </div>
  );
}

// ── Venue Management (Part 4.1) ─────────────────────────────────────────────
function VenuesSection() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newVenue, setNewVenue] = useState({ name: '', building: '', capacity: '' });
  const [maintVenue, setMaintVenue] = useState<Venue | null>(null);
  const [maint, setMaint] = useState({ from: '', to: '', reason: '' });

  const load = () => listVenues(true).then(setVenues).catch(() => toast.error('Failed to load venues')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newVenue.name.trim()) return toast.error('Venue name is required');
    try {
      await createVenue({ name: newVenue.name.trim(), building: newVenue.building, capacity: newVenue.capacity ? Number(newVenue.capacity) : null });
      toast.success('Venue created');
      setNewVenue({ name: '', building: '', capacity: '' });
      setShowAdd(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create venue');
    }
  };

  const toggleActive = async (v: Venue) => {
    try { await updateVenue(v._id, { isActive: !v.isActive }); load(); }
    catch { toast.error('Failed to update venue'); }
  };

  const submitMaintenance = async () => {
    if (!maintVenue || !maint.from || !maint.to) return toast.error('From and to dates are required');
    try {
      await addMaintenancePeriod(maintVenue._id, maint.from, maint.to, maint.reason);
      toast.success('Maintenance period added');
      setMaintVenue(null);
      setMaint({ from: '', to: '', reason: '' });
      load();
    } catch { toast.error('Failed to add maintenance period'); }
  };

  if (loading) return <p className="text-muted">Loading venues…</p>;

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Venue Management</h2>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Venue</button>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Venue</th><th>Type</th><th>Building</th><th>Capacity</th><th>Status</th><th>Upcoming reservations</th><th /></tr></thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v._id}>
                  <td>{v.name} {v.isCustom && <span className="text-muted text-sm">(custom placeholder)</span>}</td>
                  <td>{v.venueType}</td>
                  <td>{v.building || '—'}</td>
                  <td>{v.capacity ?? '—'}</td>
                  <td><span className={`badge ${v.isActive ? 'badge-active' : 'badge-inactive'}`}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>{v.maintenancePeriods?.length ? `${v.maintenancePeriods.length} maintenance period(s)` : '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleActive(v)}>{v.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setMaintVenue(v)}>Maintenance</button>
                  </td>
                </tr>
              ))}
              {venues.length === 0 && <tr><td colSpan={7} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No venues yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>Add Venue</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowAdd(false)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Venue name<span className="required-star">*</span></label><input className="form-input" value={newVenue.name} onChange={(e) => setNewVenue((s) => ({ ...s, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Building / block</label><input className="form-input" value={newVenue.building} onChange={(e) => setNewVenue((s) => ({ ...s, building: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Capacity</label><input type="number" className="form-input" value={newVenue.capacity} onChange={(e) => setNewVenue((s) => ({ ...s, capacity: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Add Venue</button></div>
          </div>
        </div>
      )}

      {maintVenue && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMaintVenue(null); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>Maintenance — {maintVenue.name}</h3><button className="btn btn-ghost btn-icon" onClick={() => setMaintVenue(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">From</label><input type="datetime-local" className="form-input" value={maint.from} onChange={(e) => setMaint((s) => ({ ...s, from: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">To</label><input type="datetime-local" className="form-input" value={maint.to} onChange={(e) => setMaint((s) => ({ ...s, to: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Reason</label><input className="form-input" value={maint.reason} onChange={(e) => setMaint((s) => ({ ...s, reason: e.target.value }))} /></div>
              {maintVenue.maintenancePeriods?.length > 0 && (
                <div>
                  <p className="form-label">Existing periods</p>
                  {maintVenue.maintenancePeriods.map((p) => (
                    <div key={p._id} className="list-item-card" style={{ padding: 10, marginBottom: 6 }}>
                      <p className="text-sm">{new Date(p.from).toLocaleString()} – {new Date(p.to).toLocaleString()}</p>
                      {p.reason && <p className="text-muted text-sm">{p.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setMaintVenue(null)}>Close</button><button className="btn btn-primary" onClick={submitMaintenance}>Add Period</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Faculty Assignments ──────────────────────────────────────────────────────
function AssignmentsSection({ bookings, loading, onChanged }: { bookings: Booking[]; loading: boolean; onChanged: () => void }) {
  const [facultyOptions, setFacultyOptions] = useState<{ _id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [leadFaculty, setLeadFaculty] = useState('');
  const [supporting, setSupporting] = useState<string[]>([]);
  const { ask, ReasonDialog } = useReasonModal();

  useEffect(() => {
    api.get('/hod/faculty').then((r) => setFacultyOptions(r.data.map((u: any) => ({ _id: u._id, name: u.profile?.personalInfo?.fullName || u.username })))).catch(() => {});
  }, []);

  const openEdit = (b: Booking) => {
    setEditing(b);
    setLeadFaculty(typeof b.leadFaculty === 'string' ? b.leadFaculty : b.leadFaculty._id);
    setSupporting(b.supportingFaculty.map((s) => (typeof s === 'string' ? s : s._id)));
  };

  const save = () => {
    if (!editing) return;
    const changedLead = leadFaculty !== (typeof editing.leadFaculty === 'string' ? editing.leadFaculty : editing.leadFaculty._id);
    if (changedLead) {
      ask({
        title: 'Reassign lead faculty', confirmLabel: 'Save Assignment',
        description: 'Changing the lead faculty member requires a reason (recorded in the audit log).',
        onConfirm: async (reason) => {
          await updateAssignments(editing._id, { leadFaculty, addSupporting: supporting, reason });
          toast.success('Assignments updated');
          setEditing(null); onChanged();
        },
      });
    } else {
      updateAssignments(editing._id, { addSupporting: supporting })
        .then(() => { toast.success('Assignments updated'); setEditing(null); onChanged(); })
        .catch(() => toast.error('Failed to update assignments'));
    }
  };

  if (loading) return <p className="text-muted">Loading…</p>;

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Users size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Faculty Assignments</h2>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Event</th><th>Lead faculty</th><th>Supporting faculty</th><th>Status</th><th /></tr></thead>
            <tbody>
              {bookings.filter((b) => b.status !== 'cancelled').map((b) => (
                <tr key={b._id}>
                  <td>{b.programName}</td>
                  <td>{typeof b.leadFaculty === 'string' ? b.leadFaculty : b.leadFaculty.name}</td>
                  <td>{b.supportingFaculty.length === 0 ? '—' : b.supportingFaculty.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')}</td>
                  <td><span className={statusBadge(b.eventStatus)}>{b.eventStatus.replace('_', ' ')}</span></td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>Edit</button></td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>Edit Assignments — {editing.programName}</h3><button className="btn btn-ghost btn-icon" onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Lead faculty</label>
                <select className="form-select" value={leadFaculty} onChange={(e) => setLeadFaculty(e.target.value)}>
                  {facultyOptions.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Supporting faculty</label>
                <select multiple className="form-select" style={{ height: 110 }} value={supporting} onChange={(e) => setSupporting(Array.from(e.target.selectedOptions, (o) => o.value))}>
                  {facultyOptions.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}

// ── Pending Event Reports (Part 7) ──────────────────────────────────────────
function PendingReportsSection({ reports, onChanged }: { reports: EventReport[]; onChanged: () => void }) {
  const [open, setOpen] = useState<EventReport | null>(null);
  const [detail, setDetail] = useState<{ report: EventReport } | null>(null);
  const { ask, ReasonDialog } = useReasonModal();

  useEffect(() => {
    if (open) getReportDetail(open._id).then(setDetail).catch(() => toast.error('Failed to load report detail'));
    else setDetail(null);
  }, [open]);

  const approve = async (id: string) => {
    try { await approveReport(id); toast.success('Report approved and published'); setOpen(null); onChanged(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to approve'); }
  };
  const correction = (id: string) => ask({
    title: 'Request corrections', confirmLabel: 'Request Corrections',
    description: 'The faculty member will see these notes and get a new editable draft.',
    onConfirm: async (reason) => { await requestCorrections(id, reason); toast.success('Corrections requested'); setOpen(null); onChanged(); },
  });
  const reject = (id: string) => ask({
    title: 'Reject report', confirmLabel: 'Reject Report', confirmTone: 'danger',
    description: 'This report will be marked rejected and returned for correction.',
    onConfirm: async (reason) => { await rejectReport(id, reason); toast.success('Report rejected'); setOpen(null); onChanged(); },
  });

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ClipboardList size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Pending Event Reports</h2>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Programme</th><th>Department</th><th>Venue</th><th>Version</th><th /></tr></thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id}>
                  <td>{r.nameOfProgram}</td>
                  <td>{r.conductingDepartment}</td>
                  <td>{r.programVenue}</td>
                  <td>v{r.version}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => setOpen(r)}>Review</button></td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No reports awaiting review.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{open.nameOfProgram}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setOpen(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {!detail ? <p className="text-muted">Loading…</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <DetailRow label="Person in Charge" value={detail.report.personInCharge} />
                  <DetailRow label="Target Group & Beneficiaries" value={detail.report.targetGroupBeneficiaries?.join(', ')} />
                  <DetailRow label="Objectives" value={detail.report.objectives} />
                  <DetailRow label="Resource Person" value={detail.report.resourcePerson} />
                  <DetailRow label="Number of Participants" value={detail.report.numberOfParticipants} />
                  <DetailRow label="Brief Event Report" value={detail.report.briefEventReport} />
                  {detail.report.feedbackText && <DetailRow label="Feedback" value={detail.report.feedbackText} />}
                  <div>
                    <div className="form-label" style={{ marginBottom: 6 }}>Evidence</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                      {detail.report.evidence.map((e) => (
                        <a key={e._id} href={e.url} target="_blank" rel="noreferrer" style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', textDecoration: 'none' }}>
                          {e.category === 'photo' ? (
                            <img src={e.url} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}><FileCheck2 size={22} color="var(--text-muted)" /></div>
                          )}
                          <div style={{ padding: 6, fontSize: '0.72rem' }}>
                            <div style={{ fontWeight: 600 }}>{e.category.replace('_', ' ')}</div>
                            {e.category === 'photo' && (e.gpsMissing ? <span style={{ color: 'var(--warning)' }}>No GPS tag</span> : <span style={{ color: 'var(--success)' }}>GPS tagged</span>)}
                          </div>
                        </a>
                      ))}
                      {detail.report.evidence.length === 0 && <p className="text-muted text-sm">No evidence uploaded.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => correction(open._id)}>Request Corrections</button>
              <button className="btn btn-danger" onClick={() => reject(open._id)}>Reject</button>
              <button className="btn btn-primary" onClick={() => approve(open._id)}>Approve</button>
            </div>
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}

// ── Current Activities Register (Part 8) ────────────────────────────────────
function RegisterSection() {
  const [filters, setFilters] = useState({ programName: '', department: '' });
  const [results, setResults] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(false);

  const search = () => {
    setLoading(true);
    searchRegister(filters).then(setResults).catch(() => toast.error('Search failed')).finally(() => setLoading(false));
  };
  useEffect(() => { search(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Archive size={20} color="var(--primary)" />
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Current Activities Register</h2>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <input className="form-input" style={{ flex: 1, minWidth: 160 }} placeholder="Programme name" value={filters.programName} onChange={(e) => setFilters((f) => ({ ...f, programName: e.target.value }))} />
          <input className="form-input" style={{ width: 200 }} placeholder="Department" value={filters.department} onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))} />
          <button className="btn btn-primary" onClick={search}>Search</button>
          <a className="btn btn-outline" href={exportRegisterUrl('pdf', filters)}>Export PDF</a>
          <a className="btn btn-outline" href={exportRegisterUrl('excel', filters)}>Export Excel</a>
        </div>
        {loading ? <p className="text-muted">Searching…</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Programme</th><th>Department</th><th>Venue</th><th>Date</th></tr></thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td>{r.nameOfProgram}</td>
                    <td>{r.conductingDepartment}</td>
                    <td>{r.programVenue}</td>
                    <td>{r.dateFrom ? new Date(r.dateFrom).toDateString() : '—'}</td>
                  </tr>
                ))}
                {results.length === 0 && <tr><td colSpan={4} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No approved records match.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
