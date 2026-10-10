import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, ExternalLink, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fg, inp, sel, FileInp, dateInp, DocumentPreviewLink } from './sectionUtils';
import { coursePlatformOptions, courseLevelOptions } from '../../shared/dropdownOptions';
import { useDropdownOptions } from '../../shared/useDropdownOptions';

const ACTIVITY_TYPE_OPTIONS = ['Conducted', 'Attended', 'Taught'];

// New records carry a single `date` + `activityType`. Legacy `from`/`to` are never written for new records;
// on legacy records they are preserved untouched (edits spread the existing item).
const EMPTY = { courseName: '', activityType: '', platform: '', date: '', certificateId: '', certificateUrl: '', score: '', courseLevel: '' };

const yearOf = (v?: string) => (/^\d{4}/.test(v || '') ? (v as string).slice(0, 4) : '');
const sortKey = (it: any) => it.date || it.from || '';

const btnAdd: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4f46e5', color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnEdit: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#f8fafc', color: '#334155', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' };
const btnDelete: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };
const btnSave: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', color: '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' };
const btnCancel: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#fff1f2', color: '#9f1239', padding: '7px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid #fecdd3', cursor: 'pointer' };

function PreviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
      <span style={{ minWidth: 160, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary, #1e293b)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function PreviewCard({ item, onEdit, onDelete, disabled }: { item: any; onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const displayYear = yearOf(item.date) || yearOf(item.from) || item.completionYear || '—';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 16, flex: 1, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ minWidth: 56, textAlign: 'center', padding: '6px 4px', borderRadius: 8, background: 'var(--primary, #2563eb)', flexShrink: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{displayYear}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'uppercase' }}>Year</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary, #1e293b)', fontSize: 15, marginBottom: 4 }}>
              {item.courseName || 'Untitled Course'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {item.platform && <span className="badge badge-secondary">{item.platform}</span>}
              {item.score && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Score: {item.score}</span>}
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
          <PreviewRow label="Course Name" value={item.courseName} />
          <PreviewRow label="Activity Type" value={item.activityType} />
          <PreviewRow label="Platform" value={item.platform} />
          <PreviewRow label="Course Level" value={item.courseLevel} />
          <PreviewRow label="Date" value={item.date} />
          {/* Legacy values stay visible (read-only) until the faculty member picks a single Date */}
          {!item.date && item.from && <PreviewRow label="From Date (legacy)" value={item.from} />}
          {!item.date && item.to && <PreviewRow label="To Date (legacy)" value={item.to} />}
          {!item.date && !item.from && !item.to && <PreviewRow label="Duration" value={item.duration} />}
          {!item.date && !item.from && !item.to && <PreviewRow label="Year" value={item.completionYear} />}
          <PreviewRow label="Certificate ID" value={item.certificateId} />
          <PreviewRow label="Score" value={item.score} />
          {item.certificateUrl && (
            <div style={{ marginTop: 8 }}>
              <DocumentPreviewLink url={item.certificateUrl} label="View Certificate" />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function OnlineCourses({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  // Reactive dropdown options
  const platformOpts = useDropdownOptions(coursePlatformOptions);
  const levelOpts = useDropdownOptions(courseLevelOptions);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [pendingNewItem, setPendingNewItem] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  const upd = (i: number, k: string, v: string) => {
    setIsDirty(true);
    const a = [...data];
    a[i] = { ...a[i], [k]: v };
    onChange(a);
  };

  const isItemComplete = (item: any) => item.courseName && item.activityType && item.platform && item.date;

  const handleAdd = () => {
    setPendingNewItem({ ...EMPTY });
    setIsDirty(false);
  };

  const handleSavePending = (item: any) => {
    if (isItemComplete(item)) {
      const updated = [item, ...data];
      onChange(updated);
      setPendingNewItem(null);
      setIsDirty(false);
    }
  };

  // Keep each record's index in `data`: edits/deletes must target the right record even when the list is displayed sorted.
  const rows = data.map((item, idx) => ({ item, idx })).sort((a, b) => sortKey(b.item).localeCompare(sortKey(a.item)));

  return (
    <>
      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <h5 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Online Courses / Certifications</h5>
        <button
          type="button"
          onClick={handleAdd}
          disabled={pendingNewItem !== null || editingItemIndex !== null}
          style={{ ...btnAdd, flexShrink: 0 }}
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      {rows.length === 0 && (
        <div className="empty-state">No courses added yet. Click Add Course to get started.</div>
      )}

      <div className="items-list">
        {pendingNewItem && (
          <div key="pending" className="list-item-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>New Course</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setPendingNewItem(null); setIsDirty(false); }} style={btnCancel}>
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={isItemComplete(pendingNewItem) ? btnSave : { ...btnSave, backgroundColor: '#16a34a', color: '#ffffff', cursor: 'not-allowed', opacity: 0.6 }}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </div>
            {fg('Course / Certification Name *', inp(pendingNewItem.courseName, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, courseName: v }); }))}
            {fg('Course Activity Type *', sel(pendingNewItem.activityType, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, activityType: v }); }, ACTIVITY_TYPE_OPTIONS, "Select..."))}
            <div className="form-row form-row-2">
              {fg('Platform / Provider *', sel(pendingNewItem.platform, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, platform: v }); }, platformOpts, "Select..."))}
              {fg('Course Level', sel(pendingNewItem.courseLevel, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, courseLevel: v }); }, levelOpts, "Select..."))}
            </div>
            {fg('Date *', dateInp(pendingNewItem.date, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, date: v }); }))}
            <div className="form-row form-row-2">
              {fg('Certificate ID', inp(pendingNewItem.certificateId, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, certificateId: v }); }))}
              {fg('Score / Grade', inp(pendingNewItem.score, v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, score: v }); }))}
            </div>
            {fg('Upload Certificate', <FileInp v={pendingNewItem.certificateUrl} fn={v => { setIsDirty(true); setPendingNewItem({ ...pendingNewItem, certificateUrl: v }); }} section="onlineCourses" />)}
            {isDirty && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => { setPendingNewItem(null); setIsDirty(false); }} style={btnCancel}>
                  <X size={14} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePending(pendingNewItem)}
                  disabled={!isItemComplete(pendingNewItem)}
                  style={isItemComplete(pendingNewItem) ? btnSave : { ...btnSave, backgroundColor: '#16a34a', color: '#ffffff', cursor: 'not-allowed', opacity: 0.6 }}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            )}
          </div>
        )}

        {rows.map(({ item, idx: i }) => {
          const itemIsEditing = editingItemIndex === i;
          return (
            <div key={i} className="list-item-card">
              {itemIsEditing ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Editing Course</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => { setEditingItemIndex(null); setIsDirty(false); }} style={btnCancel}>
                        <X size={14} /> Cancel
                      </button>
                      <button type="button" onClick={() => { setEditingItemIndex(null); setIsDirty(false); }} style={btnSave}>
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>
                  {fg('Course / Certification Name *', inp(item.courseName, v => upd(i, 'courseName', v)))}
                  {fg('Course Activity Type *', sel(item.activityType, v => upd(i, 'activityType', v), ACTIVITY_TYPE_OPTIONS, "Select..."))}
                  <div className="form-row form-row-2">
                    {fg('Platform / Provider *', sel(item.platform, v => upd(i, 'platform', v), platformOpts, "Select..."))}
                    {fg('Course Level', sel(item.courseLevel, v => upd(i, 'courseLevel', v), levelOpts, "Select..."))}
                  </div>
                  {fg('Date *', dateInp(item.date, v => upd(i, 'date', v)))}
                  {!item.date && (item.from || item.to) && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', margin: '-8px 0 12px' }}>
                      Earlier record: {item.from || '—'} to {item.to || '—'}. Pick a single Date above (not auto-filled).
                    </div>
                  )}
                  <div className="form-row form-row-2">
                    {fg('Certificate ID', inp(item.certificateId, v => upd(i, 'certificateId', v)))}
                    {fg('Score / Grade', inp(item.score, v => upd(i, 'score', v)))}
                  </div>
                  {fg('Upload Certificate', <FileInp v={item.certificateUrl} fn={v => upd(i, 'certificateUrl', v)} section="onlineCourses" />)}
                  {isDirty && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                      <button type="button" onClick={() => { setEditingItemIndex(null); setIsDirty(false); }} style={btnCancel}>
                        <X size={14} /> Cancel
                      </button>
                      <button type="button" onClick={() => { setEditingItemIndex(null); setIsDirty(false); }} style={btnSave}>
                        <Check size={14} /> Save
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <PreviewCard
                  item={item}
                  onEdit={() => { setEditingItemIndex(i); setIsDirty(false); }}
                  onDelete={() => onChange(data.filter((_, j) => j !== i))}
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
