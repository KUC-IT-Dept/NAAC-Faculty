import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { fg, inp, sel, ta, FileInp } from './sectionUtils';

const EMPTY = { title: '', fundingAgency: '', amountSanctioned: '', duration: '', startDate: '', endDate: '', isOngoing: false, status: '', role: '', description: '', documentUrl: '' };

function calculateDuration(start: string, end: string, isOngoing: boolean) {
  if (!start) return { text: '—', months: 0, formatted: '' };
  const d1 = new Date(start);
  const d2 = isOngoing ? new Date() : (end ? new Date(end) : null);
  
  if (isNaN(d1.getTime()) || (!isOngoing && (!d2 || isNaN(d2.getTime())))) {
    return { text: '—', months: 0, formatted: '' };
  }
  
  if (!isOngoing && d2 && d1 > d2) {
    return { text: 'Invalid Dates', months: 0, formatted: '' };
  }

  const diffMonths = (d2!.getFullYear() - d1.getFullYear()) * 12 + (d2!.getMonth() - d1.getMonth());
  const totalMonths = diffMonths < 0 ? 0 : diffMonths;
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  let text = '';
  if (years > 0) text += `${years} Year${years > 1 ? 's' : ''} `;
  if (months > 0 || years === 0) text += `${months} Month${months !== 1 ? 's' : ''}`;
  text = text.trim();

  const startYear = d1.getFullYear();
  const endYear = isOngoing ? 'Present' : d2!.getFullYear();
  const formatted = `${startYear} - ${endYear} (${text})`;

  return { text, months: totalMonths, formatted };
}

const FUNDING_AGENCIES = ['DST-SERB', 'ICMR', 'AICTE', 'UGC', 'CSIR', 'DBT', 'IYSC', 'IIT'];
const STATUSES = ['Ongoing', 'Completed', 'Submitted', 'Rejected'];
const ROLES = ['Principal Investigator (PI)', 'Co-Principal Investigator (Co-PI)', 'Co-Investigator'];

