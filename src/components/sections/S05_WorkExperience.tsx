import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { organization: '', designation: '', from: '', to: '', nature: '', reasonForLeaving: '' };

export default function WorkExperience({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-2">
            {fg('Organization / Institution *', inp(e.organization, v => upd(i, 'organization', v)))}
            {fg('Designation / Post *', inp(e.designation, v => upd(i, 'designation', v)))}
          </div>
          <div className="form-row form-row-3">
            {fg('From (Month & Year)', inp(e.from, v => upd(i, 'from', v), 'Aug 2015'))}
            {fg('To (Month & Year)', inp(e.to, v => upd(i, 'to', v), 'Jun 2020 / Present'))}
            {fg('Nature of Work', sel(e.nature, v => upd(i, 'nature', v), ['Teaching', 'Research', 'Industry / Corporate', 'Administrative', 'Other']))}
          </div>
          {fg('Reason for Leaving', inp(e.reasonForLeaving, v => upd(i, 'reasonForLeaving', v)))}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Work Experience
      </button>
    </div>
  );
}
