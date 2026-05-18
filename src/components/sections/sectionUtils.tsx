import { ReactNode, useState, useRef, useEffect } from 'react';
import { Upload, X, FileText, ExternalLink, RefreshCw, ChevronDown, Search, Check } from 'lucide-react';
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
export const FileInp = ({ v, fn, label = 'Upload Document', accept = ".pdf,image/*" }: { v: string, fn: (s: string) => void, label?: string, accept?: string }) => {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (e.g., 2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    setUploading(true);
    try {
      const r = await api.post('/faculty/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fn(r.data.url);
      toast.success('File uploaded successfully!');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (v) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: '#f0f9ff', border: '1px dashed #0ea5e9', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{ backgroundColor: '#0ea5e9', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={18} color="white" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0369a1', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {v.split('/').pop()}
          </div>
          <div style={{ fontSize: '11px', color: '#0ea5e9' }}>Ready to view</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button 
          type="button" 
          onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${v}`, '_blank')}
          title="View Document"
          style={{ padding: '6px', backgroundColor: 'white', border: '1px solid #e0f2fe', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
        >
          <ExternalLink size={14} />
        </button>
        <button 
          type="button" 
          onClick={() => fn('')}
          title="Remove Document"
          style={{ padding: '6px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div 
      onClick={() => !uploading && fileRef.current?.click()}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '10px', 
        padding: '12px 20px', 
        backgroundColor: uploading ? '#f1f5f9' : '#ffffff', 
        border: '2px dashed #cbd5e1', 
        borderRadius: '8px', 
        cursor: uploading ? 'not-allowed' : 'pointer', 
        transition: 'all 0.2s ease',
        color: '#64748b',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
      onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = uploading ? '#f1f5f9' : '#ffffff'; }}
    >
      <input type="file" ref={fileRef} hidden onChange={handleUpload} accept={accept} />
      
      {uploading ? (
        <RefreshCw size={18} className="animate-spin" color="#3b82f6" />
      ) : (
        <Upload size={18} color="#94a3b8" />
      )}
      
      <span style={{ fontSize: '14px', fontWeight: 600, color: uploading ? '#3b82f6' : '#475569' }}>
        {uploading ? 'Uploading...' : label}
      </span>
      
      {uploading && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', backgroundColor: '#3b82f6', width: '100%', transition: 'width 0.3s ease' }} />
      )}
    </div>
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

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = '— Select Option —'
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(o =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const select = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery('');
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="form-select"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          cursor: 'pointer',
          textAlign: 'left',
          ...(open ? {
             borderColor: 'var(--primary-light)',
             boxShadow: '0 0 0 3px rgba(28, 53, 87, 0.1)'
          } : {})
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, color: value ? 'inherit' : 'var(--text-muted)' }}>
          {value || placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {value && (
            <span
              onClick={clear}
              title="Clear"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: '50%',
                background: '#e2e8f0', cursor: 'pointer',
                color: '#64748b', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#cbd5e1')}
              onMouseLeave={e => (e.currentTarget.style.background = '#e2e8f0')}
            >
              <X size={10} />
            </span>
          )}
          <ChevronDown
            size={15}
            style={{
              color: 'var(--text-muted, #94a3b8)',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'var(--card, #fff)',
            border: '1.5px solid var(--border, #e2e8f0)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderBottom: '1px solid var(--border, #e2e8f0)',
              background: 'var(--bg, #f8fafc)',
            }}
          >
            <Search size={14} color="var(--text-muted, #94a3b8)" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--text-primary, #1e293b)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted, #94a3b8)', display: 'flex' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted, #94a3b8)', textAlign: 'center' }}>
                No results for "{query}"
              </div>
            ) : (
              filtered.map(opt => {
                const isSelected = value === opt;
                const isOther = opt.toLowerCase() === 'other';
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => select(opt)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 14px',
                      border: 'none',
                      background: isSelected ? 'var(--primary, #4f46e5)' : 'transparent',
                      color: isSelected ? '#fff' : isOther ? 'var(--primary, #4f46e5)' : 'var(--text-primary, #1e293b)',
                      fontSize: 13,
                      fontWeight: isSelected || isOther ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s',
                      borderTop: isOther ? '1px solid var(--border, #e2e8f0)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = 'var(--bg2, #f1f5f9)';
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ width: 16, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      {isSelected && <Check size={13} />}
                    </span>
                    {opt}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
