import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { programTitle: '', type: '', duration: '', year: '', organizingInstitution: '', sponsoredBy: '', role: '' };

export default function FdpWorkshops({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((f, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          {fg('Programme Title *', inp(f.programTitle, v => upd(i, 'programTitle', v)))}
          <div className="form-row form-row-3">
            {fg('Type *', sel(f.type, v => upd(i, 'type', v), ['FDP', 'Workshop', 'Seminar', 'STTP', 'Conference', 'Webinar', 'Symposium', 'Other']))}
            {fg('Duration', inp(f.duration, v => upd(i, 'duration', v), '5 days / 2 weeks'))}
            {fg('Year', inp(f.year, v => upd(i, 'year', v), '2023'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Organizing Institution', inp(f.organizingInstitution, v => upd(i, 'organizingInstitution', v)))}
            {fg('Sponsored / Funded By', inp(f.sponsoredBy, v => upd(i, 'sponsoredBy', v), 'AICTE / UGC / TEQIP / Self'))}
          </div>
          {fg('Your Role', sel(f.role, v => upd(i, 'role', v), ['Attended / Participated', 'Resource Person', 'Organizer', 'Coordinator', 'Invited Speaker']))}
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Training / FDP / Workshop
      </button>
    </div>
  );
}
