import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, ta, Sub } from './sectionUtils';

const EMPTY_SCHOLAR = { scholarName: '', gender: '', degree: '', topic: '', enrollmentYear: '', expectedCompletion: '', status: '', university: '' };
const EMPTY_PATENT = { title: '', patentNumber: '', dateOfFiling: '', status: '' };

export default function ResearchSupervision({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const s = (k: string, v: any) => onChange({ ...data, [k]: v });
  const updS = (i: number, k: string, v: string) => { const a = [...(data.scholars || [])]; a[i] = { ...a[i], [k]: v }; s('scholars', a); };
  const updP = (i: number, k: string, v: string) => { const a = [...(data.patents || [])]; a[i] = { ...a[i], [k]: v }; s('patents', a); };
  const scholars = data.scholars || [];
  const patents = data.patents || [];

  return (
    <div>
      <Sub>Guidance Summary</Sub>
      <div className="form-row form-row-3" style={{ marginBottom: 8 }}>
        {fg('Ph.D — Awarded', inp(data.phdCompleted, v => s('phdCompleted', v), '0'))}
        {fg('Ph.D — Ongoing', inp(data.phdInProgress, v => s('phdInProgress', v), '0'))}
        {fg('M.Phil — Awarded', inp(data.mphilCompleted, v => s('mphilCompleted', v), '0'))}
        {fg('M.Phil — Ongoing', inp(data.mphilInProgress, v => s('mphilInProgress', v), '0'))}
        {fg('PG Dissertations Guided', inp(data.pgProjectsSupervised, v => s('pgProjectsSupervised', v), '0'))}
      </div>

      <Sub>Scholar Details</Sub>
      {scholars.map((sc: any, i: number) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => s('scholars', scholars.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-3">
            {fg("Scholar's Name", inp(sc.scholarName, v => updS(i, 'scholarName', v)))}
            {fg('Gender', sel(sc.gender, v => updS(i, 'gender', v), ['Male', 'Female', 'Other']))}
            {fg('Degree', sel(sc.degree, v => updS(i, 'degree', v), ['Ph.D', 'M.Phil']))}
          </div>
          {fg('Research Topic / Thesis Title', ta(sc.topic, v => updS(i, 'topic', v), 'Research area or thesis title'))}
          <div className="form-row form-row-4">
            {fg('Enrolment Year', inp(sc.enrollmentYear, v => updS(i, 'enrollmentYear', v), '2020'))}
            {fg('Expected Completion', inp(sc.expectedCompletion, v => updS(i, 'expectedCompletion', v), '2024'))}
            {fg('Status', sel(sc.status, v => updS(i, 'status', v), ['Registered', 'Submitted', 'Awarded', 'Discontinued']))}
            {fg('University', inp(sc.university, v => updS(i, 'university', v)))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" style={{ marginBottom: 24 }} onClick={() => s('scholars', [...scholars, { ...EMPTY_SCHOLAR }])}>
        <Plus size={15} /> Add Scholar
      </button>

      <Sub>Patents</Sub>
      {patents.map((p: any, i: number) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => s('patents', patents.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></button>
          {fg('Patent Title', inp(p.title, v => updP(i, 'title', v)))}
          <div className="form-row form-row-3">
            {fg('Application / Patent No.', inp(p.patentNumber, v => updP(i, 'patentNumber', v), 'IN202021012345'))}
            {fg('Date of Filing', inp(p.dateOfFiling, v => updP(i, 'dateOfFiling', v), 'DD/MM/YYYY'))}
            {fg('Status', sel(p.status, v => updP(i, 'status', v), ['Filed', 'Published', 'Granted', 'Abandoned']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => s('patents', [...patents, { ...EMPTY_PATENT }])}>
        <Plus size={15} /> Add Patent
      </button>
    </div>
  );
}
