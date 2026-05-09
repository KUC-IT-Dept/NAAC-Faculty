import { Plus, Trash2, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { courseName: '', platform: '', duration: '', completionYear: '', certificateId: '', certificateUrl: '' };

export default function OnlineCourses({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(true);

  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const handleAddNew = () => {
    onChange([...data, { ...EMPTY }]);
    setIsEditMode(true);
  };

  return (
    <div>
      {/* Top Toggle Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16, gap: 8 }}>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="btn btn-sm btn-ghost"
          >
            <Edit3 size={14} /> Edit
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleAddNew}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Add Course
        </button>
      </div>

      {/* Preview Mode */}
      {!isEditMode && (
        <div>
          {data.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>No online courses added yet.</p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <div
                onClick={() => setExpandedPreview(!expandedPreview)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(28, 53, 87, 0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(28, 53, 87, 0.1)',
                  marginBottom: expandedPreview ? 16 : 0
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--primary-dark)' }}>
                    Online Courses & Certifications ({data.length})
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    {data.filter(d => d.courseName).length} of {data.length} entries filled
                  </p>
                </div>
                {expandedPreview ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {expandedPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.map((c, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px'
                    }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 4 }}>
                          {c.courseName || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Untitled Course</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                          {c.platform && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Platform:</span>
                              <span style={{ fontWeight: 500 }}>{c.platform}</span>
                            </div>
                          )}
                          {c.completionYear && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Year:</span>
                              <span style={{ fontWeight: 500 }}>{c.completionYear}</span>
                            </div>
                          )}
                          {c.duration && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Duration:</span>
                              <span style={{ fontWeight: 500 }}>{c.duration}</span>
                            </div>
                          )}
                          {c.certificateId && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Certificate ID:</span>
                              <span style={{ fontWeight: 500 }}>{c.certificateId}</span>
                            </div>
                          )}
                        </div>
                        {c.certificateUrl && (
                          <div style={{ fontSize: '0.78rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ color: 'var(--text-light)' }}>Certificate File:</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{c.certificateUrl}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>
      )}

      {/* Edit Mode */}
      {isEditMode && (
        <div>
          {data.map((c, i) => (
            <div key={i} className="list-item-card">
              <button type="button" className="list-item-remove" onClick={() => onChange(data.filter((_, j) => j !== i))}><Trash2 size={14} /></button>
              {fg('Course / Certification Name *', inp(c.courseName, v => upd(i, 'courseName', v), 'Machine Learning Specialization'))}
              <div className="form-row form-row-3">
                {fg('Platform / Provider *', sel(c.platform, v => upd(i, 'platform', v), ['NPTEL', 'Swayam', 'Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other']))}
                {fg('Duration', inp(c.duration, v => upd(i, 'duration', v), '8 weeks / 40 hours'))}
                {fg('Year of Completion', sel(c.completionYear, v => upd(i, 'completionYear', v), Array.from({ length: 40 }, (_, idx) => (new Date().getFullYear() - idx).toString())))}
              </div>
              <div className="form-row form-row-2">
                {fg('Certificate ID / Number', inp(c.certificateId, v => upd(i, 'certificateId', v)))}
                <div className="form-group">
                  <label className="form-label">Upload Certificate</label>
                  <input
                    type="file"
                    className="form-input"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) upd(i, 'certificateUrl', file.name);
                    }}
                    style={{ padding: '6px' }}
                  />
                  {c.certificateUrl && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 4 }}>Uploaded: {c.certificateUrl}</div>}
                </div>
              </div>
            </div>
          ))}
          {data.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setIsEditMode(false)}
              >
                Done Editing
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
