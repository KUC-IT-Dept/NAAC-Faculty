import { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { fg, inp, sel, ta, FileInp, pv } from './sectionUtils';

const EMPTY = { title: '', fundingAgency: '', amountSanctioned: '', duration: '', status: '', role: '', description: '', documentUrl: '' };

const FUNDING_AGENCIES = ['DST-SERB', 'ICMR', 'AICTE', 'UGC', 'CSIR', 'DBT', 'IYSC', 'IIT'];
const STATUSES = ['Ongoing', 'Completed', 'Submitted', 'Rejected'];
const ROLES = ['Principal Investigator (PI)', 'Co-Principal Investigator (Co-PI)', 'Co-Investigator'];

export default function ResearchProjects({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);

  const upd = (i: number, k: string, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    onChange(a);
  };

  const isItemComplete = (item: any) => item.title && item.fundingAgency;

  const handleAddProject = () => {
    setPendingNewItem({ ...EMPTY });
  };

  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      const updated = [item, ...data];
      updated.sort((a, b) => {
        const getYear = (d: any) => {
          if (!d.duration) return 0;
          const match = d.duration.match(/\d{4}/g);
          if (!match) return 0;
          return parseInt(match[match.length - 1], 10);
        };
        return getYear(b) - getYear(a);
      });
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const getYear = (d: any) => {
      if (!d.duration) return 0;
      const match = d.duration.match(/\d{4}/g);
      if (!match) return 0;
      return parseInt(match[match.length - 1], 10);
    };
    return getYear(b) - getYear(a);
  });

  return (
    <>
      <div className="section-header-actions" style={{ marginBottom: 16 }}>
        <h5 style={{ margin: 0 }}>Research Projects</h5>
        <button
          type="button"
          onClick={handleAddProject}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          <Plus size={14} /> Add Project
        </button>
      </div>

      {sortedData.length === 0 && (
        <div className="empty-state">No research projects added yet. Click Add Project to get started.</div>
      )}

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={() => handleSavePending(pendingNewItem)} 
                disabled={!isItemComplete(pendingNewItem)}
                style={{ padding: '6px 12px', marginRight: '8px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Save
              </button>
              <button 
                type="button" 
                onClick={() => setPendingNewItem(null)}
                style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
              >
                Cancel
              </button>
            </div>
            <div className="form-row form-row-1">
              {fg('Project Title *', inp(pendingNewItem.title, v => setPendingNewItem({ ...pendingNewItem, title: v }), 'AI in Healthcare...'))}
            </div>
            <div className="form-row form-row-2">
              {fg('Funding Agency *', sel(pendingNewItem.fundingAgency, v => setPendingNewItem({ ...pendingNewItem, fundingAgency: v }), FUNDING_AGENCIES))}
              {fg('Amount Sanctioned (₹)', inp(pendingNewItem.amountSanctioned, v => setPendingNewItem({ ...pendingNewItem, amountSanctioned: v }), '5,00,000'))}
            </div>
            <div className="form-row form-row-2">
              {fg('Duration', inp(pendingNewItem.duration, v => setPendingNewItem({ ...pendingNewItem, duration: v }), '3 years or 2021-2024'))}
              {fg('Status', sel(pendingNewItem.status, v => setPendingNewItem({ ...pendingNewItem, status: v }), STATUSES))}
            </div>
            <div className="form-row form-row-2">
              {fg('Your Role', sel(pendingNewItem.role, v => setPendingNewItem({ ...pendingNewItem, role: v }), ROLES))}
              {fg('Sanction Letter / Document', <FileInp v={pendingNewItem.documentUrl} fn={v => setPendingNewItem({ ...pendingNewItem, documentUrl: v })} />)}
            </div>
            <div className="form-row form-row-1">
              {fg('Project Description (optional)', ta(pendingNewItem.description, v => setPendingNewItem({ ...pendingNewItem, description: v }), 'Brief description...'))}
            </div>
          </div>
        )}

        {sortedData.map((p, i) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditingItemIndex(null)}
                      style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Save
                    </button>
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Project Title *', inp(p.title, v => upd(i, 'title', v), 'AI in Healthcare...'))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Funding Agency *', sel(p.fundingAgency, v => upd(i, 'fundingAgency', v), FUNDING_AGENCIES))}
                    {fg('Amount Sanctioned (₹)', inp(p.amountSanctioned, v => upd(i, 'amountSanctioned', v), '5,00,000'))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Duration', inp(p.duration, v => upd(i, 'duration', v), '3 years or 2021-2024'))}
                    {fg('Status', sel(p.status, v => upd(i, 'status', v), STATUSES))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Your Role', sel(p.role, v => upd(i, 'role', v), ROLES))}
                    {fg('Sanction Letter / Document', <FileInp v={p.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Project Description (optional)', ta(p.description, v => upd(i, 'description', v), 'Brief description...'))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                    <button 
                      type="button" 
                      onClick={() => setEditingItemIndex(i)}
                      style={{ padding: '6px 12px', fontSize: '14px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="list-item-remove" 
                      onClick={() => onChange(data.filter((_, j) => j !== i))}
                      style={{ marginLeft: '8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ marginBottom: '16px' }}>{pv('Project Title', p.title)}</div>
                  <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                    {pv('Funding Agency', p.fundingAgency)}
                    {pv('Amount Sanctioned', `₹${p.amountSanctioned}`)}
                  </div>
                  <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                    {pv('Duration', p.duration)}
                    {pv('Status', p.status)}
                  </div>
                  <div className="form-row form-row-2" style={{ marginBottom: '16px' }}>
                    {pv('Your Role', p.role)}
                    <div></div>
                  </div>
                  {p.description && <div style={{ marginBottom: '16px' }}>{pv('Description', p.description)}</div>}
                  {p.documentUrl && (
                    <div style={{ marginTop: '8px' }}>
                      <a href={`${import.meta.env.VITE_API_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                        <ExternalLink size={14} /> View Document
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}