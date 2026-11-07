/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, Building2, User as UserIcon, MapPin, Users, Target, Pencil, FileCheck2, AlertCircle } from 'lucide-react';
import PWAShell from './PWAShell';
import { Booking, EventReport, getAssignedEvent } from '../../../lib/eventsApi';

type Tab = 'info' | 'updates' | 'evidence';

export default function EventDetailsScreen() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [report, setReport] = useState<EventReport | null>(null);
  const [isLead, setIsLead] = useState(false);
  const [tab, setTab] = useState<Tab>('info');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    getAssignedEvent(bookingId)
      .then((d) => { setBooking(d.booking); setReport(d.report); setIsLead(d.isLead); })
      // The backend already enforces that only assigned faculty can open a
      // booking (403 otherwise) — this just surfaces that honestly instead
      // of a blank screen, rather than granting any extra client-side access.
      .catch((e: any) => setError(e?.response?.data?.message || 'This event is not available to you.'));
  }, [bookingId]);

  if (error) {
    return (
      <PWAShell title="Event" backTo="/faculty/events">
        <div style={{ textAlign: 'center', padding: 40, color: '#991b1b' }}><AlertCircle size={28} style={{ marginBottom: 10 }} /><p>{error}</p></div>
      </PWAShell>
    );
  }
  if (!booking || !report) {
    return <PWAShell title="Event" backTo="/faculty/events"><p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading…</p></PWAShell>;
  }

  const venueName = typeof booking.venue === 'string' ? booking.venue : booking.venue.name;

  return (
    <PWAShell title={booking.programName} backTo="/faculty/events">
      <div style={{ display: 'flex', gap: 6, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {(['info', 'updates', 'evidence'] as Tab[]).map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, border: 'none', borderRadius: 9, padding: '9px 0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: tab === t ? '#1e3a8a' : 'transparent', color: tab === t ? '#fff' : '#475569',
            }}
          >
            {t === 'info' ? 'Event Info' : t === 'updates' ? 'Updates' : 'Evidence'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Event Information (from booking — read only)</p>
          <InfoRow icon={<Building2 size={16} />} label="Conducting Department" value={booking.conductingDepartment} />
          <InfoRow icon={<UserIcon size={16} />} label="Person in Charge" value={report.personInCharge} />
          <InfoRow icon={<MapPin size={16} />} label="Venue" value={venueName} />
          <InfoRow icon={<CalendarDays size={16} />} label="Date & Time" value={`${new Date(booking.startTime).toLocaleString()} – ${new Date(booking.endTime).toLocaleTimeString()}`} />
          <InfoRow icon={<Users size={16} />} label="Expected Strength" value={booking.expectedStrength} />
          <InfoRow icon={<Target size={16} />} label="Objectives" value={booking.objectives} />
          <InfoRow icon={<Users size={16} />} label="Target Group & Beneficiaries" value={booking.targetGroups?.join(', ')} />

          <button
            onClick={() => navigate(`/faculty/events/${bookingId}/update`)}
            disabled={!report.isDraft}
            style={{ width: '100%', marginTop: 16, background: report.isDraft ? '#1e3a8a' : '#cbd5e1', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 700, fontSize: '0.9rem', cursor: report.isDraft ? 'pointer' : 'not-allowed' }}
          >
            <Pencil size={14} style={{ marginRight: 6, verticalAlign: -2 }} /> {report.isDraft ? 'Update Activity' : 'Report Submitted'}
          </button>
          {!isLead && report.isDraft && <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>Only the lead faculty can submit the final report — you can still add evidence.</p>}
        </div>
      )}

      {tab === 'updates' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Faculty-Entered Updates</p>
          <InfoRow icon={<UserIcon size={16} />} label="Resource Person" value={report.resourcePerson} />
          <InfoRow icon={<Users size={16} />} label="Number of Participants" value={report.numberOfParticipants} />
          <InfoRow icon={<FileCheck2 size={16} />} label="Brief Event Report" value={report.briefEventReport} multiline />
          <InfoRow icon={<FileCheck2 size={16} />} label="Feedback" value={report.feedbackText} multiline />
          {report.correctionNotes && (
            <div style={{ background: '#fef3c7', color: '#92400e', borderRadius: 10, padding: '10px 12px', marginTop: 10, fontSize: '0.8rem' }}>
              <strong>HOD correction notes:</strong> {report.correctionNotes}
            </div>
          )}
          <button onClick={() => navigate(`/faculty/events/${bookingId}/update`)} disabled={!report.isDraft} style={{ width: '100%', marginTop: 14, background: 'transparent', border: '1px solid #1e3a8a', color: '#1e3a8a', borderRadius: 12, padding: '11px 0', fontWeight: 600, fontSize: '0.85rem', cursor: report.isDraft ? 'pointer' : 'not-allowed', opacity: report.isDraft ? 1 : 0.5 }}>
            Edit Updates
          </button>
        </div>
      )}

      {tab === 'evidence' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
          <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12 }}>Uploaded Evidence ({report.evidence.length})</p>
          {report.evidence.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>No evidence uploaded yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {report.evidence.map((e) => (
                <a key={e._id} href={e.url} target="_blank" rel="noreferrer" style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', textDecoration: 'none' }}>
                  {e.category === 'photo' ? (
                    <img src={e.url} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}><FileCheck2 size={18} color="#64748b" /></div>
                  )}
                  <div style={{ padding: 5, fontSize: '0.62rem', color: '#475569', textAlign: 'center' }}>{e.category.replace('_', ' ')}</div>
                </a>
              ))}
            </div>
          )}
          <button onClick={() => navigate(`/faculty/events/${bookingId}/update?step=evidence`)} disabled={!report.isDraft} style={{ width: '100%', marginTop: 14, background: 'transparent', border: '1px solid #1e3a8a', color: '#1e3a8a', borderRadius: 12, padding: '11px 0', fontWeight: 600, fontSize: '0.85rem', cursor: report.isDraft ? 'pointer' : 'not-allowed', opacity: report.isDraft ? 1 : 0.5 }}>
            Upload Evidence
          </button>
        </div>
      )}
    </PWAShell>
  );
}

function InfoRow({ icon, label, value, multiline }: { icon: React.ReactNode; label: string; value?: string | number | null; multiline?: boolean }) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#1e3a8a', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: hasValue ? '#0f172a' : '#cbd5e1', fontStyle: hasValue ? 'normal' : 'italic', whiteSpace: multiline ? 'pre-wrap' : 'nowrap', overflow: multiline ? 'visible' : 'hidden', textOverflow: multiline ? 'clip' : 'ellipsis' }}>
          {hasValue ? value : 'Not provided in booking'}
        </div>
      </div>
    </div>
  );
}
