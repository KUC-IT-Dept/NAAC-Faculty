/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Camera, Upload, Trash2, CheckCircle2, Clock, WifiOff, Loader2, MapPin,
  ChevronDown, ChevronRight, FileCheck2, AlertTriangle, Check,
} from 'lucide-react';
import PWAShell from './PWAShell';
import {
  Booking, EventReport, EvidenceFile,
  getAssignedEvent, saveReportDraft, uploadEvidence, deleteEvidence, submitReport,
} from '../../../lib/eventsApi';
import { offlineDrafts, offlineUploads, QueuedUpload } from '../../../lib/eventsOfflineDb';

const TARGET_GROUP_OPTIONS = ['UG', 'UG 1', 'UG 2', 'UG 3', 'UG 4', 'PG', 'PG 1', 'PG 2', 'PhD', 'College Staff', 'Entire College', 'Public'];
const EDITABLE_FIELDS = ['personInCharge', 'targetGroupBeneficiaries', 'dateFrom', 'dateTo', 'expectedStrength', 'objectives', 'resourcePerson', 'numberOfParticipants', 'briefEventReport', 'feedbackText'] as const;
const REQUIRED_FIELDS: { key: keyof EventReport; label: string }[] = [
  { key: 'nameOfProgram', label: 'Name of the Program' },
  { key: 'conductingDepartment', label: 'Conducting Department' },
  { key: 'personInCharge', label: 'Person in Charge' },
  { key: 'programVenue', label: 'Program Venue' },
  { key: 'briefEventReport', label: 'Brief Event Report' },
];
const BRIEF_REPORT_MAX = 500;

type Step = 'details' | 'evidence' | 'review';
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }

