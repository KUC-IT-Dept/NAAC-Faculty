/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/LibraryWizard.tsx
//
// Full-page, 8-step wizard for creating/editing a Library record
// (0.9.1 - 0.9.9 of "library details.pdf"). Replaces the former modal form.
// Talks to the unchanged /api/library contract: it only produces the same
// record shape the model already defines.
import { useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { LibraryRecord } from '../../lib/institutionalApi';
import { getPath, setPath } from './formUtils';
import RecordFields from './RecordViewer';
import {
  Errors, WizardShell, TextField, NumField, DateField, SelectField, YesNoField, TextAreaField, Sub, Note, cleanPayload,
} from './wizardKit';

type LibraryForm = Partial<LibraryRecord> & { academicYear: string };

function emptyLibraryRecord(academicYear = ''): LibraryForm {
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
      timing: { daysPerWeek: 0, fromTime: '', toTime: '', closedOnSaturday: false, closedOnSunday: false },
    },
    collections: {
      totalBooks: { subject: '', number: 0 },
      journalsAndPeriodicals: { print: 0, electronic: 0, national: 0, international: 0 },
      digitalResources: { databases: 0, ebooks: 0, institutionalRepository: 0 },
      specialCollections: { rareBooks: 0, theses: 0, manuscripts: 0 },
      annualAdditions: { newTitlesPurchased: 0, subscribed: 0 },
      contributionsByStudents: 0,
      donations: { byAlumni: 0, byStaff: 0, byOthers: 0 },
    },
    technology: {
      libraryManagementSoftware: '', opacAvailable: false, institutionalRepositoryAccess: false,
      remoteAccessFacilities: '', digitalLiteracyPrograms: {},
    },
    staffing: {
      supportStaffCount: 0, qualificationsAndTraining: '', userServices: '',
      orientationPrograms: { photoUploads: [] }, workshopsAndSeminars: [], plagiarismChecks: [],
    },
    usage: {
      footfall: { daily: 0, annual: 0 },
      circulation: { booksIssued: 0, booksReturned: 0, source: 'manual' },
      digitalResourceUsage: { totalDownloadsOrLogins: 0 },
      feedbackMechanisms: '',
    },
    compliance: {
      copyrightCompliance: false, dataPrivacyCompliance: false,
      disasterPreparedness: { fireSafety: '', digitalBackup: false }, preservationMeasures: [],
    },
    financial: { annualBudgetAllocation: 0, subscriptionsAndMemberships: '' },
    bestPractices: { practices: '', innovations: '', details: '' },
    uploads: [],
  } as LibraryForm;
}

const STEPS = ['General', 'Infrastructure', 'Collections', 'Technology', 'Staffing & Services', 'Usage & Engagement', 'Compliance', 'Finance & Review'];
const STEP_TITLES = [
  '0.9.1 General', '0.9.2 Infrastructure', '0.9.3 Collections', '0.9.4 Technology & Digital Access',
  '0.9.5 Staffing & Services', '0.9.6 Usage & Engagement', '0.9.7 Compliance & Precautions',
  '0.9.8 Financial Status · 0.9.9 Best Practices · Review',
];
const DATE_KEYS = ['joiningDate', 'from', 'to', 'date'];
const PRESERVATION = [
  { value: 'binding', label: 'Binding' }, { value: 'digitization', label: 'Digitization' }, { value: 'climate_control', label: 'Climate control' },
];

