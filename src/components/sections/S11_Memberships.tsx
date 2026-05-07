import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { professionalBody: '', membershipType: '', membershipId: '', yearOfJoining: '' };

export default function Memberships({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((m, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          <div className="form-row form-row-2">
            {fg('Professional Body / Society *', inp(m.professionalBody, v => upd(i, 'professionalBody', v), 'IEEE / CSI / ISTE / IMA'))}
            {fg('Membership Type', sel(m.membershipType, v => upd(i, 'membershipType', v), ['Life Member', 'Annual Member', 'Fellow', 'Senior Member', 'Associate Member']))}
          </div>
          <div className="form-row form-row-2">
            {fg('Membership ID / Number', inp(m.membershipId, v => upd(i, 'membershipId', v)))}
            {fg('Year of Joining', inp(m.yearOfJoining, v => upd(i, 'yearOfJoining', v), '2018'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Membership
      </button>
    </div>
  );
}