export default function EventUpdateWizard() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [report, setReport] = useState<EventReport | null>(null);
  const [isLead, setIsLead] = useState(false);
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'details');
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queued, setQueued] = useState<QueuedUpload[]>([]);
  const [localSavedAt, setLocalSavedAt] = useState<string | null>(null);
  const [submitLocked, setSubmitLocked] = useState(false);
  const flushing = useRef(false);

  const refreshQueue = useCallback(() => { if (bookingId) offlineUploads.listForBooking(bookingId).then(setQueued); }, [bookingId]);

  const load = useCallback(async () => {
    if (!bookingId) return;
    try {
      const d = await getAssignedEvent(bookingId);
      setBooking(d.booking);
      setIsLead(d.isLead);
      const localDraft = await offlineDrafts.get(bookingId);
      if (localDraft && d.report.isDraft && !localDraft.fields?._pendingSubmit) {
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

  const flushUploadQueue = useCallback(async () => {
    if (!bookingId || flushing.current) return;
    flushing.current = true;
    try {
      const items = await offlineUploads.listForBooking(bookingId);
      for (const item of items) {
        item.status = 'uploading'; await offlineUploads.update(item); refreshQueue();
        try {
          const file = new File([item.fileData], item.fileName, { type: item.fileType });
          const updated = await uploadEvidence(bookingId, file, item.category as EvidenceFile['category'], item.geo);
          setReport(updated);
          await offlineUploads.remove(item.id);
          toast.success(`${item.fileName} uploaded`);
        } catch (error: any) {
          item.status = 'failed'; item.attempts += 1; await offlineUploads.update(item);
          const message = error?.response?.data?.message
            || (error?.response ? `Server error (HTTP ${error.response.status})` : 'Network unavailable');
          toast.error(`${item.fileName}: ${message}`);
        }
        refreshQueue();
      }
    } finally { flushing.current = false; }
  }, [bookingId, refreshQueue]);

  const flushPendingSubmission = useCallback(async () => {
    if (!bookingId) return;
    const draft = await offlineDrafts.get(bookingId);
    if (draft?.fields?._pendingSubmit) {
      try { await submitReport(bookingId); await offlineDrafts.clear(bookingId); toast.success('Queued report submitted'); load(); }
      catch { /* still can't submit — stays queued for the next reconnect */ }
    }
  }, [bookingId, load]);

  useEffect(() => {
    const goOnline = () => { setIsOnline(true); flushUploadQueue(); flushPendingSubmission(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    if (navigator.onLine) flushUploadQueue();
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const updateField = (key: keyof EventReport, value: any) => setReport((r) => (r ? { ...r, [key]: value } : r));

  const persistLocalDraft = async (fields: Record<string, unknown>) => {
    if (!bookingId) return;
    const savedAt = new Date().toISOString();
    await offlineDrafts.save({ bookingId, fields, savedAt });
    setLocalSavedAt(savedAt);
  };

  const saveDraft = async (silent = false) => {
    if (!bookingId || !report) return;
    const fields: Record<string, unknown> = {};
    for (const k of EDITABLE_FIELDS) fields[k] = (report as any)[k];
    setSaving(true);
    try {
      const updated = await saveReportDraft(bookingId, fields);
      setReport(updated);
      await offlineDrafts.clear(bookingId);
      setLocalSavedAt(null);
      if (!silent) toast.success('Draft saved');
    } catch {
      await persistLocalDraft(fields);
      if (!silent) toast(isOnline ? 'Could not reach the server — draft kept on this device' : 'Offline — draft saved on this device and will sync when you reconnect', { icon: '📶' });
    } finally { setSaving(false); }
  };

  const captureGeoAndUpload = async (file: File, category: EvidenceFile['category']) => {
    if (!bookingId) return;
    const doUpload = async (geo?: any) => {
      if (!navigator.onLine) return enqueue(file, category, geo);
      try {
        const updated = await uploadEvidence(bookingId, file, category, geo);
        setReport(updated);
        toast.success(`${category.replace('_', ' ')} uploaded successfully`);
      } catch (error: any) {
        // Only queue when there was no HTTP response (offline/network failure).
        // A 4xx/5xx response means the server rejected/failed the request;
        // show the actual reason instead of disguising it as an offline upload.
        if (error?.response) {
          const message = error.response.data?.message
            || `Server rejected the upload (HTTP ${error.response.status}).`;
          toast.error(message);
          return;
        }
        await enqueue(file, category, geo);
      }
    };
    const enqueue = async (f: File, cat: EvidenceFile['category'], geo?: any) => {
      await offlineUploads.enqueue({ id: uid(), bookingId, category: cat, fileName: f.name, fileType: f.type || 'application/octet-stream', fileData: f, geo, queuedAt: new Date().toISOString(), status: 'queued', attempts: 0 });
      await refreshQueue();
      toast('File saved on this device — waiting to sync', { icon: '⏳' });
      // If the browser still reports online, attempt the queue immediately.
      // Otherwise it waits for the next online event or the user's Retry action.
      if (navigator.onLine) void flushUploadQueue();
    };

    if (category !== 'photo' || !navigator.geolocation) return doUpload();
    navigator.geolocation.getCurrentPosition(
      (pos) => doUpload({
        latitude: pos.coords.latitude, longitude: pos.coords.longitude,
        gpsAccuracyMeters: pos.coords.accuracy, capturedAt: new Date().toISOString(), locationSource: 'device_at_upload',
      }),
      () => doUpload(), // denied/unavailable — upload proceeds, flagged for HOD review server-side
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const removeEvidence = async (evidenceId: string) => {
    if (!bookingId) return;
    try { const updated = await deleteEvidence(bookingId, evidenceId); setReport(updated); }
    catch { toast.error('Failed to remove file — you may be offline'); }
  };
  const removeQueuedUpload = async (id: string) => { await offlineUploads.remove(id); refreshQueue(); };

  const submit = async () => {
    if (!bookingId || submitLocked) return;
    if (!window.confirm('Submit this report? It cannot be edited afterwards unless the HOD requests corrections.')) return;
    setSubmitLocked(true);
    if (!navigator.onLine) {
      await offlineDrafts.save({ bookingId, fields: { _pendingSubmit: true }, savedAt: new Date().toISOString() });
      toast('Offline — submission queued and will go through automatically once you reconnect', { icon: '⏳' });
      return;
    }
    try { await submitReport(bookingId); toast.success('Report submitted'); navigate(`/faculty/events/${bookingId}`); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Submission failed'); setSubmitLocked(false); }
  };

  if (!booking || !report) return <PWAShell title="Update Activity" backTo={`/faculty/events/${bookingId}`}><p style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>Loading…</p></PWAShell>;

  const locked = !report.isDraft || submitLocked;
  const missing = REQUIRED_FIELDS.filter((f) => !String((report as any)[f.key] || '').trim());
  const hasAttendance = report.evidence.some((e) => e.category === 'attendance_register');
  const gpsMissingPhotos = report.evidence.filter((e) => e.category === 'photo' && e.gpsMissing).length;
  const canSubmit = missing.length === 0 && hasAttendance && !locked && isLead;

  return (
    <PWAShell title="Update Activity" backTo={`/faculty/events/${bookingId}`}>
      {!isOnline && (
        <Banner tone="#92400e" bg="#fef3c7" icon={<WifiOff size={15} />}>You're offline — changes save on this device and sync automatically once you reconnect.</Banner>
      )}
      {localSavedAt && <Banner tone="#475569" bg="#f1f5f9" icon={<Clock size={15} />}>Saved on this device at {new Date(localSavedAt).toLocaleTimeString()} — not yet confirmed by the server.</Banner>}
      {submitLocked && report.isDraft && <Banner tone="#1e3a8a" bg="#dbeafe" icon={<Clock size={15} />}>Submission queued — will be sent as soon as you're back online. It will not be submitted twice.</Banner>}

      <StepHeader step={step} onSelect={(s) => report.isDraft && setStep(s)} />

      {step === 'details' && (
        <DetailsStep report={report} locked={locked} saving={saving} onChange={updateField} onSaveDraft={() => saveDraft()} onNext={() => { void saveDraft(true); setStep('evidence'); }} />
      )}

      {step === 'evidence' && (
        <EvidenceStep
          report={report} locked={locked} queued={queued}
          onUpload={captureGeoAndUpload} onRemove={removeEvidence} onRemoveQueued={removeQueuedUpload}
          onRetryQueued={flushUploadQueue} onBack={() => setStep('details')} onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <ReviewStep
          booking={booking} report={report} missing={missing} hasAttendance={hasAttendance}
          gpsMissingPhotos={gpsMissingPhotos} isLead={isLead} canSubmit={canSubmit} locked={locked}
          onBack={() => setStep('evidence')} onSubmit={submit}
        />
      )}
    </PWAShell>
  );
}

function Banner({ children, tone, bg, icon }: { children: React.ReactNode; tone: string; bg: string; icon: React.ReactNode }) {
  return <div style={{ background: bg, color: tone, borderRadius: 12, padding: '10px 12px', marginBottom: 12, fontSize: '0.78rem', display: 'flex', gap: 8, alignItems: 'center' }}>{icon}{children}</div>;
}

function StepHeader({ step, onSelect }: { step: Step; onSelect: (s: Step) => void }) {
  const steps: { id: Step; label: string }[] = [{ id: 'details', label: 'Details' }, { id: 'evidence', label: 'Evidence' }, { id: 'review', label: 'Review' }];
  const idx = steps.findIndex((s) => s.id === step);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
          <button onClick={() => onSelect(s.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700,
              background: i < idx ? '#1e3a8a' : i === idx ? '#2563eb' : '#e2e8f0', color: i <= idx ? '#fff' : '#94a3b8',
            }}>
              {i < idx ? <Check size={14} /> : i + 1}
            </span>
            <span style={{ fontSize: '0.68rem', color: i === idx ? '#1e3a8a' : '#94a3b8', fontWeight: i === idx ? 700 : 500 }}>{s.label}</span>
          </button>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < idx ? '#1e3a8a' : '#e2e8f0', margin: '0 6px 16px' }} />}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Details ──────────────────────────────────────────────────────
function DetailsStep({ report, locked, saving, onChange, onSaveDraft, onNext }: {
  report: EventReport; locked: boolean; saving: boolean; onChange: (k: keyof EventReport, v: any) => void; onSaveDraft: () => void; onNext: () => void;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 }}>
      <h3 style={{ fontSize: '0.95rem', margin: '0 0 12px' }}>Event Update</h3>
      <Field label="Person in Charge" required>
        <input className="wiz-input" disabled={locked} value={report.personInCharge || ''} onChange={(e) => onChange('personInCharge', e.target.value)} />
      </Field>
      <Field label="Resource Person">
        <input className="wiz-input" disabled={locked} value={report.resourcePerson || ''} onChange={(e) => onChange('resourcePerson', e.target.value)} />
      </Field>
      <Field label="Number of Participants">
        <input type="number" className="wiz-input" disabled={locked} value={report.numberOfParticipants ?? ''} onChange={(e) => onChange('numberOfParticipants', e.target.value ? Number(e.target.value) : null)} />
      </Field>
      <Field label="Target Group & Beneficiaries">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TARGET_GROUP_OPTIONS.map((opt) => {
            const active = (report.targetGroupBeneficiaries || []).includes(opt);
            return (
              <button
                key={opt} type="button" disabled={locked}
                onClick={() => onChange('targetGroupBeneficiaries', active ? report.targetGroupBeneficiaries.filter((o) => o !== opt) : [...(report.targetGroupBeneficiaries || []), opt])}
                style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: 999, border: active ? 'none' : '1px solid #cbd5e1', background: active ? '#1e3a8a' : '#fff', color: active ? '#fff' : '#475569', cursor: 'pointer' }}
              >{opt}</button>
            );
          })}
        </div>
      </Field>
      <Field label="Objectives">
        <textarea className="wiz-input" rows={2} disabled={locked} value={report.objectives || ''} onChange={(e) => onChange('objectives', e.target.value)} />
      </Field>
      <Field label={`Brief Event Report (${(report.briefEventReport || '').length} / ${BRIEF_REPORT_MAX})`} required>
        <textarea className="wiz-input" rows={5} maxLength={BRIEF_REPORT_MAX} disabled={locked} value={report.briefEventReport || ''} onChange={(e) => onChange('briefEventReport', e.target.value)} />
      </Field>

      {!locked && (
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <button onClick={onSaveDraft} disabled={saving} style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: 12, padding: '12px 0', fontWeight: 600, fontSize: '0.85rem' }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={onNext} style={{ flex: 1, background: '#1e3a8a', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: '0.85rem' }}>
            Next: Evidence →
          </button>
        </div>
      )}
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 5 }}>{label}{required && <span style={{ color: '#dc2626' }}> *</span>}</label>
      {children}
      <style>{`.wiz-input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;font-size:0.85rem;font-family:inherit;box-sizing:border-box;background:#fff;color:#0f172a}.wiz-input:disabled{background:#f8fafc;color:#64748b}`}</style>
    </div>
  );
}

// ── Step 2: Evidence ─────────────────────────────────────────────────────
const CATEGORIES: { id: EvidenceFile['category']; title: string; subtitle: string; required: boolean; accept?: string; camera?: boolean }[] = [
  { id: 'photo', title: 'Event Photos (Geo-tagged)', subtitle: 'Capture or upload photos with location', required: true, accept: 'image/*', camera: true },
  { id: 'attendance_register', title: 'Attendance Register', subtitle: 'PDF or image, max 20 MB', required: true },
  { id: 'brochure', title: 'Brochure + Other Documents', subtitle: 'PDF, JPG, PNG, max 20 MB', required: false },
  { id: 'feedback', title: 'Feedback', subtitle: 'Text or file (optional)', required: false },
];

function EvidenceStep({
  report, locked, queued, onUpload, onRemove, onRemoveQueued, onRetryQueued, onBack, onNext,
}: {
  report: EventReport; locked: boolean; queued: QueuedUpload[];
  onUpload: (f: File, c: EvidenceFile['category']) => void; onRemove: (id: string) => void; onRemoveQueued: (id: string) => void;
  onRetryQueued: () => void; onBack: () => void; onNext: () => void;
}) {
  const [expanded, setExpanded] = useState<EvidenceFile['category']>('photo');
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeCategory, setActiveCategory] = useState<EvidenceFile['category']>('photo');

  const onPick = (cat: EvidenceFile['category'], camera?: boolean) => {
    setActiveCategory(cat);
    if (inputRef.current) {
      inputRef.current.accept = CATEGORIES.find((c) => c.id === cat)?.accept || '*/*';
      if (camera) inputRef.current.setAttribute('capture', 'environment'); else inputRef.current.removeAttribute('capture');
      inputRef.current.click();
    }
  };
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, activeCategory);
    e.target.value = '';
  };

  return (
    <div>
      <h3 style={{ fontSize: '1rem', margin: '0 0 12px' }}>Upload Event Evidence</h3>
      <input ref={inputRef} type="file" style={{ display: 'none' }} onChange={onFileSelected} />

      {queued.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 8 }}>QUEUED UPLOADS — NOT YET ON SERVER</p>
          {queued.map((q) => (
            <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
              <span style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {q.status === 'uploading' ? <Loader2 size={13} className="spin" color="#2563eb" /> : q.status === 'failed' ? <WifiOff size={13} color="#dc2626" /> : <Clock size={13} color="#d97706" />}
                {q.fileName} <span style={{ color: '#94a3b8' }}>({q.status})</span>
              </span>
              <span style={{ display: 'flex', gap: 6 }}>
                {q.status !== 'uploading' && <button onClick={onRetryQueued} disabled={!navigator.onLine} style={{ fontSize: '0.72rem', color: navigator.onLine ? '#2563eb' : '#94a3b8', background: 'none', border: 'none', cursor: navigator.onLine ? 'pointer' : 'not-allowed' }}>Retry</button>}
                <button onClick={() => onRemoveQueued(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={13} color="#94a3b8" /></button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const files = report.evidence.filter((e) => e.category === cat.id);
          const isOpen = expanded === cat.id;
          return (
            <div key={cat.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setExpanded(isOpen ? ('' as any) : cat.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {cat.id === 'photo' ? <Camera size={17} color="#1e3a8a" /> : <FileCheck2 size={17} color="#1e3a8a" />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{cat.title}{cat.required && <span style={{ color: '#dc2626' }}> *</span>}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{cat.subtitle}</div>
                  {files.length > 0 && <div style={{ fontSize: '0.72rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}><CheckCircle2 size={12} /> {files.length} file{files.length > 1 ? 's' : ''} uploaded</div>}
                </span>
                {isOpen ? <ChevronDown size={16} color="#94a3b8" /> : <ChevronRight size={16} color="#94a3b8" />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 14px 14px' }}>
                  {!locked && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <button onClick={() => onPick(cat.id, cat.camera)} style={{ flex: 1, background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {cat.camera ? <><Camera size={14} /> Take Photo</> : <><Upload size={14} /> Choose File</>}
                      </button>
                      {cat.camera && (
                        <button onClick={() => { inputRef.current?.removeAttribute('capture'); onPick(cat.id, false); }} style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: 10, padding: '9px 0', fontSize: '0.78rem', fontWeight: 600 }}>
                          From Gallery
                        </button>
                      )}
                    </div>
                  )}
                  {files.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No files uploaded yet.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: cat.id === 'photo' ? 'repeat(3, 1fr)' : '1fr', gap: 8 }}>
                      {files.map((f) => <EvidenceThumb key={f._id} file={f} onRemove={locked ? undefined : () => onRemove(f._id)} />)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: 12, padding: '12px 0', fontWeight: 600, fontSize: '0.85rem' }}>← Back</button>
        <button onClick={onNext} style={{ flex: 1, background: '#1e3a8a', border: 'none', color: '#fff', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: '0.85rem' }}>Next: Review →</button>
      </div>
    </div>
  );
}

function EvidenceThumb({ file, onRemove }: { file: EvidenceFile; onRemove?: () => void }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      {file.category === 'photo' ? (
        <img src={file.url} alt="" style={{ width: '100%', height: 78, objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: '#334155' }}><FileCheck2 size={14} /> {file.originalName || file.category}</div>
      )}
      {file.category === 'photo' && (
        <div style={{ padding: '4px 6px', fontSize: '0.62rem' }}>
          {file.locationSource === 'device_at_upload' ? (
            <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} /> GPS at upload{file.gpsAccuracyMeters ? ` · ±${Math.round(file.gpsAccuracyMeters)}m` : ''}</span>
          ) : (
            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={10} /> Location unavailable</span>
          )}
        </div>
      )}
      {onRemove && <button onClick={onRemove} style={{ width: '100%', background: '#fef2f2', border: 'none', color: '#dc2626', fontSize: '0.68rem', padding: '4px 0', cursor: 'pointer' }}>Remove</button>}
    </div>
  );
}

// ── Step 3: Review ───────────────────────────────────────────────────────
function ReviewStep({
  booking, report, missing, hasAttendance, gpsMissingPhotos, isLead, canSubmit, locked, onBack, onSubmit,
}: {
  booking: Booking; report: EventReport; missing: { key: keyof EventReport; label: string }[]; hasAttendance: boolean;
  gpsMissingPhotos: number; isLead: boolean; canSubmit: boolean; locked: boolean; onBack: () => void; onSubmit: () => void;
}) {
  const venueName = typeof booking.venue === 'string' ? booking.venue : booking.venue.name;
  return (
    <div>
      <h3 style={{ fontSize: '1rem', margin: '0 0 12px' }}>Review &amp; Submit</h3>

      {!report.isDraft ? (
        <Banner tone="#065f46" bg="#d1fae5" icon={<CheckCircle2 size={15} />}>
          Submitted {report.submittedAt ? `on ${new Date(report.submittedAt).toLocaleString()}` : ''} — status: {report.reviewStatus.replace('_', ' ')}.
        </Banner>
      ) : (
        <>
          {missing.length > 0 && (
            <Banner tone="#991b1b" bg="#fee2e2" icon={<AlertTriangle size={15} />}>
              Missing: {missing.map((m) => m.label).join(', ')}
            </Banner>
          )}
          {!hasAttendance && <Banner tone="#991b1b" bg="#fee2e2" icon={<AlertTriangle size={15} />}>Attendance Register has not been uploaded.</Banner>}
          {gpsMissingPhotos > 0 && <Banner tone="#92400e" bg="#fef3c7" icon={<AlertTriangle size={15} />}>{gpsMissingPhotos} photo(s) have no location — they'll be flagged for HOD review, not rejected.</Banner>}
          {!isLead && <Banner tone="#475569" bg="#f1f5f9" icon={<AlertTriangle size={15} />}>Only the lead faculty member can submit — you can still edit details and evidence above.</Banner>}
        </>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <SectionLabel>From Booking</SectionLabel>
        <ReviewRow label="Name of Program" value={report.nameOfProgram} />
        <ReviewRow label="Conducting Department" value={report.conductingDepartment} />
        <ReviewRow label="Program Venue" value={venueName} />
        <ReviewRow label="Expected Strength" value={booking.expectedStrength} />
        <SectionLabel>Faculty-Entered</SectionLabel>
        <ReviewRow label="Person in Charge" value={report.personInCharge} />
        <ReviewRow label="Resource Person" value={report.resourcePerson} />
        <ReviewRow label="Number of Participants" value={report.numberOfParticipants} />
        <ReviewRow label="Brief Event Report" value={report.briefEventReport} />
        <ReviewRow label="Feedback" value={report.feedbackText} />
        <SectionLabel>Evidence ({report.evidence.length})</SectionLabel>
        <p style={{ fontSize: '0.8rem', color: '#475569' }}>
          {CATEGORIES_SUMMARY(report.evidence)}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack} style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: 12, padding: '13px 0', fontWeight: 600, fontSize: '0.85rem' }}>← Back</button>
        {report.isDraft && (
          <button onClick={onSubmit} disabled={!canSubmit} style={{ flex: 2, background: canSubmit ? '#1e3a8a' : '#cbd5e1', border: 'none', color: '#fff', borderRadius: 12, padding: '13px 0', fontWeight: 700, fontSize: '0.88rem', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            Submit Final Report
          </button>
        )}
      </div>
      {locked && report.isDraft && <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>Submission in progress — button disabled to prevent a duplicate submit.</p>}
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>{children}</p>;
}
function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  const has = value !== undefined && value !== null && String(value).trim() !== '';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '5px 0', fontSize: '0.8rem' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: has ? '#0f172a' : '#cbd5e1', fontStyle: has ? 'normal' : 'italic', textAlign: 'right' }}>{has ? value : 'Not provided'}</span>
    </div>
  );
}
function CATEGORIES_SUMMARY(evidence: EvidenceFile[]) {
  const byCat = CATEGORIES.map((c) => `${evidence.filter((e) => e.category === c.id).length} ${c.title.split(' (')[0]}`).join(' · ');
  return byCat;
}
