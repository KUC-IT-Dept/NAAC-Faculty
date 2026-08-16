import { useState } from 'react';
import { Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import { fg, inp, sel, dateInp, ta } from './sectionUtils';
import { useDropdownOptions } from '../../shared/useDropdownOptions';
import { patentStatusOptions, patentTypeOptions, jurisdictionTypeOptions, licensingStatusOptions } from '../../shared/dropdownOptions';
import { useConfirmDelete } from '../useConfirmDelete';
import { useConfirmSave } from '../useConfirmSave';

const EMPTY_PATENT = {
  title: '',
  patentNumber: '',
  dateOfFiling: '',
  status: '',
  patentType: '',
  grantDate: '',
  patentOffice: '',
  jurisdictionType: '',
  inventorNames: '',
  departmentAffiliation: '',
  collaborators: '',
  subjectArea: '',
  abstractSummary: '',
  keywordsClassification: '',
  associatedProjects: '',
  fundingSource: '',
  licensingStatus: '',
  revenueGenerated: '',
  technologyTransfer: '',
  citations: '',
  awardsRecognition: '',
  societalImpact: '',
};

const btnStyles = {
  add: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#4f46e5', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' } as React.CSSProperties,
  edit: { display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #cbd5e1', cursor: 'pointer' } as React.CSSProperties,
  delete: { display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' } as React.CSSProperties,
  save: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a34a', color: '#ffffff', padding: '7px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' } as React.CSSProperties,
  saveDisabled: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#16a35f', color: '#ffffff', padding: '7px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'not-allowed' } as React.CSSProperties,
  cancel: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer' } as React.CSSProperties,
};

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 220, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const SectionHeader = ({ title }: { title: string }) => (
  <h4 style={{ margin: '20px 0 12px', fontSize: '14px', color: 'var(--primary, #4f46e5)', fontWeight: 600, borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
    {title}
  </h4>
);

export default function Patents({ data, onChange, onPersist }: { data: any[]; onChange: (d: any[]) => void; onPersist?: (updated: any[]) => void }) {
  const { confirmSave, ConfirmDialog } = useConfirmSave();
  const { confirmDelete, ConfirmDialog: ConfirmDeleteDialog } = useConfirmDelete();
  const statuses = useDropdownOptions(patentStatusOptions);
  const types = useDropdownOptions(patentTypeOptions);
  const jurisdictionTypes = useDropdownOptions(jurisdictionTypeOptions);
  const licensingStatuses = useDropdownOptions(licensingStatusOptions);

  const [pendingItem, setPendingItem] = useState<any | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [, setIsDirty] = useState(false);

  const patents = data || [];

  const upd = (k: string, v: string) => {
    setIsDirty(true);
    if (editingIndex !== null) {
      const arr = [...patents];
      arr[editingIndex] = { ...arr[editingIndex], [k]: v };
      onChange(arr);
    } else if (pendingItem) {
      setPendingItem({ ...pendingItem, [k]: v });
    }
  };

  const isComplete = (p: any) => !!p.title && !!p.patentNumber;

  const handleSavePending = () => {
    if (pendingItem && isComplete(pendingItem)) {
      const arr = [pendingItem, ...patents];
      onChange(arr);
      if (onPersist) onPersist(arr);
      setPendingItem(null);
      setIsDirty(false);
    }
  };

  const handleDelete = (i: number) => {
    confirmDelete(() => {
      const arr = patents.filter((_, idx) => idx !== i);
      onChange(arr);
      if (onPersist) onPersist(arr);
      setEditingIndex(null);
    });
  };

  const renderPatentFormFields = (item: any) => (
    <>
      <SectionHeader title="Patent Information" />
      {fg('Patent Title *', inp(item.title, v => upd('title', v)))}
      <div className="form-row form-row-2">
        {fg('Patent Type', sel(item.patentType, v => upd('patentType', v), types))}
        {fg('Status', sel(item.status, v => upd('status', v), statuses))}
      </div>
      <div className="form-row form-row-2">
        {fg('Application / Patent No. *', inp(item.patentNumber, v => upd('patentNumber', v), 'IN202021012345'))}
        {fg('Date of Filing', dateInp(item.dateOfFiling, v => upd('dateOfFiling', v)))}
      </div>
      <div className="form-row form-row-3">
        {fg('Grant Date', dateInp(item.grantDate, v => upd('grantDate', v)))}
        {fg('Patent Office', inp(item.patentOffice, v => upd('patentOffice', v)))}
        {fg('Jurisdiction Type', sel(item.jurisdictionType, v => upd('jurisdictionType', v), jurisdictionTypes))}
      </div>

      <SectionHeader title="Faculty & Inventor Details" />
      <div className="form-row form-row-2">
        {fg('Inventor Names', inp(item.inventorNames, v => upd('inventorNames', v), 'Enter inventor name(s)'))}
        {fg('Department Affiliation', inp(item.departmentAffiliation, v => upd('departmentAffiliation', v), 'Enter department / academic unit'))}
      </div>
      {fg('Collaborators', ta(item.collaborators, v => upd('collaborators', v), 'Co-inventors from other institutions or industry', 2))}

      <SectionHeader title="Technical & Research Aspects" />
      <div className="form-row form-row-2">
        {fg('Subject Area', inp(item.subjectArea, v => upd('subjectArea', v), 'e.g. Computer Science, Biotechnology, Engineering'))}
        {fg('Keywords / Classification', inp(item.keywordsClassification, v => upd('keywordsClassification', v), 'Enter keywords or IPC/CPC classification'))}
      </div>
      {fg('Abstract / Summary', ta(item.abstractSummary, v => upd('abstractSummary', v), 'Enter a short description of the invention', 3))}
      {fg('Associated Projects', ta(item.associatedProjects, v => upd('associatedProjects', v), 'Related funded research projects or grants', 2))}

      <SectionHeader title="Financial & Commercial Impact" />
      <div className="form-row form-row-3">
        {fg('Funding Source', inp(item.fundingSource, v => upd('fundingSource', v), 'Government / Industry / Institutional'))}
        {fg('Licensing Status', sel(item.licensingStatus, v => upd('licensingStatus', v), licensingStatuses))}
        {fg('Revenue Generated', inp(item.revenueGenerated, v => upd('revenueGenerated', v), 'Enter royalties or commercialization income'))}
      </div>
      {fg('Technology Transfer', ta(item.technologyTransfer, v => upd('technologyTransfer', v), 'Partnerships, technology transfer, spin-off companies, etc.', 3))}

      <SectionHeader title="Outreach & Recognition" />
      <div className="form-row form-row-2">
        {fg('Citations / Outreach & Recognition', inp(item.citations, v => upd('citations', v)))}
        {fg('Awards / Recognition', ta(item.awardsRecognition, v => upd('awardsRecognition', v), '', 2))}
      </div>
      {fg('Societal Impact', ta(item.societalImpact, v => upd('societalImpact', v), 'Contribution to industry, healthcare, environment, society, etc.', 3))}
    </>
  );

  return (
    <>
      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 16 }}>Patents</h3>
        <button type="button" style={btnStyles.add} onClick={() => { setPendingItem({ ...EMPTY_PATENT }); setEditingIndex(null); setIsDirty(false); }} disabled={pendingItem !== null || editingIndex !== null}>
          <Plus size={16} /> Add Patent
        </button>
      </div>

      {patents.length === 0 && pendingItem === null && (
        <div className="empty-state">No patents added yet. Click Add Patent to get started.</div>
      )}

      <div className="items-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {pendingItem && (
          <div className="item-card is-editing" style={{ padding: 24, border: '1px solid #e2e8f0', borderRadius: 12, backgroundColor: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Patent</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={btnStyles.cancel} onClick={() => setPendingItem(null)}><X size={14} /> Cancel</button>
                <button type="button" style={isComplete(pendingItem) ? btnStyles.save : btnStyles.saveDisabled} disabled={!isComplete(pendingItem)} onClick={() => confirmSave(handleSavePending)}><Check size={14} /> Save</button>
              </div>
            </div>
            {renderPatentFormFields(pendingItem)}
          </div>
        )}

        {patents.map((p, i) => {
          const isEditing = editingIndex === i;
          return (
            <div key={i} className="item-card" style={{ padding: 24, border: '1px solid #e2e8f0', borderRadius: 12, backgroundColor: '#fff' }}>
              {isEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Patent</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" style={isComplete(p) ? btnStyles.save : btnStyles.saveDisabled} disabled={!isComplete(p)} onClick={() => confirmSave(() => { setEditingIndex(null); if (onPersist) onPersist(patents); })}><Check size={14} /> Done</button>
                      <button type="button" style={btnStyles.delete} onClick={() => handleDelete(i)}><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                  {renderPatentFormFields(p)}
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 16, marginBottom: 4 }}>
                      {p.title || 'Untitled Patent'}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      {p.patentType && <span className="badge badge-secondary">{p.patentType}</span>}
                      {p.status && <span className="badge" style={{ backgroundColor: p.status === 'Granted' ? '#dcfce7' : '#fef3c7', color: p.status === 'Granted' ? '#16a34a' : '#d97706' }}>{p.status}</span>}
                      {p.jurisdictionType && <span className="badge badge-outline">{p.jurisdictionType}</span>}
                      {p.licensingStatus && <span className="badge badge-outline">{p.licensingStatus}</span>}
                    </div>
                    <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                      <PreviewRow label="Application / Patent No." value={p.patentNumber} />
                      <PreviewRow label="Date of Filing" value={p.dateOfFiling} />
                      <PreviewRow label="Grant Date" value={p.grantDate} />
                      <PreviewRow label="Patent Office" value={p.patentOffice} />
                      <PreviewRow label="Jurisdiction Type" value={p.jurisdictionType} />
                      <PreviewRow label="Inventor Names" value={p.inventorNames} />
                      <PreviewRow label="Department Affiliation" value={p.departmentAffiliation} />
                      <PreviewRow label="Collaborators" value={p.collaborators} />
                      <PreviewRow label="Subject Area" value={p.subjectArea} />
                      <PreviewRow label="Keywords / Classification" value={p.keywordsClassification} />
                      <PreviewRow label="Abstract / Summary" value={p.abstractSummary} />
                      <PreviewRow label="Associated Projects" value={p.associatedProjects} />
                      <PreviewRow label="Funding Source" value={p.fundingSource} />
                      <PreviewRow label="Licensing Status" value={p.licensingStatus} />
                      <PreviewRow label="Revenue Generated" value={p.revenueGenerated} />
                      <PreviewRow label="Technology Transfer" value={p.technologyTransfer} />
                      <PreviewRow label="Citations / Outreach & Recognition" value={p.citations} />
                      <PreviewRow label="Awards / Recognition" value={p.awardsRecognition} />
                      <PreviewRow label="Societal Impact" value={p.societalImpact} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                    <button type="button" style={btnStyles.edit} onClick={() => { setEditingIndex(i); setPendingItem(null); setIsDirty(false); }} disabled={pendingItem !== null || editingIndex !== null}><Edit2 size={14} /> Edit</button>
                    <button type="button" style={btnStyles.delete} onClick={() => handleDelete(i)} disabled={pendingItem !== null || editingIndex !== null}><Trash2 size={14} /> Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDialog />
      <ConfirmDeleteDialog />
    </>
  );
}
