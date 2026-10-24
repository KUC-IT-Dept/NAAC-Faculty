// src/pages/admin/DeleteBenchmarkDialog.tsx
//
// Confirmation dialog for permanently deleting ONE benchmark record or ONE catalogue version.
// The administrator must type the identifier shown (e.g. "2.4.2" or "v3") before the Delete button
// is enabled. While the request is running the button is disabled and further clicks are ignored,
// so a double click can never send two DELETE requests. The server re-checks every rule.
import { useRef, useState } from 'react';

export interface DeleteTarget {
  kind: 'record' | 'version';
  /** What the administrator must type to confirm, e.g. "2.4.2" or "v3". */
  confirmWord: string;
  title: string;
  /** Short lines identifying exactly what will be deleted. */
  details: string[];
  /** What is removed and what is deliberately kept. */
  consequences: string[];
}

interface Props {
  target: DeleteTarget;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  /** Failure message from the last attempt (e.g. the server's restriction text). */
  error?: string | null;
}

export default function DeleteBenchmarkDialog({ target, onConfirm, onCancel, error }: Props) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const ok = typed.trim().toLowerCase() === target.confirmWord.toLowerCase();

  const confirm = async () => {
    if (!ok || inFlight.current) return; // second click while the first request runs is ignored
    inFlight.current = true; setBusy(true);
    try { await onConfirm(); } finally { inFlight.current = false; setBusy(false); }
  };

  return (
    <div className="modal-overlay" onClick={() => { if (!busy) onCancel(); }}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="del-bm-title" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3 id="del-bm-title" style={{ margin: 0, color: '#991b1b' }}>{target.title}</h3></div>
        <div className="modal-body" style={{ fontSize: '0.88rem' }}>
          <div data-testid="delete-target" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px', marginBottom: 10 }}>
            {target.details.map((d) => <div key={d}>{d}</div>)}
          </div>
          <ul style={{ margin: '0 0 10px', paddingLeft: 18, color: '#475569' }}>
            {target.consequences.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p style={{ margin: '0 0 4px' }}><b>This cannot be undone.</b> Type <code>{target.confirmWord}</code> to confirm:</p>
          <input aria-label="Type to confirm deletion" autoFocus value={typed} disabled={busy} onChange={(e) => setTyped(e.target.value)}
            style={{ width: '100%', padding: '5px 7px', border: '1px solid #cbd5e1', borderRadius: 4 }} />
          {error && <p role="alert" data-testid="delete-error" style={{ margin: '10px 0 0', color: '#b91c1c' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" disabled={busy} onClick={onCancel}>Cancel</button>{' '}
          <button className="btn btn-primary" style={{ background: '#b91c1c', borderColor: '#b91c1c' }} disabled={!ok || busy} onClick={confirm}>
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
