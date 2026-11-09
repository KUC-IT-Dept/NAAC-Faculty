/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CalendarDays, Building2, ClipboardList, LayoutGrid, Grid3x3,
  Plus, Pencil, Trash2, Ban, RefreshCw, Wrench, X, Search, Eye,
  Clock, CheckCircle2, XCircle, FileCheck2, Download,
  MapPin, Zap, History,
} from 'lucide-react';
import AppLayout from '../../components/AppLayout';
import { useReasonModal } from '../../components/ReasonModal';
import {
  Venue, Booking, EventReport,
  listVenues, createVenue, updateVenue, deleteVenue, addMaintenancePeriod,
  listBookings, cancelBooking,
  listAllReports, getReportDetail, approveReport, requestCorrections, rejectReport,
  exportRegisterUrl,
} from '../../lib/eventsApi';

type Section = 'overview' | 'bookings' | 'venues' | 'reports' | 'calendar';

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid size={15} /> },
  { id: 'bookings', label: 'Event Bookings', icon: <CalendarDays size={15} /> },
  { id: 'venues', label: 'Venue Management', icon: <Building2 size={15} /> },
  { id: 'reports', label: 'Reports & Evidence', icon: <ClipboardList size={15} /> },
  { id: 'calendar', label: 'Calendar View', icon: <Grid3x3 size={15} /> },
];

// All dates/times in this admin dashboard are displayed in the institution's
// IST convention (Asia/Kolkata), matching the faculty PWA and HOD dashboard.
const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const timeLabel = (value: string) => new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const DEPT_PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4d7c0f'];
function deptColor(dept: string) {
  let hash = 0;
  for (let i = 0; i < dept.length; i++) hash = (hash * 31 + dept.charCodeAt(i)) >>> 0;
  return DEPT_PALETTE[hash % DEPT_PALETTE.length];
}

export function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'badge-pending', booked: 'badge-pending', confirmed: 'badge-active', assigned: 'badge-primary',
    event_completed: 'badge-pending', report_pending: 'badge-pending', submitted: 'badge-primary',
    under_review: 'badge-primary', correction_required: 'badge-pending', approved: 'badge-active',
    published: 'badge-active', overdue: 'badge-inactive', cancelled: 'badge-inactive', rescheduled: 'badge-pending',
    rejected: 'badge-inactive',
  };
  return `badge ${map[status] || 'badge-primary'}`;
}
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="form-label" style={{ marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.9rem' }}>{value ?? '—'}</div>
    </div>
  );
}
function venueName(v: Booking['venue']) { return typeof v === 'string' ? v : v?.name || '—'; }
function coordinatorName(b: Booking) { return typeof b.leadFaculty === 'string' ? b.leadFaculty : b.leadFaculty?.name || '—'; }

