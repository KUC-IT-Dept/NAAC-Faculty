import { Plus, Trash2, Edit3, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useState } from 'react';
import { fg, inp, sel } from './sectionUtils';

const EMPTY = { courseName: '', platform: '', duration: '', completionYear: '', certificateId: '', certificateUrl: '', score: '' };

export default function OnlineCourses({ data, onChange }: { data: any[]; onChange: (d: any[]) => void }) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedPreview, setExpandedPreview] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const upd = (i: number, k: string, v: string) => { const a = [...data]; a[i] = { ...a[i], [k]: v }; onChange(a); };

  const handleAddNew = () => {
    onChange([{ ...EMPTY }, ...data]);
    setEditingIndex(0);
    setExpandedPreview(true);
    setErrorMsg(null);
  };

  const handleDelete = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
    setErrorMsg(null);
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const handleDone = (index: number) => {
    const item = data[index];
    if (!item.courseName?.trim() || !item.platform?.trim()) {
      setErrorMsg("Please fill in the required fields: Course Name and Platform.");
      return;
    }
    setErrorMsg(null);
    setEditingIndex(null);
  };

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        <button 
          type="button" 
          className="btn btn-primary btn-sm" 
          onClick={handleAddNew}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Add Course
        </button>
      </div>

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
                    borderRadius: '6px',
                    position: 'relative'
                  }}>
                    {editingIndex === i ? (
                      <div>
                        {/* Edit Form */}
                        {fg('Course / Certification Name *', inp(c.courseName, v => upd(i, 'courseName', v), 'Machine Learning Specialization'))}
                        <div className="form-row form-row-3">
                          {fg('Platform / Provider *', sel(c.platform, v => upd(i, 'platform', v), ['NPTEL', 'Swayam', 'Coursera', 'edX', 'Udemy', 'LinkedIn Learning', 'Google', 'Microsoft', 'AWS', 'Other']))}
                          {fg('Duration', inp(c.duration, v => upd(i, 'duration', v), '8 weeks / 40 hours'))}
                          {fg('Year of Completion', sel(c.completionYear, v => upd(i, 'completionYear', v), Array.from({ length: 40 }, (_, idx) => (new Date().getFullYear() - idx).toString())))}
                        </div>
                        <div className="form-row form-row-3">
                          {fg('Certificate ID / Number', inp(c.certificateId, v => upd(i, 'certificateId', v)))}
                          {fg('Score / Grade', inp(c.score, v => upd(i, 'score', v), 'e.g. 95%, A+'))}
                          <div className="form-group">
                            <label className="form-label">Upload Certificate</label>
                            <input 
                              type="file" 
                              accept="image/*,.pdf"
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
                        {errorMsg && editingIndex === i && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 8, textAlign: 'right' }}>
                            {errorMsg}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                          <button 
                            type="button" 
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleDelete(i)}
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleDone(i)}
                          >
                            <Save size={14} /> Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* Preview Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: 4 }}>
                            {c.courseName || <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>Untitled Course</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              type="button" 
                              onClick={() => {
                                setEditingIndex(i);
                                setErrorMsg(null);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: 0 }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDelete(i)}
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: 0 }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
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
                          {c.score && (
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: 'var(--text-light)', marginRight: 4 }}>Score / Grade:</span>
                              <span style={{ fontWeight: 500 }}>{c.score}</span>
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