const btnAdd:    React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#be123c', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #ffe4e6', cursor: 'pointer' };
const btnSave:   React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function ProjectPreviewCard({
  p, onEdit, onDelete, disabled
}: {
  p: any; onEdit: () => void; onDelete: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
              {p.duration ? (p.duration.match(/\d{4}/g) || []).slice(-1)[0] || '—' : '—'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {p.title || 'Untitled Project'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {p.fundingAgency && <span className="badge badge-secondary">{p.fundingAgency}</span>}
              {p.status && <span className="badge badge-secondary">{p.status}</span>}
              {p.role && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.role}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexShrink: 0 }}>
          <button type="button" style={btnEdit} onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {expanded ? 'Hide' : 'View'}
          </button>
          <button type="button" style={btnEdit} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={disabled}>
            <Edit2 size={14} /> Edit
          </button>
          <button type="button" style={btnDelete} onClick={(e) => { e.stopPropagation(); onDelete(); }} disabled={disabled}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border, #e2e8f0)' }}>
          <PreviewRow label="Project Title" value={p.title} />
          <PreviewRow label="Funding Agency" value={p.fundingAgency} />
          <PreviewRow label="Amount Sanctioned" value={p.amountSanctioned ? `₹${p.amountSanctioned}` : null} />
          <PreviewRow label="Duration" value={p.duration} />
          <PreviewRow label="Status" value={p.status} />
          <PreviewRow label="Your Role" value={p.role} />
          <PreviewRow label="Description" value={p.description} />
          {p.documentUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={`${import.meta.env.VITE_API_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" className="preview-file-link" style={{ display: 'inline-flex' }}>
                <ExternalLink size={14} /> View Document
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function ResearchProjects({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);

  const upd = (i: number, k: string, v: string) => {
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    onChange(a);
  };

  const isItemComplete = (item: any) => item.title && item.fundingAgency;

  const renderDurationSection = (item: any, isPending: boolean, idx?: number) => {
    const handleDateChange = (k: string, v: any) => {
      const newItem = { ...item, [k]: v };
      if (k === 'isOngoing' && v) {
        newItem.endDate = '';
      }
      const c = calculateDuration(newItem.startDate, newItem.endDate, newItem.isOngoing);
      if (c.formatted) {
        newItem.duration = c.formatted;
      } else {
        newItem.duration = '';
      }
      
      if (isPending) {
        setPendingNewItem(newItem);
      } else {
        const a = [...data];
        a[idx!] = newItem;
        onChange(a);
      }
    };

    const calc = calculateDuration(item.startDate, item.endDate, item.isOngoing);

    return (
      <>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16 }}>
          {fg('Project Start Date', <input type="date" className="form-input" value={item.startDate || ''} onChange={e => handleDateChange('startDate', e.target.value)} />)}
          {fg('Project End Date', <input type="date" className="form-input" value={item.endDate || ''} disabled={item.isOngoing} onChange={e => handleDateChange('endDate', e.target.value)} min={item.startDate || ''} />)}
          {fg('Ongoing Project', 
            <div style={{ display: 'flex', alignItems: 'center', height: '38px', padding: '0 8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <input type="checkbox" checked={item.isOngoing || false} onChange={e => handleDateChange('isOngoing', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#3b82f6', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>Ongoing</span>
              </label>
            </div>
          )}
        </div>
        
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calendar size={18} color="#0284c7" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 500, marginBottom: 2 }}>Calculated Duration</div>
            <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>
              {calc.text !== '—' && calc.text !== 'Invalid Dates' ? (
                <>{calc.text} <span style={{ color: '#64748b', fontSize: 13, fontWeight: 400 }}>({calc.months} Months)</span></>
              ) : (
                <span style={{ color: '#94a3b8' }}>{calc.text === 'Invalid Dates' ? 'Invalid Dates' : 'Select dates to calculate'}</span>
              )}
            </div>
          </div>
          <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, border: '1px solid #bae6fd' }}>Auto Calculated</div>
        </div>
      </>
    );
  };

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

      {sortedData.length === 0 && (
        <div className="empty-state">No research projects added yet. Click Add Project to get started.</div>
      )}

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
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
            <div className="form-row form-row-1">
              {fg('Project Title *', inp(pendingNewItem.title, v => setPendingNewItem({ ...pendingNewItem, title: v }), 'AI in Healthcare...'))}
            </div>
            <div className="form-row form-row-2">
              {fg('Funding Agency *', sel(pendingNewItem.fundingAgency, v => setPendingNewItem({ ...pendingNewItem, fundingAgency: v }), FUNDING_AGENCIES))}
              {fg('Amount Sanctioned (₹)', inp(pendingNewItem.amountSanctioned, v => setPendingNewItem({ ...pendingNewItem, amountSanctioned: v }), '5,00,000'))}
            </div>
            {renderDurationSection(pendingNewItem, true)}
            <div className="form-row form-row-2">
              {fg('Status', sel(pendingNewItem.status, v => setPendingNewItem({ ...pendingNewItem, status: v }), STATUSES))}
              {fg('Your Role', sel(pendingNewItem.role, v => setPendingNewItem({ ...pendingNewItem, role: v }), ROLES))}
            </div>
            <div className="form-row form-row-1">
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Project</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setEditingItemIndex(null)} style={btnSave}>
                        <Check size={14} /> Done
                      </button>
                      <button type="button" onClick={() => { onChange(sortedData.filter((_, j) => j !== i)); setEditingItemIndex(null); }} style={btnDelete}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Project Title *', inp(p.title, v => upd(i, 'title', v), 'AI in Healthcare...'))}
                  </div>
                  <div className="form-row form-row-2">
                    {fg('Funding Agency *', sel(p.fundingAgency, v => upd(i, 'fundingAgency', v), FUNDING_AGENCIES))}
                    {fg('Amount Sanctioned (₹)', inp(p.amountSanctioned, v => upd(i, 'amountSanctioned', v), '5,00,000'))}
                  </div>
                  {renderDurationSection(p, false, i)}
                  <div className="form-row form-row-2">
                    {fg('Status', sel(p.status, v => upd(i, 'status', v), STATUSES))}
                    {fg('Your Role', sel(p.role, v => upd(i, 'role', v), ROLES))}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Sanction Letter / Document', <FileInp v={p.documentUrl} fn={v => upd(i, 'documentUrl', v)} />)}
                  </div>
                  <div className="form-row form-row-1">
                    {fg('Project Description (optional)', ta(p.description, v => upd(i, 'description', v), 'Brief description...'))}
                  </div>
                </>
              ) : (
                <ProjectPreviewCard
                  p={p}
                  onEdit={() => setEditingItemIndex(i)}
                  onDelete={() => onChange(sortedData.filter((_, j) => j !== i))}
                  disabled={pendingNewItem !== null}
                />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}