export default function AdminEventsManagement() {
  const [section, setSection] = useState<Section>('overview');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reports, setReports] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarAnchor, setCalendarAnchor] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [b, v, r] = await Promise.all([listBookings(), listVenues(true), listAllReports()]);
      setBookings(b); setVenues(v); setReports(r);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not load Campus Events data');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const now = new Date();
  const stats = useMemo(() => ({
    total: bookings.filter((b) => b.status !== 'cancelled').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    inProgress: bookings.filter((b) => b.status === 'confirmed' && new Date(b.startTime) <= now && new Date(b.endTime) >= now).length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    activeVenues: venues.filter((v) => v.isActive).length,
  }), [bookings, venues]); // eslint-disable-line react-hooks/exhaustive-deps

  const statCards = [
    { label: 'Total Bookings', value: stats.total, icon: <CalendarDays size={18} />, bg: 'var(--accent-pale)', color: 'var(--primary)' },
    { label: 'Confirmed Bookings', value: stats.confirmed, icon: <CheckCircle2 size={18} />, bg: '#d1fae5', color: '#065f46' },
    { label: 'Events In Progress', value: stats.inProgress, icon: <Clock size={18} />, bg: '#fef3c7', color: '#92400e' },
    { label: 'Cancelled Bookings', value: stats.cancelled, icon: <XCircle size={18} />, bg: '#fee2e2', color: '#991b1b' },
    { label: 'Active Venues', value: stats.activeVenues, icon: <Building2 size={18} />, bg: '#ede9fe', color: '#6d28d9' },
  ];

  const openCalendarOn = (date: Date) => { setCalendarAnchor(date); setSection('calendar'); };

  return (
    <AppLayout title="Campus Events Management">
      <div className="card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', border: 'none' }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ color: '#93c5fd', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Campus Events</p>
            <h1 style={{ color: '#fff', fontSize: '1.4rem', margin: '4px 0 0' }}>Campus Events Management</h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '4px 0 0' }}>Plan, monitor and manage all college events, venue bookings and event reports.</p>
          </div>
          <button className="btn" style={{ background: '#fff', color: '#1e3a8a' }} onClick={() => void refresh()}><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
            </div>
            <div className="stat-card-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => (
            <button key={s.id} className={`btn btn-sm ${section === s.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSection(s.id)}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {section === 'overview' && (
        <OverviewSection bookings={bookings} venues={venues} loading={loading} onGoSection={setSection} onOpenCalendarDate={openCalendarOn} />
      )}
      {section === 'bookings' && <BookingsSection bookings={bookings} loading={loading} onChanged={refresh} />}
      {section === 'venues' && <VenuesSection venues={venues} bookings={bookings} loading={loading} onChanged={refresh} />}
      {section === 'reports' && <ReportsSection reports={reports} loading={loading} onChanged={refresh} />}
      {section === 'calendar' && <CalendarViewSection bookings={bookings} venues={venues} loading={loading} onChanged={refresh} initialAnchor={calendarAnchor} />}
    </AppLayout>
  );
}

// ── A. Overview ───────────────────────────────────────────────────────────
function OverviewSection({
  bookings, loading, onGoSection, onOpenCalendarDate,
}: { bookings: Booking[]; venues: Venue[]; loading: boolean; onGoSection: (s: Section) => void; onOpenCalendarDate: (d: Date) => void }) {
  const now = new Date();
  const upcoming = useMemo(() => bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5), [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentActivity = useMemo(() => [...bookings]
    .sort((a, b) => new Date((b as any).updatedAt || b.date).getTime() - new Date((a as any).updatedAt || a.date).getTime())
    .slice(0, 6), [bookings]);

  const [monthAnchor] = useState(new Date());
  const monthDays = useMemo(() => {
    const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1);
    const start = new Date(first); start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [monthAnchor]);
  const countFor = (day: Date) => bookings.filter((b) => b.status !== 'cancelled' && new Date(b.date).toDateString() === day.toDateString()).length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
      <div style={{ display: 'grid', gap: 20, gridAutoRows: 'min-content' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={18} color="var(--primary)" /> Upcoming Events</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoSection('bookings')}>View All →</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading && <p className="text-muted" style={{ padding: 16 }}>Loading…</p>}
            {!loading && upcoming.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No upcoming confirmed events.</p>}
            {upcoming.map((b) => (
              <div key={b._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 54, textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{new Date(b.date).toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{new Date(b.date).toLocaleDateString('en-IN', { day: '2-digit', timeZone: 'Asia/Kolkata' })}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ fontSize: '0.9rem' }}>{b.programName}</strong>
                  <p className="text-muted text-sm" style={{ margin: '2px 0 0' }}>{b.conductingDepartment} · {venueName(b.venue)} · {timeLabel(b.startTime)}–{timeLabel(b.endTime)}</p>
                </div>
                <span className={statusBadge(b.eventStatus)}>{b.eventStatus.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><History size={18} color="var(--primary)" /> Recent Booking Activity</h2></div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentActivity.map((b) => (
              <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.programName}</span>
                  <span className="text-muted text-sm"> — {b.conductingDepartment}</span>
                </div>
                <span className={statusBadge(b.status === 'confirmed' ? b.eventStatus : b.status)}>{(b.status === 'confirmed' ? b.eventStatus : b.status).replace('_', ' ')}</span>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-muted" style={{ padding: 16 }}>No activity yet.</p>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 20, gridAutoRows: 'min-content' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1rem', margin: 0 }}>{monthAnchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-muted text-sm" style={{ textAlign: 'center', fontWeight: 700 }}>{d}</div>)}
              {monthDays.map((day, i) => {
                const count = countFor(day);
                const inMonth = day.getMonth() === monthAnchor.getMonth();
                const isToday = day.toDateString() === now.toDateString();
                return (
                  <button
                    key={i} onClick={() => onOpenCalendarDate(day)}
                    style={{
                      aspectRatio: '1', borderRadius: 6, border: isToday ? '2px solid var(--primary)' : '1px solid transparent',
                      background: count > 0 ? 'var(--accent-pale)' : 'transparent', color: inMonth ? 'var(--text)' : 'var(--text-light)',
                      fontSize: '0.75rem', cursor: 'pointer', position: 'relative',
                    }}
                  >
                    {day.getDate()}
                    {count > 0 && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} color="var(--primary)" /> Quick Actions</h2></div>
          <div className="card-body" style={{ display: 'grid', gap: 8 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => onGoSection('venues')}><Building2 size={15} /> Manage Venues</button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }} onClick={() => onGoSection('reports')}><ClipboardList size={15} /> Review Event Reports</button>
            <a className="btn btn-outline" style={{ justifyContent: 'flex-start' }} href={exportRegisterUrl('excel')}><Download size={15} /> Export Event Data (Excel)</a>
            <a className="btn btn-outline" style={{ justifyContent: 'flex-start' }} href={exportRegisterUrl('pdf')}><Download size={15} /> Export Event Data (PDF)</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── B. Event Bookings ────────────────────────────────────────────────────
function BookingsSection({ bookings, loading, onChanged }: { bookings: Booking[]; loading: boolean; onChanged: () => void }) {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [detail, setDetail] = useState<Booking | null>(null);
  const { ask, ReasonDialog } = useReasonModal();

  const departments = useMemo(() => Array.from(new Set(bookings.map((b) => b.conductingDepartment))).sort(), [bookings]);
  const venueOptions = useMemo(() => Array.from(new Map(bookings.map((b) => [typeof b.venue === 'string' ? b.venue : b.venue._id, venueName(b.venue)])).entries()), [bookings]);

  const filtered = useMemo(() => bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    if (q && !b.programName.toLowerCase().includes(q)) return false;
    if (deptFilter && b.conductingDepartment !== deptFilter) return false;
    if (venueFilter) { const vid = typeof b.venue === 'string' ? b.venue : b.venue._id; if (vid !== venueFilter) return false; }
    if (statusFilter && b.status !== statusFilter) return false;
    if (fromDate && new Date(b.date) < new Date(fromDate)) return false;
    if (toDate && new Date(b.date) > new Date(toDate)) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bookings, search, deptFilter, venueFilter, statusFilter, fromDate, toDate]);

  const cancel = (b: Booking) => ask({
    title: 'Cancel booking', confirmLabel: 'Cancel Booking', confirmTone: 'danger',
    description: `Cancel "${b.programName}"? This cannot be undone. A cancellation reason is required and will be visible to the event's faculty.`,
    onConfirm: async (reason) => { await cancelBooking(b._id, reason); toast.success('Booking cancelled'); setDetail(null); onChanged(); },
  });

  return (
    <div className="card">
      <div className="card-header">
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>All Event Bookings</h2>
        <p className="text-muted text-sm" style={{ margin: '2px 0 0' }}>Institution-wide — every department's bookings, including the historical cancelled register.</p>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 30 }} placeholder="Search by event name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 170 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: 170 }} value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
            <option value="">All Venues</option>
            {venueOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select className="form-select" style={{ width: 150 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rescheduled">Rescheduled</option>
          </select>
          <input type="date" className="form-input" style={{ width: 150 }} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" className="form-input" style={{ width: 150 }} value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Event Name</th><th>Department</th><th>Venue</th><th>Date</th><th>Time</th><th>Status</th><th>Coordinator</th><th>Actions</th></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>Loading bookings…</td></tr>}
              {!loading && filtered.map((b) => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 600 }}>{b.programName}</td>
                  <td>{b.conductingDepartment}</td>
                  <td>{venueName(b.venue)}</td>
                  <td>{dateLabel(b.date)}</td>
                  <td className="text-muted text-sm">{timeLabel(b.startTime)}–{timeLabel(b.endTime)} IST</td>
                  <td><span className={statusBadge(b.status)}>{b.status}</span></td>
                  <td>{coordinatorName(b)}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm" title="View details" onClick={() => setDetail(b)}><Eye size={14} /></button>
                    {b.status !== 'cancelled' && (
                      <button className="btn btn-ghost btn-sm" title="Cancel booking" onClick={() => cancel(b)}><Ban size={14} color="var(--danger)" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No bookings match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{detail.programName}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDetail(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: 10 }}>
              <DetailRow label="Department" value={detail.conductingDepartment} />
              <DetailRow label="Venue" value={venueName(detail.venue)} />
              <DetailRow label="Date & Time" value={`${dateLabel(detail.date)} · ${timeLabel(detail.startTime)}–${timeLabel(detail.endTime)} IST`} />
              <DetailRow label="Coordinator (Lead Faculty)" value={coordinatorName(detail)} />
              <DetailRow label="Supporting Faculty" value={detail.supportingFaculty.length ? detail.supportingFaculty.map((s) => (typeof s === 'string' ? s : s.name)).join(', ') : '—'} />
              <DetailRow label="Expected Strength" value={detail.expectedStrength} />
              <DetailRow label="Objectives" value={detail.objectives} />
              <DetailRow label="Status" value={<><span className={statusBadge(detail.status)}>{detail.status}</span> <span className={statusBadge(detail.eventStatus)}>{detail.eventStatus.replace('_', ' ')}</span></>} />
              {detail.status === 'cancelled' && <DetailRow label="Cancellation reason" value={(detail as any).cancelReason} />}
            </div>
            {detail.status !== 'cancelled' && (
              <div className="modal-footer"><button className="btn btn-danger" onClick={() => cancel(detail)}><Ban size={14} /> Cancel Booking</button></div>
            )}
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}

// ── C. Venue Management ──────────────────────────────────────────────────
type VenueForm = { name: string; venueType: string; building: string; roomNumber: string; capacity: string; bookingRestrictions: string; isActive: boolean };
const emptyVenue: VenueForm = { name: '', venueType: 'Hall', building: '', roomNumber: '', capacity: '', bookingRestrictions: '', isActive: true };

function VenuesSection({ venues, bookings, loading, onChanged }: { venues: Venue[]; bookings: Booking[]; loading: boolean; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VenueForm>(emptyVenue);
  const [maintenanceTarget, setMaintenanceTarget] = useState<Venue | null>(null);
  const [maintenance, setMaintenance] = useState({ from: '', to: '', reason: '' });
  const [scheduleFor, setScheduleFor] = useState<Venue | null>(null);

  const openCreate = () => { setEditingId(null); setForm(emptyVenue); setShowForm(true); };
  const openEdit = (v: Venue) => {
    setEditingId(v._id);
    setForm({ name: v.name, venueType: v.venueType || 'Hall', building: v.building || '', roomNumber: v.roomNumber || '', capacity: v.capacity == null ? '' : String(v.capacity), bookingRestrictions: v.bookingRestrictions || '', isActive: v.isActive });
    setShowForm(true);
  };
  const saveVenue = async () => {
    if (!form.name.trim()) return toast.error('Enter a venue name');
    const payload = { ...form, capacity: form.capacity ? Number(form.capacity) : null };
    try {
      if (editingId) await updateVenue(editingId, payload); else await createVenue(payload);
      toast.success(editingId ? 'Venue updated' : 'Venue created'); setShowForm(false); onChanged();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save venue'); }
  };
  const deactivate = async (v: Venue) => {
    if (!window.confirm(`Deactivate "${v.name}"? Existing bookings keep their record; it will no longer be offered for new bookings.`)) return;
    try { await deleteVenue(v._id); toast.success('Venue deactivated'); onChanged(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Could not deactivate — it may have upcoming bookings'); }
  };
  const activate = async (v: Venue) => {
    try { await updateVenue(v._id, { isActive: true }); toast.success('Venue activated'); onChanged(); }
    catch { toast.error('Could not activate venue'); }
  };
  const saveMaintenance = async () => {
    if (!maintenanceTarget || !maintenance.from || !maintenance.to) return toast.error('Select the maintenance start and end');
    try {
      await addMaintenancePeriod(maintenanceTarget._id, maintenance.from, maintenance.to, maintenance.reason);
      toast.success('Maintenance period added'); setMaintenanceTarget(null); setMaintenance({ from: '', to: '', reason: '' }); onChanged();
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not add maintenance period'); }
  };

  const scheduleBookings = useMemo(() => {
    if (!scheduleFor) return [];
    const now = new Date();
    return bookings
      .filter((b) => (typeof b.venue === 'string' ? b.venue : b.venue._id) === scheduleFor._id && b.status !== 'cancelled' && new Date(b.endTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [scheduleFor, bookings]);

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Venue Management</h2>
          <p className="text-muted text-sm" style={{ margin: '2px 0 0' }}>Only administrators can create, edit, deactivate venues or schedule maintenance.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Venue</button>
      </div>
      <div className="card-body">
        {loading && <p className="text-muted">Loading venues…</p>}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {venues.map((v) => (
              <div key={v._id} className="list-item-card" style={{ border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{v.name}</strong>
                    <p className="text-muted text-sm" style={{ margin: '2px 0 0' }}>{v.venueType} · {v.building || 'Building not set'} {v.roomNumber ? `· Room ${v.roomNumber}` : ''}</p>
                  </div>
                  <span className={`badge ${v.isActive ? 'badge-active' : 'badge-inactive'}`}>{v.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="text-sm" style={{ marginTop: 8 }}>Capacity: {v.capacity ?? 'Not specified'}</p>
                {v.bookingRestrictions && <p className="text-muted text-sm" style={{ marginTop: 4 }}>Rules: {v.bookingRestrictions}</p>}
                {v.maintenancePeriods?.length > 0 && (
                  <div style={{ marginTop: 8, background: '#fef3c7', color: '#92400e', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem' }}>
                    {v.maintenancePeriods.length} maintenance period(s) recorded
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(v)}><Pencil size={13} /> Edit</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setMaintenanceTarget(v)}><Wrench size={13} /> Maintenance</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setScheduleFor(v)}><CalendarDays size={13} /> Schedule</button>
                  {v.isActive
                    ? <button className="btn btn-outline btn-sm" onClick={() => deactivate(v)}><Trash2 size={13} color="var(--danger)" /></button>
                    : <button className="btn btn-outline btn-sm" onClick={() => activate(v)}>Activate</button>}
                </div>
              </div>
            ))}
            {venues.length === 0 && <p className="text-muted">No venues yet.</p>}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>{editingId ? 'Edit Venue' : 'Add Venue'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}><X size={18} /></button></div>
            <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Venue name<span className="required-star">*</span></label><input className="form-input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Type</label><input className="form-input" value={form.venueType} onChange={(e) => setForm((p) => ({ ...p, venueType: e.target.value }))} placeholder="Hall / Ground / Lab" /></div>
              <div className="form-group"><label className="form-label">Capacity</label><input type="number" min={1} className="form-input" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Building</label><input className="form-input" value={form.building} onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Room number</label><input className="form-input" value={form.roomNumber} onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))} /></div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Booking restrictions / rules</label><textarea className="form-textarea" rows={2} value={form.bookingRestrictions} onChange={(e) => setForm((p) => ({ ...p, bookingRestrictions: e.target.value }))} /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', gridColumn: '1 / -1' }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} /> Available for booking
              </label>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={saveVenue}>Save Venue</button></div>
          </div>
        </div>
      )}

      {maintenanceTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setMaintenanceTarget(null); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>Maintenance — {maintenanceTarget.name}</h3><button className="btn btn-ghost btn-icon" onClick={() => setMaintenanceTarget(null)}><X size={18} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">From</label><input type="datetime-local" className="form-input" value={maintenance.from} onChange={(e) => setMaintenance((p) => ({ ...p, from: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">To</label><input type="datetime-local" className="form-input" value={maintenance.to} onChange={(e) => setMaintenance((p) => ({ ...p, to: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Reason</label><input className="form-input" value={maintenance.reason} onChange={(e) => setMaintenance((p) => ({ ...p, reason: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setMaintenanceTarget(null)}>Close</button><button className="btn btn-primary" onClick={saveMaintenance}>Add Period</button></div>
          </div>
        </div>
      )}

      {scheduleFor && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setScheduleFor(null); }}>
          <div className="modal">
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>Upcoming Schedule — {scheduleFor.name}</h3><button className="btn btn-ghost btn-icon" onClick={() => setScheduleFor(null)}><X size={18} /></button></div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Event</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {scheduleBookings.map((b) => (
                      <tr key={b._id}><td>{b.programName}</td><td>{b.conductingDepartment}</td><td>{dateLabel(b.date)}</td><td>{timeLabel(b.startTime)}–{timeLabel(b.endTime)}</td><td><span className={statusBadge(b.status)}>{b.status}</span></td></tr>
                    ))}
                    {scheduleBookings.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 20 }}>No upcoming bookings for this venue.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-ghost" onClick={() => setScheduleFor(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── D. Reports & Evidence ────────────────────────────────────────────────
function isIncomplete(r: EventReport) {
  if (!r.isDraft) return false;
  const missingCore = !r.personInCharge?.trim() || !r.briefEventReport?.trim();
  const missingAttendance = !r.evidence.some((e) => e.category === 'attendance_register');
  return missingCore || missingAttendance;
}

function ReportsSection({ reports, loading, onChanged }: { reports: EventReport[]; loading: boolean; onChanged: () => void }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState<EventReport | null>(null);
  const [detail, setDetail] = useState<{ report: EventReport; versions: EventReport[] } | null>(null);
  const { ask, ReasonDialog } = useReasonModal();

  useEffect(() => {
    if (open) getReportDetail(open._id).then(setDetail).catch(() => toast.error('Failed to load report detail'));
    else setDetail(null);
  }, [open]);

  const filtered = useMemo(() => reports.filter((r) => !statusFilter || r.reviewStatus === statusFilter), [reports, statusFilter]);

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

  const canAct = detail && ['submitted', 'under_review'].includes(detail.report.reviewStatus);

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Reports &amp; Evidence</h2>
          <p className="text-muted text-sm" style={{ margin: '2px 0 0' }}>Current Activities Tracker submissions from every department.</p>
        </div>
        <select className="form-select" style={{ width: 190 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Review Statuses</option>
          <option value="draft">Draft / Incomplete</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="correction_requested">Correction Requested</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Programme</th><th>Department</th><th>Submitted</th><th>Review Status</th><th /></tr></thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>Loading reports…</td></tr>}
              {!loading && filtered.map((r) => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 600 }}>{r.nameOfProgram}</td>
                  <td>{r.conductingDepartment}</td>
                  <td>{r.submittedAt ? dateLabel(r.submittedAt) : <span className="text-muted">Not submitted</span>}</td>
                  <td>
                    <span className={statusBadge(r.reviewStatus)}>{r.reviewStatus.replace('_', ' ')}</span>
                    {isIncomplete(r) && <span className="badge badge-inactive" style={{ marginLeft: 6 }}>Incomplete</span>}
                  </td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => setOpen(r)}><Eye size={13} /> Open</button></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: 24 }}>No reports match this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="modal" style={{ maxWidth: 700 }}>
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>{open.nameOfProgram}</h3><button className="btn btn-ghost btn-icon" onClick={() => setOpen(null)}><X size={18} /></button></div>
            <div className="modal-body">
              {!detail ? <p className="text-muted">Loading…</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <DetailRow label="Conducting Department" value={detail.report.conductingDepartment} />
                    <DetailRow label="Programme Venue" value={detail.report.programVenue} />
                    <DetailRow label="Person in Charge" value={detail.report.personInCharge} />
                    <DetailRow label="Resource Person" value={detail.report.resourcePerson} />
                    <DetailRow label="Target Group & Beneficiaries" value={detail.report.targetGroupBeneficiaries?.join(', ')} />
                    <DetailRow label="Expected Strength" value={detail.report.expectedStrength} />
                    <DetailRow label="Number of Participants" value={detail.report.numberOfParticipants} />
                    <DetailRow label="Submission date" value={detail.report.submittedAt ? dateLabel(detail.report.submittedAt) : 'Not yet submitted'} />
                  </div>
                  <DetailRow label="Objectives" value={detail.report.objectives} />
                  <DetailRow label="Brief Event Report" value={detail.report.briefEventReport} />
                  {detail.report.feedbackText && <DetailRow label="Feedback" value={detail.report.feedbackText} />}
                  <div>
                    <div className="form-label" style={{ marginBottom: 6 }}>Evidence (Geo-tagged Photos / Attendance Register / Brochure &amp; Documents)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                      {detail.report.evidence.map((e) => (
                        <a key={e._id} href={e.url} target="_blank" rel="noreferrer" download style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', textDecoration: 'none' }}>
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
                  {detail.versions.length > 1 && (
                    <div>
                      <div className="form-label" style={{ marginBottom: 6 }}>Submission History</div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        {detail.versions.map((v) => (
                          <div key={v._id} className="text-sm" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                            <span>Version {v.version} {v.isCurrent && <strong>(current)</strong>}</span>
                            <span className={statusBadge(v.reviewStatus)}>{v.reviewStatus.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {canAct && (
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => correction(open._id)}>Request Corrections</button>
                <button className="btn btn-danger" onClick={() => reject(open._id)}>Reject</button>
                <button className="btn btn-primary" onClick={() => approve(open._id)}>Approve</button>
              </div>
            )}
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}

// ── E. Calendar View ──────────────────────────────────────────────────────
function CalendarViewSection({
  bookings, venues, loading, onChanged, initialAnchor,
}: { bookings: Booking[]; venues: Venue[]; loading: boolean; onChanged: () => void; initialAnchor: Date | null }) {
  const [view, setView] = useState<'week' | 'month'>('month');
  const [anchor, setAnchor] = useState(initialAnchor || new Date());
  const [deptFilter, setDeptFilter] = useState('');
  const [venueFilter, setVenueFilter] = useState('');
  const [detail, setDetail] = useState<Booking | null>(null);
  const { ask, ReasonDialog } = useReasonModal();

  useEffect(() => { if (initialAnchor) { setAnchor(initialAnchor); setView('week'); } }, [initialAnchor]);

  const departments = useMemo(() => Array.from(new Set(bookings.map((b) => b.conductingDepartment))).sort(), [bookings]);

  const filtered = useMemo(() => bookings.filter((b) => {
    if (b.status === 'cancelled') return false;
    if (deptFilter && b.conductingDepartment !== deptFilter) return false;
    if (venueFilter) { const vid = typeof b.venue === 'string' ? b.venue : b.venue._id; if (vid !== venueFilter) return false; }
    return true;
  }), [bookings, deptFilter, venueFilter]);

  const rangeDays = useMemo(() => {
    if (view === 'week') {
      const start = new Date(anchor); start.setDate(start.getDate() - start.getDay());
      return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first); start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [view, anchor]);

  const bookingsForDay = (day: Date) => filtered.filter((b) => new Date(b.date).toDateString() === day.toDateString());
  const shift = (days: number) => setAnchor((a) => { const d = new Date(a); d.setDate(d.getDate() + days); return d; });

  const cancel = (b: Booking) => ask({
    title: 'Cancel booking', confirmLabel: 'Cancel Booking', confirmTone: 'danger',
    description: `Cancel "${b.programName}"? A reason is required.`,
    onConfirm: async (reason) => { await cancelBooking(b._id, reason); toast.success('Booking cancelled'); setDetail(null); onChanged(); },
  });

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Calendar View — All Departments</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['week', 'month'] as const).map((v) => (
            <button key={v} className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setView(v)}>{v[0].toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <button className="btn btn-sm btn-outline" onClick={() => shift(view === 'month' ? -30 : -7)}>← Prev</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setAnchor(new Date())}>Today</button>
          <button className="btn btn-sm btn-outline" onClick={() => shift(view === 'month' ? 30 : 7)}>Next →</button>
          <span style={{ fontWeight: 600 }}>{view === 'month' ? anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : anchor.toDateString()}</span>
          <div style={{ flex: 1 }} />
          <select className="form-select" style={{ width: 180 }} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="form-select" style={{ width: 180 }} value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
            <option value="">All venues</option>
            {venues.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>
        </div>

        {departments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            {departments.map((d) => (
              <span key={d} className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: deptColor(d), display: 'inline-block' }} /> {d}
              </span>
            ))}
          </div>
        )}

        {loading ? <p className="text-muted">Loading…</p> : view === 'month' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} className="text-muted text-sm" style={{ fontWeight: 700, textAlign: 'center', padding: '4px 0' }}>{d}</div>)}
            {rangeDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              const inMonth = day.getMonth() === anchor.getMonth();
              return (
                <button key={i} onClick={() => { setAnchor(day); setView('week'); }} style={{ minHeight: 76, textAlign: 'left', borderRadius: 10, border: '1px solid var(--border)', background: inMonth ? 'var(--card)' : 'var(--bg)', padding: 8, cursor: 'pointer' }}>
                  <div className="text-sm" style={{ fontWeight: 600, color: inMonth ? 'var(--text)' : 'var(--text-light)' }}>{day.getDate()}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                    {dayBookings.slice(0, 4).map((b) => <span key={b._id} style={{ width: 7, height: 7, borderRadius: '50%', background: deptColor(b.conductingDepartment) }} />)}
                    {dayBookings.length > 4 && <span className="text-muted text-sm">+{dayBookings.length - 4}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {rangeDays.map((day, i) => {
              const dayBookings = bookingsForDay(day);
              return (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, background: 'var(--bg)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>{day.toDateString()}</div>
                  {dayBookings.length === 0 && <p className="text-muted text-sm">No bookings.</p>}
                  {dayBookings.map((b) => (
                    <button key={b._id} onClick={() => setDetail(b)} style={{ width: '100%', textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${deptColor(b.conductingDepartment)}`, borderRadius: 8, padding: 10, marginBottom: 8, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <strong style={{ fontSize: '0.85rem' }}>{b.programName}</strong>
                        <span className={statusBadge(b.eventStatus)}>{b.eventStatus.replace('_', ' ')}</span>
                      </div>
                      <div className="text-muted text-sm" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={12} /> {venueName(b.venue)} · {timeLabel(b.startTime)}–{timeLabel(b.endTime)} IST
                      </div>
                      <div className="text-muted text-sm">{b.conductingDepartment}</div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detail && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="modal">
            <div className="modal-header"><h3 style={{ margin: 0, fontSize: '1.05rem' }}>{detail.programName}</h3><button className="btn btn-ghost btn-icon" onClick={() => setDetail(null)}><X size={18} /></button></div>
            <div className="modal-body" style={{ display: 'grid', gap: 8 }}>
              <DetailRow label="Department" value={detail.conductingDepartment} />
              <DetailRow label="Venue" value={venueName(detail.venue)} />
              <DetailRow label="When" value={`${dateLabel(detail.date)} · ${timeLabel(detail.startTime)}–${timeLabel(detail.endTime)} IST`} />
              <DetailRow label="Coordinator" value={coordinatorName(detail)} />
              <DetailRow label="Status" value={<span className={statusBadge(detail.eventStatus)}>{detail.eventStatus.replace('_', ' ')}</span>} />
            </div>
            <div className="modal-footer"><button className="btn btn-danger" onClick={() => cancel(detail)}><Ban size={14} /> Cancel Booking</button></div>
          </div>
        </div>
      )}
      <ReasonDialog />
    </div>
  );
}
