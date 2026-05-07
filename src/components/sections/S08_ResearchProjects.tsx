import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { title: '', fundingAgency: '', amountSanctioned: '', duration: '', status: '', role: '' };

export default function ResearchProjects({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((p, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          {fg('Project Title *', inp(p.title, v => upd(i, 'title', v)))}
          <div className="form-row form-row-2">
            {fg('Funding Agency *', inp(p.fundingAgency, v => upd(i, 'fundingAgency', v), 'DST-SERB / ICMR / AICTE / UGC'))}
            {fg('Amount Sanctioned (₹)', inp(p.amountSanctioned, v => upd(i, 'amountSanctioned', v), '5,00,000'))}
          </div>
          <div className="form-row form-row-3">
            {fg('Duration', inp(p.duration, v => upd(i, 'duration', v), '3 years (2021–2024)'))}
            {fg('Status', sel(p.status, v => upd(i, 'status', v), ['Ongoing', 'Completed']))}
            {fg('Your Role', sel(p.role, v => upd(i, 'role', v), ['Principal Investigator (PI)', 'Co-Principal Investigator (Co-PI)', 'Co-Investigator']))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Research Project
      </button>
    </div>
  );
}
