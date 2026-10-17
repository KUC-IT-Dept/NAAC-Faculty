/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/institutional/MMTTCWizard.tsx
//
// Full-page wizard for creating/editing an MMTTC record (sections 0.11.1,
// .2, .3, .5 of "MMTTC details.odt"). Replaces the former modal form.
// Courses (0.11.4) stay in their own repeatable sub-resource UI on the
// MMTTC page and are NEVER part of this payload, so saving a record cannot
// overwrite course changes made through the courses endpoints.
import { useState, type ReactElement } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MMTTCRecord } from '../../lib/institutionalApi';
import { getPath, setPath } from './formUtils';
import RecordFields from './RecordViewer';
import { Errors, WizardShell, TextField, NumField, DateField, SelectField, YesNoField, TextAreaField, Sub, Note, cleanPayload } from './wizardKit';

type MMTTCForm = Partial<MMTTCRecord> & { academicYear: string };

function emptyMMTTCRecord(academicYear = ''): MMTTCForm {
  return {
    academicYear,
    centre: {
      name: '', affiliationDetails: '', parentInstitution: '',
      recognitionStatus: { status: false }, accreditationStatus: { status: false }, accreditationNumber: '',
    },
    director: { name: '', academicQualification: '' },
    infrastructure: {
      numberOfClassrooms: 0, totalSeatingCapacity: 0, numberOfLabs: 0,
      library: { numberOfBooks: 0, spaceSqFt: 0 },
      digitalResourcesDetails: '', equipment: [], numberOfSupportingStaff: 0,
      roomsAvailableToStay: 0, stayCapacity: 0, annualBudgetAllocation: 0,
    },
    courses: [],
    impact: { collaborations: '', communityOutreach: '' },
  } as MMTTCForm;
}

const STEPS = ['Centre Details', 'Director', 'Infrastructure', 'Impact & Outreach', 'Review'];
const STEP_TITLES = ['0.11.1 General', '0.11.2 Details of the Director', '0.11.3 Infrastructure', '0.11.5 Impact and Outreach', 'Review before saving'];
const DATE_KEYS = ['date', 'dateOfJoining'];
const QUALIFICATIONS = ['PhD', 'Professor', 'Associate Professor', 'Assistant Professor', 'M.Tech'];
const INFRA_NUMS = ['infrastructure.numberOfClassrooms', 'infrastructure.totalSeatingCapacity', 'infrastructure.numberOfLabs', 'infrastructure.library.numberOfBooks',
  'infrastructure.library.spaceSqFt', 'infrastructure.numberOfSupportingStaff', 'infrastructure.roomsAvailableToStay', 'infrastructure.stayCapacity', 'infrastructure.annualBudgetAllocation'];

function validateStep(f: any, step: number): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (!String(f.academicYear || '').trim()) e.academicYear = 'Academic year is required.';
    const y = getPath(f, 'centre.yearOfEstablishment');
    if (y !== undefined && y !== null && y !== '' && (!Number.isInteger(y) || y < 1800 || y > new Date().getFullYear())) e['centre.yearOfEstablishment'] = `Enter a year between 1800 and ${new Date().getFullYear()}.`;
  }
  if (step === 2) {
    for (const p of INFRA_NUMS) {
      const v = getPath(f, p);
      if (v === undefined || v === null || !Number.isInteger(v) || v < 0) e[p] = 'Enter a whole number, 0 or more.';
    }
    (getPath(f, 'infrastructure.equipment') || []).forEach((q: any, i: number) => {
      if (!Number.isInteger(q.count) || q.count < 0) e[`equip.${i}`] = 'Whole number, 0 or more.';
    });
  }
  return e;
}

interface Props {
  record: MMTTCRecord | null; saving: boolean;
  onSave: (payload: any, editingYear: string | null) => void; onCancel: () => void;
}