// Whole numbers >= 0, per step (paths into the record).
const NUM_PATHS: string[][] = [
  ['librarian.yearsOfService'],
  ['infrastructure.totalFloorAreaSqFt', 'infrastructure.seatingCapacity.readingRooms', 'infrastructure.seatingCapacity.studyCarrels', 'infrastructure.seatingCapacity.digitalLabs',
    'infrastructure.accessibility.ramps', 'infrastructure.accessibility.lifts', 'infrastructure.accessibility.wheelchairs',
    'infrastructure.safetyMeasures.fireAlarms', 'infrastructure.safetyMeasures.cctv', 'infrastructure.safetyMeasures.emergencyExits',
    'infrastructure.discussionRooms', 'infrastructure.computers', 'infrastructure.timing.daysPerWeek'],
  ['collections.totalBooks.number', 'collections.journalsAndPeriodicals.print', 'collections.journalsAndPeriodicals.electronic', 'collections.journalsAndPeriodicals.national',
    'collections.journalsAndPeriodicals.international', 'collections.digitalResources.databases', 'collections.digitalResources.ebooks',
    'collections.digitalResources.institutionalRepository', 'collections.specialCollections.rareBooks', 'collections.specialCollections.theses',
    'collections.specialCollections.manuscripts', 'collections.annualAdditions.newTitlesPurchased', 'collections.annualAdditions.subscribed',
    'collections.contributionsByStudents', 'collections.donations.byAlumni', 'collections.donations.byStaff', 'collections.donations.byOthers'],
  [],
  ['staffing.supportStaffCount'],
  ['usage.footfall.daily', 'usage.footfall.annual', 'usage.circulation.booksIssued', 'usage.circulation.booksReturned', 'usage.digitalResourceUsage.totalDownloadsOrLogins'],
  [],
  ['financial.annualBudgetAllocation'],
];

function validateStep(f: any, step: number): Errors {
  const e: Errors = {};
  if (step === 0 && !String(f.academicYear || '').trim()) e.academicYear = 'Academic year is required.';
  for (const p of NUM_PATHS[step] || []) {
    const v = getPath(f, p);
    if (v === undefined || v === null || v === '' || !Number.isInteger(v) || v < 0) e[p] = 'Enter a whole number, 0 or more.';
  }
  if (step === 0) {
    const y = getPath(f, 'librarian.yearsOfService');
    if (Number.isInteger(y) && y > 60) e['librarian.yearsOfService'] = 'Maximum 60.';
  }
  if (step === 1) {
    const d = getPath(f, 'infrastructure.timing.daysPerWeek');
    if (Number.isInteger(d) && d > 7) e['infrastructure.timing.daysPerWeek'] = 'Days per week must be 0 to 7.';
    const a = getPath(f, 'infrastructure.timing.fromTime'); const b = getPath(f, 'infrastructure.timing.toTime');
    if (a && b && a >= b) e['infrastructure.timing.toTime'] = 'Closing time must be after opening time.';
  }
  if (step === 3) {
    const a = getPath(f, 'technology.digitalLiteracyPrograms.from'); const b = getPath(f, 'technology.digitalLiteracyPrograms.to');
    if (a && b && String(a).slice(0, 10) > String(b).slice(0, 10)) e['technology.digitalLiteracyPrograms.to'] = 'End date must be on or after the start date.';
  }
  if (step === 4) {
    (getPath(f, 'staffing.orientationPrograms.photoUploads') || []).forEach((u: string, i: number) => {
      if (u && !/^(https?:\/\/|\/)/i.test(u.trim())) e[`photo.${i}`] = 'Enter a link starting with http(s):// or /';
    });
    (getPath(f, 'staffing.plagiarismChecks') || []).forEach((c: any, i: number) => {
      if (!Number.isInteger(c.articlesOrThesesChecked) || c.articlesOrThesesChecked < 0) e[`plag.${i}`] = 'Whole number, 0 or more.';
    });
  }
  return e;
}

interface Props {
  record: LibraryRecord | null; saving: boolean;
  onSave: (payload: any, editingYear: string | null) => void; onCancel: () => void;
}

