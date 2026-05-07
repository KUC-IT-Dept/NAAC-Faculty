import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { examName: '', subject: '', year: '', certificateNo: '', score: '', state: '', validity: '' };

export default function EligibilityTests({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-3">
            {fg('Exam Name *', sel(e.examName, v => upd(i, 'examName', v), ['UGC-NET', 'UGC-JRF', 'SET / SLET', 'GATE', 'CSIR-NET', 'CSIR-JRF', 'Other']))}
            {fg('Subject / Paper', inp(e.subject, v => upd(i, 'subject', v), 'Computer Science & Applications'))}
            {fg('Year of Qualification', inp(e.year, v => upd(i, 'year', v), '2020'))}
          </div>
          <div className="form-row form-row-4">
            {fg('Certificate / Roll No.', inp(e.certificateNo, v => upd(i, 'certificateNo', v)))}
            {fg('Score / Percentile', inp(e.score, v => upd(i, 'score', v)))}
            {fg('State (for SET/SLET)', inp(e.state, v => upd(i, 'state', v)))}
            {fg('Validity', inp(e.validity, v => upd(i, 'validity', v), 'Lifetime / 2026'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Test
      </button>
    </div>
  );
}
