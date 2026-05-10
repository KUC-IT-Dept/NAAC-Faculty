import { ReactNode, useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

/** Shared label helper */
export const fg = (label: string, node: ReactNode) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {node}
  </div>
);

/** Text input */
export const inp = (v: string, fn: (s: string) => void, ph = '') => (
  <input className="form-input" value={v || ''} onChange={e => fn(e.target.value)} placeholder={ph} />
);

/** Date input */
export const dateInp = (v: string, fn: (s: string) => void) => (
  <input className="form-input" type="date" value={v || ''} onChange={e => fn(e.target.value)} />
);

/** Select */
export const sel = (v: string, fn: (s: string) => void, opts: string[]) => (
  <select className="form-select" value={v || ''} onChange={e => fn(e.target.value)}>
    <option value="">— Select —</option>
    {opts.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);

/** Year dropdown */
export const yearSel = (v: string, fn: (s: string) => void, startYear = 1970, endYear = new Date().getFullYear() + 10) => {
  const years = [];
  for (let y = endYear; y >= startYear; y--) {
    years.push(y.toString());
  }
  return (
    <select className="form-select" value={v || ''} onChange={e => fn(e.target.value)}>
      <option value="">— Year —</option>
      {years.map(y => <option key={y} value={y}>{y}</option>)}
    </select>
  );
};

/** Dropdown with custom addition */
export const DropdownWithCustom = ({ v, fn, opts, ph = 'Select or type custom...' }: { v: string, fn: (s: string) => void, opts: string[], ph?: string }) => {
  const [isCustom, setIsCustom] = useState(v && !opts.includes(v));
  
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {isCustom ? (
        <div style={{ flex: 1, position: 'relative' }}>
          <input className="form-input" value={v || ''} onChange={e => fn(e.target.value)} placeholder={ph} />
          <button type="button" onClick={() => { setIsCustom(false); fn(''); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={12} />
          </button>
        </div>
      ) : (
        <select className="form-select" value={v || ''} onChange={e => {
          if (e.target.value === 'CUSTOM_ADD') {
            setIsCustom(true);
            fn('');
          } else {
            fn(e.target.value);
          }
        }}>
          <option value="">— Select —</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
          <option value="CUSTOM_ADD" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>+ Add Custom...</option>
        </select>
      )}
    </div>
  );
};

/** File Upload Component */
export const FileInp = ({ v, fn, label = 'Upload Document' }: { v: string, fn: (s: string) => void, label?: string }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    setUploading(true);
    try {
      const r = await api.post('/faculty/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fn(r.data.url);
      toast.success('File uploaded!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (v) return (
    <div className="file-preview-box">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <FileText size={16} className="text-primary" />
        <span className="text-xs truncate" style={{ maxWidth: 150 }}>{v.split('/').pop()}</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" className="btn-icon" onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${v}`, '_blank')}>
          <Upload size={12} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <button type="button" className="btn-icon text-danger" onClick={() => fn('')}>
          <X size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <button type="button" className="file-upload-trigger" onClick={() => fileRef.current?.click()} disabled={uploading}>
      <input type="file" ref={fileRef} hidden onChange={handleUpload} />
      {uploading ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Upload size={14} />}
      <span>{uploading ? 'Uploading...' : label}</span>
    </button>
  );
};

/** Textarea */
export const ta = (v: string, fn: (s: string) => void, ph = '', rows = 2) => (
  <textarea className="form-textarea" rows={rows} value={v || ''} onChange={e => fn(e.target.value)} placeholder={ph} />
);

/** Subsection title — uses `.subsection-title` from index.css */
export const Sub = ({ children }: { children: ReactNode }) => (
  <p className="subsection-title">{children}</p>
);

/** Info note — uses `.info-banner .info-banner-info` from index.css */
export const Note = ({ children }: { children: ReactNode }) => (
  <div className="info-banner info-banner-info" style={{ marginBottom: 16 }}>
    <span>{children}</span>
  </div>
);

/** Preview Box helper for theme consistency */
export const pv = (label: string, value: any) => (
  <div style={{ padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px', height: '100%' }}>
    <strong style={{ display: 'block', marginBottom: '4px' }}>{label}:</strong> {value || 'Not specified'}
  </div>
);