export default function LibraryWizard({ record, saving, onSave, onCancel }: Props) {
  const editingYear = record ? record.academicYear : null;
  const [form, setForm] = useState<LibraryForm>(() => (record ? (JSON.parse(JSON.stringify(record)) as LibraryForm) : emptyLibraryRecord()));
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(record ? STEPS.length - 1 : 0);
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);

  const set = (path: string, value: any) => { setDirty(true); setForm((p) => setPath(p, path, value)); };
  const val = (p: string) => getPath(form, p);
  const err = (p: string) => errors[p];
  const num = (label: string, p: string, extra: any = {}) => <NumField label={label} value={val(p)} onChange={(v) => set(p, v)} error={err(p)} {...extra} />;
  const txt = (label: string, p: string, extra: any = {}) => <TextField label={label} value={val(p)} onChange={(v) => set(p, v)} error={err(p)} {...extra} />;
  const date = (label: string, p: string) => <DateField label={label} value={val(p)} onChange={(v) => set(p, v)} error={err(p)} />;
  const yn = (label: string, p: string) => <YesNoField label={label} value={val(p)} onChange={(v) => set(p, v)} />;

  const goNext = () => {
    const e = validateStep(form, step);
    setErrors(e);
    if (Object.keys(e).length) { toast.error('Please fix the highlighted fields.'); return; }
    setStep(step + 1); setMaxStep((m) => Math.max(m, step + 1));
  };
  const cancel = () => { if (!dirty || window.confirm('Discard unsaved changes?')) onCancel(); };
  const save = () => {
    for (let s = 0; s < STEPS.length; s++) {
      const e = validateStep(form, s);
      if (Object.keys(e).length) { setErrors(e); setStep(s); setMaxStep((m) => Math.max(m, s)); toast.error(`Step ${s + 1} (${STEPS[s]}) needs attention.`); return; }
    }
    onSave(cleanPayload(form, DATE_KEYS), editingYear);
  };

  const arr = (p: string): any[] => val(p) || [];
  const setArr = (p: string, a: any[]) => set(p, a);

  const steps: Record<number, ReactElement> = {
    0: (
      <div className="wz-grid">
        <TextField label="Academic Year (e.g. 2025-2026)" value={form.academicYear} onChange={(v) => set('academicYear', v)} error={err('academicYear')} hint={editingYear ? 'The academic year identifies this record and cannot be changed.' : undefined} />
        {txt('0.9.1.1 Name of the Librarian', 'librarian.name')}
        {txt('0.9.1.2 Qualifications', 'librarian.qualifications')}
        {date('0.9.1.3 Joining date', 'librarian.joiningDate')}
        <SelectField label="0.9.1.4 Years of service" value={val('librarian.yearsOfService')} error={err('librarian.yearsOfService')}
          onChange={(v) => set('librarian.yearsOfService', v === '' ? undefined : Number(v))}
          options={Array.from({ length: 61 }, (_, i) => String(i))} />
      </div>
    ),
    1: (
      <div className="wz-grid">
        {num('0.9.2.1 Total floor area (sq. ft.)', 'infrastructure.totalFloorAreaSqFt', { hint: 'Digits only — no comma, space or decimal point.' })}
        {num('0.9.2.5 Discussion rooms', 'infrastructure.discussionRooms')}
        <Sub>0.9.2.2 Seating capacity</Sub>
        {num('Reading rooms', 'infrastructure.seatingCapacity.readingRooms')}
        {num('Study carrels', 'infrastructure.seatingCapacity.studyCarrels')}
        {num('Digital labs', 'infrastructure.seatingCapacity.digitalLabs')}
        {num('0.9.2.6 Computers in the library', 'infrastructure.computers')}
        <Sub>0.9.2.3 Accessibility features</Sub>
        {num('Ramps', 'infrastructure.accessibility.ramps')}
        {num('Lifts', 'infrastructure.accessibility.lifts')}
        {num('Wheelchairs', 'infrastructure.accessibility.wheelchairs')}
        <Sub>0.9.2.4 Safety measures</Sub>
        {num('Fire alarms', 'infrastructure.safetyMeasures.fireAlarms')}
        {num('CCTV', 'infrastructure.safetyMeasures.cctv')}
        {num('Emergency exits', 'infrastructure.safetyMeasures.emergencyExits')}
        <Sub>0.9.2.7 Timing</Sub>
        <SelectField label="Days per week" value={val('infrastructure.timing.daysPerWeek')} error={err('infrastructure.timing.daysPerWeek')}
          onChange={(v) => set('infrastructure.timing.daysPerWeek', v === '' ? undefined : Number(v))} options={['0', '1', '2', '3', '4', '5', '6', '7']} />
        <div />
        {txt('From', 'infrastructure.timing.fromTime', { type: 'time' })}
        {txt('To', 'infrastructure.timing.toTime', { type: 'time' })}
        {yn('Closed on Saturday', 'infrastructure.timing.closedOnSaturday')}
        {yn('Closed on Sunday', 'infrastructure.timing.closedOnSunday')}
      </div>
    ),
    2: (
      <div className="wz-grid">
        {txt('0.9.3.1 Total books — subject', 'collections.totalBooks.subject')}
        {num('0.9.3.1 Total books — number', 'collections.totalBooks.number')}
        <Sub>0.9.3.2 Journals and periodicals</Sub>
        {num('Print', 'collections.journalsAndPeriodicals.print')}
        {num('Electronic', 'collections.journalsAndPeriodicals.electronic')}
        {num('National', 'collections.journalsAndPeriodicals.national')}
        {num('International', 'collections.journalsAndPeriodicals.international')}
        <Sub>0.9.3.3 Digital resources</Sub>
        {num('Databases', 'collections.digitalResources.databases')}
        {num('E-books', 'collections.digitalResources.ebooks')}
        {num('Institutional repository', 'collections.digitalResources.institutionalRepository')}
        <div />
        <Sub>0.9.3.4 Special collections</Sub>
        {num('Rare books', 'collections.specialCollections.rareBooks')}
        {num('Theses', 'collections.specialCollections.theses')}
        {num('Manuscripts', 'collections.specialCollections.manuscripts')}
        <div />
        <Sub>0.9.3.5 Annual additions</Sub>
        {num('New titles purchased', 'collections.annualAdditions.newTitlesPurchased')}
        {num('Subscribed', 'collections.annualAdditions.subscribed')}
        <Sub>0.9.3.6 – 0.9.3.9 Contributions and donations</Sub>
        {num('0.9.3.6 Contributions by students (projects/research)', 'collections.contributionsByStudents')}
        {num('0.9.3.7 Books donated by alumni', 'collections.donations.byAlumni')}
        {num('0.9.3.8 Books donated by staff', 'collections.donations.byStaff')}
        {num('0.9.3.9 Books donated by others', 'collections.donations.byOthers')}
      </div>
    ),
    3: (
      <div className="wz-grid">
        {txt('0.9.4.1 Library management software (e.g. Koha, Libsys)', 'technology.libraryManagementSoftware')}
        {txt('0.9.4.4 Remote access facilities (VPN, proxy, federated login)', 'technology.remoteAccessFacilities')}
        {yn('0.9.4.2 OPAC availability (Online Public Access Catalogue)', 'technology.opacAvailable')}
        {yn('0.9.4.3 Institutional repository access', 'technology.institutionalRepositoryAccess')}
        <Sub>0.9.4.5 Digital literacy programs for users</Sub>
        {date('From', 'technology.digitalLiteracyPrograms.from')}
        {date('To', 'technology.digitalLiteracyPrograms.to')}
      </div>
    ),
    4: (
      <div className="wz-grid">
        {num('0.9.5.1 Number of support staff', 'staffing.supportStaffCount')}
        {txt('0.9.5.2 Qualifications and training of staff', 'staffing.qualificationsAndTraining')}
        <Note>Staff number and qualifications are entered manually for now. Linking them to the non-teaching staff details is a planned future integration.</Note>
        {txt('0.9.5.3 User services (reference desk, research assistance, interlibrary loan)', 'staffing.userServices', { full: true })}
        <Sub>0.9.5.4 Orientation programs for new students</Sub>
        {date('Date', 'staffing.orientationPrograms.date')}
        <div />
        <Note>Photo proof is stored as links. File upload is not available for this module yet.</Note>
        {arr('staffing.orientationPrograms.photoUploads').map((u: string, i: number) => (
          <div key={i} className="wz-full" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <TextField label={`Photo link ${i + 1}`} value={u} error={err(`photo.${i}`)}
                onChange={(v) => setArr('staffing.orientationPrograms.photoUploads', arr('staffing.orientationPrograms.photoUploads').map((x, j) => (j === i ? v : x)))} />
            </div>
            <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: 24 }} aria-label="Remove photo link"
              onClick={() => setArr('staffing.orientationPrograms.photoUploads', arr('staffing.orientationPrograms.photoUploads').filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="wz-full"><button type="button" className="btn btn-outline btn-sm" onClick={() => setArr('staffing.orientationPrograms.photoUploads', [...arr('staffing.orientationPrograms.photoUploads'), ''])}><Plus size={14} /> Add photo link</button></div>

        <Sub>0.9.5.5 Workshops / seminars (citation, plagiarism, research tools)</Sub>
        {arr('staffing.workshopsAndSeminars').map((w: any, i: number) => {
          const upd = (k: string, v: any) => setArr('staffing.workshopsAndSeminars', arr('staffing.workshopsAndSeminars').map((x, j) => (j === i ? { ...x, [k]: v } : x)));
          return (
            <div className="wz-repeat" key={i}>
              <TextField label="Title" value={w.title} onChange={(v) => upd('title', v)} />
              <DateField label="Date" value={w.date} onChange={(v) => upd('date', v)} />
              <TextField label="Topic" value={w.topic} onChange={(v) => upd('topic', v)} />
              <div><button type="button" className="btn btn-outline btn-sm" onClick={() => setArr('staffing.workshopsAndSeminars', arr('staffing.workshopsAndSeminars').filter((_, j) => j !== i))}><Trash2 size={14} /> Remove</button></div>
            </div>
          );
        })}
        <div className="wz-full"><button type="button" className="btn btn-outline btn-sm" onClick={() => setArr('staffing.workshopsAndSeminars', [...arr('staffing.workshopsAndSeminars'), { title: '', date: '', topic: '' }])}><Plus size={14} /> Add workshop / seminar</button></div>

        <Sub>0.9.5.6 Plagiarism checks (Turnitin, Urkund)</Sub>
        {arr('staffing.plagiarismChecks').map((c: any, i: number) => {
          const upd = (k: string, v: any) => setArr('staffing.plagiarismChecks', arr('staffing.plagiarismChecks').map((x, j) => (j === i ? { ...x, [k]: v } : x)));
          return (
            <div className="wz-repeat" key={i}>
              <DateField label="Date" value={c.date} onChange={(v) => upd('date', v)} />
              <NumField label="Articles / PhD theses checked" value={c.articlesOrThesesChecked} error={err(`plag.${i}`)} onChange={(v) => upd('articlesOrThesesChecked', v)} />
              <SelectField label="Scope" value={c.scope} onChange={(v) => upd('scope', v)} options={[{ value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' }]} />
              <div><button type="button" className="btn btn-outline btn-sm" onClick={() => setArr('staffing.plagiarismChecks', arr('staffing.plagiarismChecks').filter((_, j) => j !== i))}><Trash2 size={14} /> Remove</button></div>
            </div>
          );
        })}
        <div className="wz-full"><button type="button" className="btn btn-outline btn-sm" onClick={() => setArr('staffing.plagiarismChecks', [...arr('staffing.plagiarismChecks'), { date: '', articlesOrThesesChecked: 0, scope: '' }])}><Plus size={14} /> Add plagiarism check</button></div>
      </div>
    ),
    5: (
      <div className="wz-grid">
        <Sub>0.9.6.1 Footfall statistics</Sub>
        {num('Daily users', 'usage.footfall.daily')}
        {num('Annual users', 'usage.footfall.annual')}
        <Sub>0.9.6.2 Circulation data</Sub>
        {num('Books issued', 'usage.circulation.booksIssued')}
        {num('Books returned', 'usage.circulation.booksReturned')}
        <SelectField label="Source" value={val('usage.circulation.source')} onChange={(v) => set('usage.circulation.source', v || 'manual')} options={[{ value: 'manual', label: 'Manual entry' }, { value: 'auto', label: 'Automatic (library system)' }]} />
        <Note>Automatic update from the library system is a planned future integration; circulation is entered manually for now.</Note>
        <Sub>0.9.6.3 Digital resource usage (downloads, logins)</Sub>
        {date('Date', 'usage.digitalResourceUsage.date')}
        {num('Total number', 'usage.digitalResourceUsage.totalDownloadsOrLogins')}
        <TextAreaField label="0.9.6.4 Feedback mechanisms (feedback form + suggestion)" value={val('usage.feedbackMechanisms')} onChange={(v) => set('usage.feedbackMechanisms', v)} rows={2} />
      </div>
    ),
    6: (
      <div className="wz-grid">
        {yn('0.9.7.1 Copyright compliance (digital resource sharing)', 'compliance.copyrightCompliance')}
        {yn('0.9.7.2 Data privacy (user records confidentiality)', 'compliance.dataPrivacyCompliance')}
        <Sub>0.9.7.3 Disaster preparedness</Sub>
        {txt('Fire safety', 'compliance.disasterPreparedness.fireSafety')}
        {yn('Digital backups', 'compliance.disasterPreparedness.digitalBackup')}
        <Sub>0.9.7.4 Preservation measures available</Sub>
        <div className="wz-checks">
          {PRESERVATION.map((p) => {
            const cur: string[] = val('compliance.preservationMeasures') || [];
            return (
              <label key={p.value} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={cur.includes(p.value)} onChange={(e) => set('compliance.preservationMeasures', e.target.checked ? [...cur, p.value] : cur.filter((x) => x !== p.value))} />
                {p.label}
              </label>
            );
          })}
        </div>
      </div>
    ),
    7: (
      <>
        <div className="wz-grid">
          <Sub>0.9.8 Financial status</Sub>
          {num('0.9.8.1 Budget allocation (annual expenditure on library)', 'financial.annualBudgetAllocation')}
          {txt('0.9.8.2 Subscriptions / memberships (e.g. INFLIBNET, DELNET)', 'financial.subscriptionsAndMemberships')}
          <Sub>0.9.9 Best practices</Sub>
          {txt('0.9.9.1 Best practices (green library, open access promotion, others)', 'bestPractices.practices')}
          {txt('0.9.9.2 Innovations (mobile apps, AI-based search tools, others)', 'bestPractices.innovations')}
          <TextAreaField label="Details" value={val('bestPractices.details')} onChange={(v) => set('bestPractices.details', v)} />
        </div>
        <div className="wz-review" style={{ marginTop: 14 }}>
          <div className="wz-sub" style={{ margin: '0 0 6px' }}>Review — {form.academicYear || 'no academic year'}</div>
          <RecordFields data={cleanPayload(form, DATE_KEYS, ['uploads'])} />
        </div>
      </>
    ),
  };

  return (
    <WizardShell
      title={editingYear ? `Edit Library Record — ${editingYear}` : 'Add Library Record'}
      subtitle={`Step ${step + 1} of ${STEPS.length}`}
      steps={STEPS} step={step} maxStep={maxStep}
      onStep={(i) => setStep(i)} onNext={goNext} onBack={() => setStep(Math.max(0, step - 1))}
      onCancel={cancel} onSave={save} saving={saving} editing={!!editingYear} stepTitle={STEP_TITLES[step]}
    >
      {steps[step]}
    </WizardShell>
  );
}
