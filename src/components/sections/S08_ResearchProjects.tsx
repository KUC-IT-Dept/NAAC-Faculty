import { useState } from 'react';
import { Plus, Trash2, Edit2, Check } from 'lucide-react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { 
  title: '', 
  fundingAgency: '', 
  amountSanctioned: '', 
  startDate: '', 
  endDate: '', 
  status: '', 
  role: '', 
  referenceNumber: '' 
};

const FUNDING_AGENCIES = ['DST', 'UGC', 'ICSSR', 'CSIR', 'NBHM', 'Others'];
const STATUSES = ['Ongoing', 'Completed'];
const ROLES = ['Principal Investigator', 'Co-PI'];

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

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
    setEditingItemIndex(null);
  };

  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      const updated = [item, ...data];
      updated.sort((a, b) => {
        const getYear = (d: any) => {
          if (!d.startDate) return 0;
          return new Date(d.startDate).getTime();
        };
        return getYear(b) - getYear(a);
      });
      onChange(updated);
      setPendingNewItem(null);
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const getYear = (d: any) => {
      if (!d.startDate) return 0;
      return new Date(d.startDate).getTime();
    };
    return getYear(b) - getYear(a);
  });

  const renderForm = (item: any, isPending: boolean, idx?: number) => {
    const setVal = (k: string, v: any) => {
      if (isPending) {
        setPendingNewItem({ ...item, [k]: v });
      } else {
        upd(idx!, k, v);
      }
    };

    return (
      <>
        <div className="form-row form-row-2">
          {fg('Project Title *', inp(item.title, v => setVal('title', v), 'Project title...'))}
          {fg('Project Reference Number', inp(item.referenceNumber, v => setVal('referenceNumber', v), 'e.g. PRJ-2023-01'))}
        </div>
        <div className="form-row form-row-2">
          {fg('Funding Agency *', sel(item.fundingAgency, v => setVal('fundingAgency', v), FUNDING_AGENCIES))}
          {fg('Role', sel(item.role, v => setVal('role', v), ROLES))}
        </div>
        <div className="form-row form-row-2">
          {fg('Sanctioned Amount (₹)', inp(item.amountSanctioned, v => setVal('amountSanctioned', v), 'e.g. 5,00,000'))}
          {fg('Status', sel(item.status, v => setVal('status', v), STATUSES))}
        </div>
        <div className="form-row form-row-2">
          {fg('Duration (From)', <input type="date" className="form-input" value={item.startDate || ''} onChange={e => setVal('startDate', e.target.value)} />)}
          {fg('Duration (To)', <input type="date" className="form-input" value={item.endDate || ''} onChange={e => setVal('endDate', e.target.value)} />)}
        </div>
      </>
    );
  };

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  return (
    <>
      <div className="section-header-actions" style={{ justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          type="button"
          onClick={handleAddProject}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={btnAdd}
        >
          <Plus size={16} /> Add Project
        </button>
      </div>

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Project</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={isItemComplete(pendingNewItem) ? btnSave : { ...btnSave, backgroundColor: '#d1fae5', color: '#6ee7b7', cursor: 'not-allowed' }}
                >
                  <Check size={14} /> Save
                </button>
                <button type="button" onClick={() => setPendingNewItem(null)} style={btnCancel}>
                  Cancel
                </button>
              </div>
            </div>
            {renderForm(pendingNewItem, true)}
          </div>
        )}

        {editingItemIndex !== null && (
          <div key="editing" className="list-item-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Project</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setEditingItemIndex(null)} style={btnSave}>
                  <Check size={14} /> Done
                </button>
              </div>
            </div>
            {renderForm(sortedData[editingItemIndex], false, editingItemIndex)}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ fontSize: '15px', color: '#2563eb', fontWeight: 700, marginBottom: '16px' }}>Added Research Projects</h4>
        
        {sortedData.length === 0 ? (
          <div className="empty-state">No research projects added yet. Click Add Project to get started.</div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>SR. NO.</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Project Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Funding Agency</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Sanctioned Amount (₹)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap' }}>Duration (From – To)</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569' }}>Project Reference Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, color: '#475569', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((p, i) => (
                  <tr key={i} style={{ borderBottom: i !== sortedData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{i + 1}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 600, minWidth: '150px' }}>{p.title || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{p.fundingAgency || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{p.role || '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{p.amountSanctioned ? `₹${p.amountSanctioned}` : '—'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>
                      {fmtDate(p.startDate)} <span style={{ color: '#94a3b8', margin: '0 4px' }}>to</span> {fmtDate(p.endDate)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.status && (
                        <span style={{ 
                          padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: p.status === 'Completed' ? '#dcfce7' : '#e0f2fe',
                          color: p.status === 'Completed' ? '#166534' : '#075985',
                          whiteSpace: 'nowrap'
                        }}>
                          {p.status}
                        </span>
                      )}
                      {!p.status && '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', whiteSpace: 'nowrap' }}>{p.referenceNumber || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setEditingItemIndex(i); }} 
                          style={{ ...btnEdit, padding: '6px' }} 
                          disabled={pendingNewItem !== null || editingItemIndex !== null}
                          title="Edit Project"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => onChange(sortedData.filter((_, j) => j !== i))} 
                          style={{ ...btnDelete, padding: '6px' }} 
                          disabled={pendingNewItem !== null || editingItemIndex !== null}
                          title="Delete Project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}