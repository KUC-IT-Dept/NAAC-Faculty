import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel, ta } from './sectionUtils';

const EMPTY = { name: '', awardingAgency: '', dateOfAward: '', level: '', description: '' };

export default function Awards({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((a, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-2">
            {fg('Award / Fellowship / Honour Name *', inp(a.name, v => upd(i, 'name', v)))}
            {fg('Awarding Body / Agency *', inp(a.awardingAgency, v => upd(i, 'awardingAgency', v)))}
          </div>
          <div className="form-row form-row-2">
            {fg('Date / Year of Award', inp(a.dateOfAward, v => upd(i, 'dateOfAward', v), 'DD/MM/YYYY or 2023'))}
            {fg('Level', sel(a.level, v => upd(i, 'level', v), ['International', 'National', 'State', 'University', 'Institution']))}
          </div>
          {fg('Brief Description (optional)', ta(a.description, v => upd(i, 'description', v), 'Details about the award...'))}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Award / Honour
      </button>
    </div>
  );
}
