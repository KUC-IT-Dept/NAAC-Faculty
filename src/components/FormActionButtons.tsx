import React from 'react';
import { Check, X } from 'lucide-react';

export interface FormActionButtonsProps {
  onSave: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  saving?: boolean;
  disabled?: boolean;
  saveButtonStyle?: React.CSSProperties;
  cancelButtonStyle?: React.CSSProperties;
  showCancel?: boolean;
  align?: 'right' | 'left' | 'center' | 'space-between';
  style?: React.CSSProperties;
}

const defaultBtnSave: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  backgroundColor: '#16a34a',
  color: '#ffffff',
  padding: '7px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
};

const defaultBtnCancel: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  backgroundColor: '#fff1f2',
  color: '#9f1239',
  padding: '7px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  border: '1px solid #fecdd3',
  cursor: 'pointer',
};

export default function FormActionButtons({
  onSave,
  onCancel,
  saveText = 'Save',
  cancelText = 'Cancel',
  saving = false,
  disabled = false,
  saveButtonStyle,
  cancelButtonStyle,
  showCancel = true,
  align = 'right',
  style,
}: FormActionButtonsProps) {
  const combinedSaveStyle: React.CSSProperties = {
    ...defaultBtnSave,
    ...saveButtonStyle,
    ...(disabled || saving ? { cursor: 'not-allowed', opacity: 0.6 } : {}),
  };

  const combinedCancelStyle: React.CSSProperties = {
    ...defaultBtnCancel,
    ...cancelButtonStyle,
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : align,
        alignItems: 'center',
        gap: '8px',
        ...style,
      }}
    >
      {showCancel && onCancel && (
        <button type="button" onClick={onCancel} style={combinedCancelStyle}>
          <X size={14} /> {cancelText}
        </button>
      )}
      <button type="button" onClick={onSave} disabled={disabled || saving} style={combinedSaveStyle}>
        {saving ? (
          <>
            <span className="spinner" style={{ width: 13, height: 13 }} /> Saving…
          </>
        ) : (
          <>
            <Check size={14} /> {saveText}
          </>
        )}
      </button>
    </div>
  );
}