export default function MMTTCWizard({ record, saving, onSave, onCancel }: Props) {
  const editingYear = record ? record.academicYear : null;
  const [form, setForm] = useState<MMTTCForm>(() => (record ? (JSON.parse(JSON.stringify(record)) as MMTTCForm) : emptyMMTTCRecord()));
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
    onSave(cleanPayload(form, DATE_KEYS, ['courses']), editingYear);
  };

  const equipment: any[] = val('infrastructure.equipment') || [];
  const setEquipment = (a: any[]) => set('infrastructure.equipment', a);

  const steps: Record<number, ReactElement> = {
    0: (
      <div className="wz-grid">
        <TextField label="Academic Year (e.g. 2025-2026)" value={form.academicYear} onChange={(v) => set('academicYear', v)} error={err('academicYear')} hint={editingYear ? 'The academic year identifies this record and cannot be changed.' : undefined} />
        {txt('Name of the centre', 'centre.name')}
        {txt('Affiliation details', 'centre.affiliationDetails')}
        {txt('Parent institution', 'centre.parentInstitution')}
        {num('Year of establishment', 'centre.yearOfEstablishment')}
        {txt('Accreditation number', 'centre.accreditationNumber')}
        <Sub>Recognition status</Sub>
        {yn('Recognised', 'centre.recognitionStatus.status')}
        {date('Recognition date', 'centre.recognitionStatus.date')}
        <Sub>Accreditation status</Sub>
        {yn('Accredited', 'centre.accreditationStatus.status')}
        {date('Accreditation date', 'centre.accreditationStatus.date')}
      </div>
    ),
    1: (
      <div className="wz-grid">
        {txt('Name', 'director.name')}
        <SelectField label="Academic qualification" value={val('director.academicQualification')} onChange={(v) => set('director.academicQualification', v)} options={QUALIFICATIONS} />
        {date('Date of joining', 'director.dateOfJoining')}
      </div>
    ),
    2: (
      <div className="wz-grid">
        {num('Number of classrooms', 'infrastructure.numberOfClassrooms')}
        {num('Total seating capacity', 'infrastructure.totalSeatingCapacity')}
        {num('Number of labs', 'infrastructure.numberOfLabs')}
        {num('Number of supporting staff', 'infrastructure.numberOfSupportingStaff')}
        <Sub>Library</Sub>
        {num('Number of books', 'infrastructure.library.numberOfBooks')}
        {num('Space (sq. ft.)', 'infrastructure.library.spaceSqFt')}
        <TextAreaField label="Digital resources" value={val('infrastructure.digitalResourcesDetails')} onChange={(v) => set('infrastructure.digitalResourcesDetails', v)} rows={2} />
        <Sub>Equipment (e.g. projector)</Sub>
        {equipment.map((q, i) => (
          <div className="wz-repeat" key={i} style={{ gridTemplateColumns: '2fr 1fr auto' }}>
            <TextField label="Equipment" value={q.name} onChange={(v) => setEquipment(equipment.map((x, j) => (j === i ? { ...x, name: v } : x)))} />
            <NumField label="Number" value={q.count} error={err(`equip.${i}`)} onChange={(v) => setEquipment(equipment.map((x, j) => (j === i ? { ...x, count: v } : x)))} />
            <button type="button" className="btn btn-outline btn-sm" aria-label="Remove equipment" onClick={() => setEquipment(equipment.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          </div>
        ))}
        <div className="wz-full"><button type="button" className="btn btn-outline btn-sm" onClick={() => setEquipment([...equipment, { name: '', count: 0 }])}><Plus size={14} /> Add equipment</button></div>
        <Sub>Accommodation and budget</Sub>
        {num('Rooms available to stay', 'infrastructure.roomsAvailableToStay')}
        {num('Stay capacity', 'infrastructure.stayCapacity')}
        {num('Annual budget allocation (Rs.)', 'infrastructure.annualBudgetAllocation')}
      </div>
    ),
    3: (
      <div className="wz-grid">
        <TextAreaField label="Collaborations with universities / institutions" value={val('impact.collaborations')} onChange={(v) => set('impact.collaborations', v)} rows={4} />
        <TextAreaField label="Community outreach / extension activities" value={val('impact.communityOutreach')} onChange={(v) => set('impact.communityOutreach', v)} rows={4} />
      </div>
    ),
    4: (
      <div className="wz-review">
        <Note>Course details (0.11.4) are managed separately: after saving, use “Courses” on the record to add, edit or remove any number of courses. They are not changed by this form.</Note>
        <div className="wz-sub" style={{ margin: '0 0 6px' }}>{form.academicYear || 'No academic year'}</div>
        <RecordFields data={cleanPayload(form, DATE_KEYS, ['courses', 'academicYear'])} />
      </div>
    ),
  };

  return (
    <WizardShell
      title={editingYear ? `Edit MMTTC Record — ${editingYear}` : 'Add MMTTC Record'}
      subtitle={`Step ${step + 1} of ${STEPS.length}`}
      steps={STEPS} step={step} maxStep={maxStep}
      onStep={(i) => setStep(i)} onNext={goNext} onBack={() => setStep(Math.max(0, step - 1))}
      onCancel={cancel} onSave={save} saving={saving} editing={!!editingYear} stepTitle={STEP_TITLES[step]}
    >
      {steps[step]}
    </WizardShell>
  );
}
