/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../../../components/AppLayout';
import toast from 'react-hot-toast';
import { Camera, Upload, Trash2, CheckCircle2, Clock, WifiOff, Loader2 } from 'lucide-react';
import {
  Booking, EventReport, EvidenceFile,
  getAssignedEvent, saveReportDraft, uploadEvidence, deleteEvidence, submitReport,
} from '../../../lib/eventsApi';
import { offlineDrafts, offlineUploads, QueuedUpload } from '../../../lib/eventsOfflineDb';

const TARGET_GROUP_OPTIONS = ['UG', 'UG 1', 'UG 2', 'UG 3', 'UG 4', 'PG', 'PG 1', 'PG 2', 'PhD', 'College Staff', 'Entire College', 'Public'];
const EDITABLE_FIELDS = ['personInCharge', 'targetGroupBeneficiaries', 'dateFrom', 'dateTo', 'expectedStrength', 'objectives', 'resourcePerson', 'numberOfParticipants', 'briefEventReport', 'feedbackText'] as const;

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }

export default function EventReportForm() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [report, setReport] = useState<EventReport | null>(null);
  const [isLead, setIsLead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState<QueuedUpload[]>([]);
  const [localSavedAt, setLocalSavedAt] = useState<string | null>(null);
  const [submitLocked, setSubmitLocked] = useState(false); // duplicate-submission protection
  const [pendingCategory, setPendingCategory] = useState<EvidenceFile['category']>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const flushing = useRef(false);

  const refreshQueue = useCallback(() => {
    if (!bookingId) return;
    offlineUploads.listForBooking(bookingId).then(setQueued);
  }, [bookingId]);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const d = await getAssignedEvent(bookingId);
      setBooking(d.booking);
      setIsLead(d.isLead);

      // Merge in any unsynced local draft edits (offline-first) so the
      // faculty member never loses work made while disconnected.
      const localDraft = await offlineDrafts.get(bookingId);
      if (localDraft && d.report.isDraft) {
        setReport({ ...d.report, ...localDraft.fields });
        setLocalSavedAt(localDraft.savedAt);
      } else {
        setReport(d.report);
      }
    } catch {
      toast.error('Could not load this event — showing any locally saved draft if available');
      const localDraft = bookingId ? await offlineDrafts.get(bookingId) : null;
      if (localDraft) setReport((r) => (r ? { ...r, ...localDraft.fields } : r));
    }
    refreshQueue();
  }, [bookingId, refreshQueue]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/events-manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/events-sw.js').catch(() => {});
    return () => { document.head.removeChild(link); };
  }, []);

  const flushUploadQueue = useCallback(async () => {
    if (!bookingId || flushing.current) return;
    flushing.current = true;
    try {
      const items = await offlineUploads.listForBooking(bookingId);
      for (const item of items) {
        item.status = 'uploading';
        await offlineUploads.update(item);
        refreshQueue();
        try {
          const file = new File([item.fileData], item.fileName, { type: item.fileType });
          const updated = await uploadEvidence(bookingId, file, item.category as EvidenceFile['category'], item.geo);
          setReport(updated);
          await offlineUploads.remove(item.id);
          toast.success(`${item.fileName} uploaded`);
        } catch {
          item.status = 'failed';
          item.attempts += 1;
          await offlineUploads.update(item);
        }
        refreshQueue();
      }
    } finally {
      flushing.current = false;
    }
  }, [bookingId, refreshQueue]);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); flushUploadQueue(); flushPendingSubmission(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (navigator.onLine) flushUploadQueue();
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // ── Draft editing (offline-first) ───────────────────────────────────────
  const updateField = (key: keyof EventReport, value: any) => {
    setReport((r) => (r ? { ...r, [key]: value } : r));
  };

  const persistDraft = async (fields: Record<string, unknown>) => {
    if (!bookingId) return;
    const savedAt = new Date().toISOString();
    await offlineDrafts.save({ bookingId, fields, savedAt });
    setLocalSavedAt(savedAt);
  };

  const saveDraft = async () => {
    if (!bookingId || !report) return;
    const fields: Record<string, unknown> = {};
    for (const k of EDITABLE_FIELDS) fields[k] = (report as any)[k];

    setSaving(true);
    try {
      const updated = await saveReportDraft(bookingId, fields);
      setReport(updated);
      await offlineDrafts.clear(bookingId); // server now has it — local copy no longer needed
      setLocalSavedAt(null);
      toast.success('Draft saved to server');
    } catch {
      // Offline (or server error) — the draft is never lost: it's already
      // persisted to IndexedDB below, visibly marked as "saved locally".
      await persistDraft(fields);
      toast(isOnline ? 'Could not reach the server — draft kept locally' : 'Offline — draft saved locally and will sync when you reconnect', { icon: '📶' });
    } finally {
      setSaving(false);
    }
  };

  // ── Evidence capture/upload ─────────────────────────────────────────────
  const captureGeoAndUpload = async (file: File, category: EvidenceFile['category']) => {
    if (!bookingId) return;
    const doUpload = async (geo?: any) => {
      if (!navigator.onLine) return enqueue(file, category, geo);
      try {
        const updated = await uploadEvidence(bookingId, file, category, geo);
        setReport(updated);
        toast.success(`${category.replace('_', ' ')} uploaded`);
      } catch {
        await enqueue(file, category, geo); // network blip — never silently drop it
      }
    };
    const enqueue = async (f: File, cat: EvidenceFile['category'], geo?: any) => {
      await offlineUploads.enqueue({
        id: uid(), bookingId, category: cat, fileName: f.name, fileType: f.type || 'application/octet-stream',
        fileData: f, geo, queuedAt: new Date().toISOString(), status: 'queued', attempts: 0,
      });
      refreshQueue();
      toast('File queued — never claimed as uploaded until the server confirms it', { icon: '⏳' });
    };

    if (category !== 'photo' || !navigator.geolocation) return doUpload();
    navigator.geolocation.getCurrentPosition(
      (pos) => doUpload({
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        gpsAccuracyMeters: pos.coords.accuracy, capturedAt: new Date().toISOString(),
      }),
      () => doUpload(), // denied/unavailable: upload still proceeds, flagged server-side
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) captureGeoAndUpload(file, pendingCategory);
    e.target.value = '';
  };

  const removeEvidence = async (evidenceId: string) => {
    if (!bookingId) return;
    try { const updated = await deleteEvidence(bookingId, evidenceId); setReport(updated); }
    catch { toast.error('Failed to remove file — you may be offline'); }
  };

  const removeQueuedUpload = async (id: string) => { await offlineUploads.remove(id); refreshQueue(); };
  const retryQueuedUpload = async () => { await flushUploadQueue(); };

  // ── Submission (with offline + duplicate-tap protection) ────────────────
  const flushPendingSubmission = useCallback(async () => {
    if (!bookingId) return;
    const draft = await offlineDrafts.get(bookingId);
    if (draft?.fields?._pendingSubmit) {
      try {
        await submitReport(bookingId);
        await offlineDrafts.clear(bookingId);
        toast.success('Queued report submitted');
        load();
      } catch {
        // still can't submit — leave the pending flag in place for the next reconnect
      }
    }
  }, [bookingId, load]);

  const submit = async () => {
    if (!bookingId || submitLocked) return; // blocks a second tap while the first is in flight/queued
    if (!window.confirm('Submit this report? Only the lead faculty member can submit, and it cannot be edited afterwards unless the HOD requests corrections.')) return;

    setSubmitLocked(true);
    if (!navigator.onLine) {
      await offlineDrafts.save({ bookingId, fields: { _pendingSubmit: true }, savedAt: new Date().toISOString() });
      toast('Offline — submission queued and will go through automatically once you reconnect', { icon: '⏳' });
      return; // stays locked until the server actually confirms (prevents duplicate submit taps)
    }
    try {
      await submitReport(bookingId);
      toast.success('Report submitted');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Submission failed');
      setSubmitLocked(false);
    }
  };

  if (!booking || !report) {
    return <AppLayout title="Event Report"><div className="card"><div className="card-body text-muted">Loading…</div></div></AppLayout>;
  }

  const locked = !report.isDraft || submitLocked;

  return (
    <AppLayout title={booking.programName}>
      {!isOnline && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--warning)' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14 }}>
            <WifiOff size={16} color="var(--warning)" />
            <span className="text-sm">You are offline. Draft edits and evidence uploads are saved locally and will sync automatically once you reconnect.</span>
          </div>
        </div>
      )}
      {localSavedAt && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--text-light)' }}>
          <div className="card-body text-sm text-muted" style={{ padding: 14 }}>
            Saved locally at {new Date(localSavedAt).toLocaleTimeString()} — not yet confirmed by the server.
          </div>
        </div>
      )}
      {submitLocked && report.isDraft && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--primary)' }}>
          <div className="card-body text-sm" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--primary)" /> Submission queued — will be sent as soon as you're back online. It will not be submitted twice.
          </div>
        </div>
      )}
      {!report.isDraft && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--primary)' }}>
          <div className="card-body text-sm" style={{ padding: 14 }}>
            Submitted {report.submittedAt ? `on ${new Date(report.submittedAt).toLocaleString()}` : ''} — status: <span className="badge badge-primary">{report.reviewStatus.replace('_', ' ')}</span>
            {report.correctionNotes && <div style={{ marginTop: 6 }}><strong>HOD notes:</strong> {report.correctionNotes}</div>}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3 style={{ fontSize: '1rem', margin: 0 }}>Event details (from booking)</h3></div>
        <div className="card-body" style={{ display: 'grid', gap: 8 }}>
          <DetailRow label="1. Name of the Program" value={report.nameOfProgram} />
          <DetailRow label="2. Conducting Department" value={report.conductingDepartment} />
          <DetailRow label="4. Program Venue" value={report.programVenue} />
          <DetailRow label="6. Date" value={`${report.dateFrom ? new Date(report.dateFrom).toDateString() : ''} – ${report.dateTo ? new Date(report.dateTo).toDateString() : ''}`} />
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3 style={{ fontSize: '1rem', margin: 0 }}>Report fields</h3></div>
        <div className="card-body">
          <TextField label="3. Person in Charge" value={report.personInCharge} onChange={(v) => updateField('personInCharge', v)} disabled={locked} />
          <MultiSelectField label="5. Target Group & Beneficiaries" options={TARGET_GROUP_OPTIONS} value={report.targetGroupBeneficiaries} onChange={(v) => updateField('targetGroupBeneficiaries', v)} disabled={locked} />
          <NumberField label="7. Expected Strength" value={report.expectedStrength} onChange={(v) => updateField('expectedStrength', v)} disabled={locked} />
          <TextAreaField label="8. Objectives" value={report.objectives} onChange={(v) => updateField('objectives', v)} disabled={locked} />
          <TextField label="9. Resource Person" value={report.resourcePerson} onChange={(v) => updateField('resourcePerson', v)} disabled={locked} />
          <NumberField label="10. Number of Participants" value={report.numberOfParticipants} onChange={(v) => updateField('numberOfParticipants', v)} disabled={locked} />
          <TextAreaField label="12. Brief Event Report" value={report.briefEventReport} onChange={(v) => updateField('briefEventReport', v)} disabled={locked} />
          <TextAreaField label="15. Feedback" value={report.feedbackText} onChange={(v) => updateField('feedbackText', v)} disabled={locked} />
          {!locked && (
            <button className="btn btn-outline btn-sm" disabled={saving} onClick={saveDraft}>
              {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : 'Save Draft'}
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3 style={{ fontSize: '1rem', margin: 0 }}>Evidence</h3></div>
        <div className="card-body">
          {!locked && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              <select className="form-select" style={{ width: 220 }} value={pendingCategory} onChange={(e) => setPendingCategory(e.target.value as any)}>
                <option value="photo">11. Photo (geo-tagged)</option>
                <option value="attendance_register">13. Attendance Register</option>
                <option value="brochure">14. Brochure</option>
                <option value="document">14. Document</option>
                <option value="feedback">15. Feedback file</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
                {pendingCategory === 'photo' ? <><Camera size={14} /> Take / Choose Photo</> : <><Upload size={14} /> Upload File</>}
              </button>
              <input
                ref={fileInputRef} type="file" accept={pendingCategory === 'photo' ? 'image/*' : undefined}
                capture={pendingCategory === 'photo' ? 'environment' : undefined}
                style={{ display: 'none' }} onChange={onFileSelected}
              />
            </div>
          )}

          {queued.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="form-label">Queued uploads (not yet confirmed by server)</p>
              {queued.map((q) => (
                <div key={q.id} className="list-item-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {q.status === 'uploading' ? <Loader2 size={14} className="spin" color="var(--primary)" /> : q.status === 'failed' ? <WifiOff size={14} color="var(--danger)" /> : <Clock size={14} color="var(--warning)" />}
                    <span className="text-sm">{q.fileName} <span className="text-muted">({q.category.replace('_', ' ')}) — {q.status}</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {q.status === 'failed' && <button className="btn btn-ghost btn-sm" onClick={retryQueuedUpload}>Retry</button>}
                    <button className="btn btn-ghost btn-sm" onClick={() => removeQueuedUpload(q.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <EvidenceGallery evidence={report.evidence} onRemove={locked ? undefined : removeEvidence} />
        </div>
      </div>

      {!locked && isLead && (
        <button className="btn btn-primary w-full btn-lg" onClick={submit}>
          <CheckCircle2 size={16} /> Submit Final Report
        </button>
      )}
      {!locked && !isLead && (
        <p className="text-muted text-sm">Only the lead faculty member can submit the final report. You can still contribute evidence and information above.</p>
      )}
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return <div><div className="form-label" style={{ marginBottom: 2 }}>{label}</div><div style={{ fontSize: '0.9rem' }}>{value || '—'}</div></div>;
}
function TextField({ label, value, onChange, disabled }: { label: string; value?: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function NumberField({ label, value, onChange, disabled }: { label: string; value?: number | null; onChange: (v: number | null) => void; disabled?: boolean }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type="number" className="form-input" value={value ?? ''} disabled={disabled} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} />
    </div>
  );
}
function TextAreaField({ label, value, onChange, disabled }: { label: string; value?: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea className="form-textarea" value={value || ''} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function MultiSelectField({ label, options, value, onChange, disabled }: { label: string; options: string[]; value?: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const toggle = (opt: string) => {
    const cur = value || [];
    onChange(cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt]);
  };
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => (
          <button
            type="button" key={opt} disabled={disabled} onClick={() => toggle(opt)}
            className={`btn btn-sm ${(value || []).includes(opt) ? 'btn-primary' : 'btn-outline'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
function EvidenceGallery({ evidence, onRemove }: { evidence: EvidenceFile[]; onRemove?: (id: string) => void }) {
  if (evidence.length === 0) return <p className="text-muted text-sm">No evidence uploaded yet.</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
      {evidence.map((e) => (
        <div key={e._id} style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {e.category === 'photo' ? (
            <img src={e.url} alt={e.category} style={{ width: '100%', height: 96, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', fontSize: '0.72rem', color: 'var(--text-muted)', padding: 6, textAlign: 'center' }}>
              {e.originalName || e.category}
            </div>
          )}
          <div style={{ padding: 8, fontSize: '0.72rem' }}>
            <div style={{ fontWeight: 600 }}>{e.category.replace('_', ' ')}</div>
            {e.category === 'photo' && (e.gpsMissing ? <span style={{ color: 'var(--warning)' }}>No GPS tag</span> : <span style={{ color: 'var(--success)' }}>GPS tagged</span>)}
            {onRemove && <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px', marginTop: 4 }} onClick={() => onRemove(e._id)}><Trash2 size={12} color="var(--danger)" /></button>}
          </div>
        </div>
      ))}
    </div>
  );
}
