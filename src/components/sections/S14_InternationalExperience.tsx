import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { country: '', purpose: '', institution: '', duration: '', year: '', fundingSource: '' };

export default function InternationalExperience({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-2">
            {fg('Country *', inp(e.country, v => upd(i, 'country', v)))}
            {fg('Purpose *', sel(e.purpose, v => upd(i, 'purpose', v), ['Research Visit', 'Post-Doctoral', 'Teaching', 'Conference', 'Collaborative Project', 'Industrial Visit', 'Other']))}
          </div>
          {fg('Institution / University / Organization', inp(e.institution, v => upd(i, 'institution', v)))}
          <div className="form-row form-row-3">
            {fg('Duration', inp(e.duration, v => upd(i, 'duration', v), '3 months / 1 week'))}
            {fg('Year', inp(e.year, v => upd(i, 'year', v), '2022'))}
            {fg('Funding Source', inp(e.fundingSource, v => upd(i, 'fundingSource', v), 'DST / DAAD / Self'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add International Experience
      </button>
    </div>
  );
}
