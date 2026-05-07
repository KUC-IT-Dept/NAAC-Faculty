import { ReactNode } from 'react';

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
