import React, { useEffect, useState } from 'react';

interface ReasonModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  confirmTone?: 'primary' | 'danger';
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
}

// Generic "action + mandatory reason" modal — used for cancellations,
// correction requests, rejections and emergency overrides, matching the
// existing ConfirmDeleteModal's visual language instead of window.prompt.
export const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen, title, description, placeholder = 'Enter a reason…',
  confirmLabel = 'Confirm', confirmTone = 'primary', onConfirm, onCancel,
}) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => { if (isOpen) setReason(''); }, [isOpen]);

  if (!isOpen) return null;

  const submit = async () => {
    if (!reason.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onCancel} disabled={isLoading} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {description && <p className="text-muted text-sm" style={{ marginBottom: 12 }}>{description}</p>}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Reason<span className="required-star">*</span></label>
            <textarea
              className="form-textarea" placeholder={placeholder} value={reason}
              onChange={(e) => setReason(e.target.value)} autoFocus
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button
            type="button" className={`btn ${confirmTone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={submit} disabled={isLoading || !reason.trim()}
          >
            {isLoading ? 'Submitting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export function useReasonModal() {
  const [state, setState] = useState<{
    open: boolean; title: string; description?: string; confirmLabel?: string;
    confirmTone?: 'primary' | 'danger'; onConfirm: (reason: string) => void | Promise<void>;
  } | null>(null);

  const ask = (opts: Omit<NonNullable<typeof state>, 'open'>) => setState({ ...opts, open: true });
  const close = () => setState(null);

  const Modal = state ? (
    <ReasonModal
      isOpen={state.open}
      title={state.title}
      description={state.description}
      confirmLabel={state.confirmLabel}
      confirmTone={state.confirmTone}
      onConfirm={async (reason) => { await state.onConfirm(reason); close(); }}
      onCancel={close}
    />
  ) : null;

  return { ask, ReasonDialog: () => Modal };
}
