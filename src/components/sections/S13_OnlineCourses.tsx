import { Plus, Trash2 } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { courseName: '', platform: '', duration: '', completionYear: '', certificateId: '', certificateUrl: '' };

export default function OnlineCourses({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };
  return (
    <div>
      {data.map((c, i) => (
        <div key={i} className="list-item-card">
          <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
          {fg('Course / Certification Name *', inp(c.courseName, v => upd(i, 'courseName', v), 'Machine Learning Specialization'))}
          <div className="form-row form-row-3">
            {fg('Platform / Provider *', sel(c.platform, v => upd(i, 'platform', v), ['NPTEL', 'Swayam', 'Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other']))}
            {fg('Duration', inp(c.duration, v => upd(i, 'duration', v), '8 weeks / 40 hours'))}
            {fg('Year of Completion', inp(c.completionYear, v => upd(i, 'completionYear', v), '2023'))}
          </div>
          <div className="form-row form-row-2">
            {fg('Certificate ID / Number', inp(c.certificateId, v => upd(i, 'certificateId', v)))}
            {fg('Certificate URL / Verification Link', inp(c.certificateUrl, v => upd(i, 'certificateUrl', v), 'https://verify.example.com/...'))}
          </div>
        </div>
      ))}
      <button type="button" className="add-item-btn" onClick={() => onChange([...data, { ...EMPTY }])}>
        <Plus size={15} /> Add Online Course / Certification
      </button>
    </div>
  );
}
