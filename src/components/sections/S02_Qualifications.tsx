import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, dateInp, Sub } from './sectionUtils';

const EMPTY = { degreeLevel: '', degreeName: '', specialization: '', institution: '', university: '', yearOfPassing: '', percentageCGPA: '', division: '', mode: '' };

export default function Qualifications({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((q, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-3">
            {fg('Degree Level *', sel(q.degreeLevel, v => upd(i, 'degreeLevel', v), ['10th', '12th', 'Diploma', 'UG', 'PG', 'M.Phil', 'Ph.D', 'Post-Doc', 'Other']))}
            {fg('Degree / Certificate Name', inp(q.degreeName, v => upd(i, 'degreeName', v), 'B.Sc / M.Tech / Ph.D'))}
            {fg('Specialization / Subject', inp(q.specialization, v => upd(i, 'specialization', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('College / Institution', inp(q.institution, v => upd(i, 'institution', v)))}
            {fg('University / Board', inp(q.university, v => upd(i, 'university', v)))}
          </div>
          <div className="form-row form-row-4">
            {fg('Year of Passing', inp(q.yearOfPassing, v => upd(i, 'yearOfPassing', v), '2015'))}
            {fg('% / CGPA / Grade', inp(q.percentageCGPA, v => upd(i, 'percentageCGPA', v), '85% / 8.5'))}
            {fg('Division / Class', sel(q.division, v => upd(i, 'division', v), ['Distinction', 'First', 'Second', 'Third', 'Pass']))}
            {fg('Mode', sel(q.mode, v => upd(i, 'mode', v), ['Regular', 'Distance', 'Part-Time', 'Correspondence']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Qualification
      </button>
    </div>
  );
}
